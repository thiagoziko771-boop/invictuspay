const { getSupabase } = require("./lib/supabase");
const credentials = require("./credentials");

const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";
const PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY || credentials.PINGUPAG_API_KEY;
const UTMIFY_TOKEN = process.env.UTMIFY_TOKEN || credentials.UTMIFY_TOKEN;

function getAuthHeader() {
  if (!PINGUPAG_API_KEY) {
    throw new Error("❌ PINGUPAG_API_KEY não configurada!");
  }
  return PINGUPAG_API_KEY;
}

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
 * Envia dados de pagamento para UTMify
 */
async function sendUtmifyPaid(transactionData) {
  try {
    const amountCents = transactionData.amount;
    const gatewayFeeCents = Math.round(amountCents * 0.02);
    const netCents = amountCents - gatewayFeeCents;

    const payload = {
      orderId: transactionData.transaction_id,
      platform: "Pingupag",
      paymentMethod: "pix",
      status: "paid",
      createdAt: transactionData.created_at || new Date().toISOString().replace("T", " ").slice(0, 19),
      approvedDate: new Date().toISOString().replace("T", " ").slice(0, 19),
      customer: {
        name: transactionData.customer_name || null,
        email: transactionData.customer_email || null,
        phone: transactionData.customer_phone || null,
        document: transactionData.customer_cpf || null,
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
        utm_source: transactionData.utm_source || null,
        utm_campaign: transactionData.utm_campaign || null,
        utm_medium: transactionData.utm_medium || null,
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
    console.log("[UTMify] Pagamento notificado:", response.status);
  } catch (error) {
    console.log("[UTMify] Erro ao notificar (não-bloqueante):", error.message);
  }
}

/**
 * Handler da função Netlify para verificar pagamento
 */
exports.handler = async (event) => {
  try {
    // Extração do ID da transação
    const transactionId = event.queryStringParameters?.id || event.queryStringParameters?.transaction_id;

    if (!transactionId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          error: "ID da transação não informado",
        }),
      };
    }

    console.log(`[Pingupag] Verificando pagamento: ${transactionId}`);

    // Buscar na Supabase primeiro (cache rápido)
    const supabase = getSupabase();
    const { data: supabaseData, error: supabaseError } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (!supabaseError && supabaseData) {
      console.log("[Supabase] Transação encontrada:", supabaseData.status);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: true,
          transaction_id: supabaseData.transaction_id,
          status: supabaseData.status,
          amount: supabaseData.amount,
          customer_name: supabaseData.customer_name,
          customer_email: supabaseData.customer_email,
          paid_at: supabaseData.paid_at,
          gateway: supabaseData.gateway,
        }),
      };
    }

    // Se não encontrou no Supabase, buscar na Pingupag
    const apiKey = getAuthHeader();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    console.log("[Pingupag] Consultando na gateway...");
    const pingupagResponse = await fetch(
      `${PINGUPAG_BASE}/query?action=get_transaction&id=${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!pingupagResponse.ok) {
      if (pingupagResponse.status === 404) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            success: false,
            error: "Transação não encontrada",
          }),
        };
      }

      const errorText = await pingupagResponse.text();
      console.error("[Pingupag] Erro:", pingupagResponse.status, errorText);

      return {
        statusCode: pingupagResponse.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          error: "Erro ao consultar transação",
          debug: errorText,
        }),
      };
    }

    const pingupagData = await pingupagResponse.json();
    const mappedStatus = mapStatus(pingupagData.status);

    console.log("[Pingupag] Status:", pingupagData.status, "→", mappedStatus);

    // Atualizar Supabase com status mais recente
    try {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: mappedStatus,
          paid_at: mappedStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("transaction_id", transactionId);

      if (updateError) {
        console.error("[Supabase] Erro ao atualizar:", updateError.message);
      } else {
        console.log("[Supabase] Status atualizado para:", mappedStatus);

        // Se foi aprovado, notificar UTMify
        if (mappedStatus === "paid") {
          const { data: txData } = await supabase
            .from("transactions")
            .select("*")
            .eq("transaction_id", transactionId)
            .single();

          if (txData) {
            sendUtmifyPaid(txData).catch(err => console.error("[UTMify] Erro:", err.message));
          }
        }
      }
    } catch (error) {
      console.error("[Supabase] Erro (não-bloqueante):", error.message);
    }

    // Resposta de sucesso
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        transaction_id: pingupagData.id,
        status: mappedStatus,
        amount: pingupagData.amount_in_reais ? parseFloat(pingupagData.amount_in_reais.replace(",", ".")) : pingupagData.amount / 100,
        customer_data: pingupagData.customer_data,
        created_at: pingupagData.created_at,
        updated_at: pingupagData.updated_at,
        raw_status: pingupagData.status,
        gateway: "pingupag",
      }),
    };
  } catch (error) {
    console.error("[❌ Erro]", error.message);

    let errorMsg = "Erro ao verificar pagamento";
    if (error.name === "AbortError") {
      errorMsg = "Timeout na comunicação com gateway";
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: errorMsg,
        debug: error.message,
      }),
    };
  }
};
