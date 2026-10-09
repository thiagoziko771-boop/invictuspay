const { getSupabase } = require("./lib/supabase");
const credentials = require("./credentials");

const UTMIFY_TOKEN = process.env.UTMIFY_TOKEN || credentials.UTMIFY_TOKEN;

/**
 * Mapeia status Pingupag para status interno
 */
function mapStatus(pingupagStatus) {
  const statusMap = {
    "pending": "pending",
    "approved": "paid",
    "processing": "processing",
    "under_review": "under_review",
    "failed": "rejected",
    "refunded": "refunded",
    "chargeback": "chargeback",
  };
  return statusMap[pingupagStatus] || pingupagStatus;
}

/**
 * Envia dados para UTMify quando pagamento é aprovado
 */
async function notifyUtmifyOnApproval(webhookData) {
  try {
    const amountCents = webhookData.amount;
    const gatewayFeeCents = Math.round(amountCents * 0.02);
    const netCents = amountCents - gatewayFeeCents;

    const payload = {
      orderId: webhookData.transaction_id,
      platform: "Pingupag",
      paymentMethod: "pix",
      status: "paid",
      createdAt: webhookData.timestamp || new Date().toISOString().replace("T", " ").slice(0, 19),
      approvedDate: new Date().toISOString().replace("T", " ").slice(0, 19),
      customer: {
        name: webhookData.customer?.name || null,
        email: webhookData.customer?.email || null,
        phone: webhookData.customer?.phone || null,
        document: webhookData.customer?.document || null,
        country: "BR",
        ip: "177.0.0.1",
      },
      products: [{
        id: "loja-shopify-br-001",
        name: "SHOPIFY LOJA 03",
        quantity: 1,
        priceInCents: amountCents,
      }],
      trackingParameters: {
        utm_source: webhookData.tracking?.utm_source || null,
        utm_campaign: webhookData.tracking?.utm_campaign || null,
        utm_medium: webhookData.tracking?.utm_medium || null,
      },
      commission: {
        totalPriceInCents: amountCents,
        gatewayFeeInCents: gatewayFeeCents,
        userCommissionInCents: netCents,
        currency: "BRL",
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${UTMIFY_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("[UTMify] Notificação enviada:", response.status);
  } catch (error) {
    console.log("[UTMify] Erro ao notificar (não-bloqueante):", error.message);
  }
}

/**
 * Webhook handler para Pingupag
 * Recebe notificações de mudança de status de transação
 */
exports.handler = async (event) => {
  try {
    console.log("[Webhook Pingupag] Recebido:", event.body);

    // Parse do body
    const webhookData = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    // Validação básica
    if (!webhookData.transaction_id || !webhookData.status) {
      console.warn("[Webhook] Dados incompletos:", webhookData);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Dados incompletos" }),
      };
    }

    const transactionId = webhookData.transaction_id;
    const status = webhookData.status;
    const mappedStatus = mapStatus(status);

    console.log(`[Webhook] Atualizando ${transactionId} → ${mappedStatus}`);

    // Atualizar Supabase
    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: mappedStatus,
        paid_at: mappedStatus === "paid" ? new Date().toISOString() : null,
        e2e_id: webhookData.e2e_id || null,
      })
      .eq("transaction_id", transactionId);

    if (updateError) {
      console.error("[Supabase] Erro ao atualizar:", updateError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erro ao salvar no banco" }),
      };
    }

    console.log(`[Supabase] ✓ ${transactionId} atualizado para: ${mappedStatus}`);

    // Se aprovado, notificar UTMify
    if (mappedStatus === "paid") {
      notifyUtmifyOnApproval(webhookData).catch(err => console.error("[UTMify Error]", err));
    }

    // Responder com sucesso ao webhook
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: "Webhook processado com sucesso",
        transaction_id: transactionId,
        status: mappedStatus,
      }),
    };
  } catch (error) {
    console.error("[❌ Webhook Error]", error.message, error.stack);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Erro ao processar webhook",
        message: error.message,
      }),
    };
  }
};
