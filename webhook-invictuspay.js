const { getSupabase } = require("./lib/supabase");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  console.log("[WEBHOOK-INVICTUSPAY] ===== WEBHOOK RECEBIDO =====");
  console.log("[WEBHOOK-INVICTUSPAY] Method:", event.httpMethod);
  console.log("[WEBHOOK-INVICTUSPAY] Headers:", event.headers);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Event",
      },
      body: "",
    };
  }

  let payload = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    console.error("[WEBHOOK-INVICTUSPAY] Parse error:", err.message);
    return jsonResponse(400, { success: false, error: "Invalid JSON" });
  }

  console.log("[WEBHOOK-INVICTUSPAY] Event:", payload.event);
  console.log("[WEBHOOK-INVICTUSPAY] Transaction ID:", payload.transaction?.id);

  // Validar header do evento
  const webhookEvent = event.headers["x-webhook-event"];
  console.log("[WEBHOOK-INVICTUSPAY] X-Webhook-Event header:", webhookEvent);

  // Processar baseado no tipo de evento
  const eventType = payload.event || webhookEvent;

  if (!eventType) {
    console.warn("[WEBHOOK-INVICTUSPAY] Nenhum tipo de evento identificado");
    return jsonResponse(400, { success: false, error: "No event type" });
  }

  const transaction = payload.transaction || {};
  const transactionId = transaction.id;
  const status = transaction.status;

  if (!transactionId) {
    console.warn("[WEBHOOK-INVICTUSPAY] Transaction ID não encontrado");
    return jsonResponse(400, { success: false, error: "No transaction ID" });
  }

  try {
    const supabase = getSupabase();

    switch (eventType) {
      case "EVENT:CHARGE_PAID":
        console.log("[WEBHOOK-INVICTUSPAY] Pagamento confirmado:", transactionId);
        await supabase
          .from("transactions")
          .update({
            status: "paid",
            paid_at: transaction.paid_at || new Date().toISOString(),
          })
          .eq("transaction_id", transactionId);
        break;

      case "EVENT:CHARGE_EXPIRED":
        console.log("[WEBHOOK-INVICTUSPAY] Cobrança expirada:", transactionId);
        await supabase
          .from("transactions")
          .update({
            status: "expired",
          })
          .eq("transaction_id", transactionId);
        break;

      case "EVENT:CHARGE_REFUND":
        console.log("[WEBHOOK-INVICTUSPAY] Estorno processado:", transactionId);
        await supabase
          .from("transactions")
          .update({
            status: "refunded",
            refund_amount: transaction.refund_amount,
            refund_reason: transaction.refund_reason,
            refunded_at: transaction.refunded_at,
          })
          .eq("transaction_id", transactionId);
        break;

      case "EVENT:CHARGE_CHARGEBACK":
        console.log("[WEBHOOK-INVICTUSPAY] Chargeback confirmado:", transactionId);
        await supabase
          .from("transactions")
          .update({
            status: "chargeback",
          })
          .eq("transaction_id", transactionId);
        break;

      case "EVENT:CHARGE_STATUS_CHANGED":
        console.log("[WEBHOOK-INVICTUSPAY] Status alterado para:", status);
        await supabase
          .from("transactions")
          .update({
            status: status || "processing",
          })
          .eq("transaction_id", transactionId);
        break;

      default:
        console.log("[WEBHOOK-INVICTUSPAY] Evento desconhecido:", eventType);
        // Não falhar por evento desconhecido
    }

    console.log("[WEBHOOK-INVICTUSPAY] ✓ Webhook processado com sucesso");
    return jsonResponse(200, {
      success: true,
      event: eventType,
      transaction_id: transactionId,
    });

  } catch (err) {
    console.error("[WEBHOOK-INVICTUSPAY] Erro ao processar:", err.message);
    return jsonResponse(500, {
      success: false,
      error: "Internal server error",
      debug: err.message,
    });
  }
};
