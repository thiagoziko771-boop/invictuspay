const { getSupabase } = require("./lib/supabase");
const credentials = require("./credentials");

const INVICTUSPAY_BASE = "https://api.invictuspayv2.com.br/api/v1";
const INVICTUSPAY_API_KEY = process.env.INVICTUSPAY_API_KEY || credentials.INVICTUSPAY_API_KEY || "sk_XeHEPgVYP5hSDktcwBniLI1tu6zdTIhQpvSZyVeU2uBj1xuk6TszDHFy";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  console.log("[CHECK-PAYMENT-INVICTUSPAY] ===== FUNÇÃO INICIADA =====");
  console.log("[CHECK-PAYMENT-INVICTUSPAY] Query:", event.queryStringParameters);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: "",
    };
  }

  const transactionId = event.queryStringParameters?.id || event.queryStringParameters?.transaction_id;

  if (!transactionId) {
    console.error("[CHECK-PAYMENT-INVICTUSPAY] Transaction ID não fornecido");
    return jsonResponse(400, {
      success: false,
      error: "Transaction ID é obrigatório",
    });
  }

  console.log("[CHECK-PAYMENT-INVICTUSPAY] Buscando transação:", transactionId);

  try {
    // Primeiro, buscar no Supabase para cache rápido
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (!error && data) {
      console.log("[CHECK-PAYMENT-INVICTUSPAY] ✓ Encontrado no Supabase:", data.status);
      return jsonResponse(200, {
        success: true,
        status: data.status,
        transaction_id: transactionId,
        amount: data.amount,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        paid_at: data.paid_at,
        created_at: data.created_at,
        gateway: data.gateway,
        source: "cache",
      });
    }

    // Se não encontrar em cache, buscar na InvictusPay
    console.log("[CHECK-PAYMENT-INVICTUSPAY] Consultando InvictusPay...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(`${INVICTUSPAY_BASE}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": INVICTUSPAY_API_KEY,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await resp.text();

    if (!resp.ok) {
      console.error("[InvictusPay] Erro HTTP:", resp.status);
      return jsonResponse(resp.status, {
        success: false,
        error: "Transação não encontrada na gateway",
        status: "not_found",
      });
    }

    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[InvictusPay] Parse error");
      return jsonResponse(500, {
        success: false,
        error: "Resposta inválida da gateway",
      });
    }

    const transaction = parsed.transaction || parsed;
    const status = transaction.status || "unknown";

    console.log("[CHECK-PAYMENT-INVICTUSPAY] Status retornado:", status);

    // Salvar/atualizar no Supabase
    try {
      await supabase
        .from("transactions")
        .update({
          status: status,
          paid_at: status === "paid" ? transaction.paid_at : null,
        })
        .eq("transaction_id", transactionId)
        .is("gateway", null); // Só atualizar se ainda não tiver gateway
    } catch (updateErr) {
      console.error("[Supabase] Erro ao atualizar (continuando):", updateErr.message);
    }

    return jsonResponse(200, {
      success: true,
      status,
      transaction_id: transactionId,
      amount: transaction.amount ? Math.round(transaction.amount / 100 * 100) / 100 : null,
      payment_method: transaction.payment_method,
      paid_at: transaction.paid_at,
      created_at: transaction.created_at,
      gateway: "invictuspay",
      source: "live",
    });

  } catch (err) {
    console.error("[CHECK-PAYMENT-INVICTUSPAY] Erro:", err.message);
    return jsonResponse(502, {
      success: false,
      error: "Falha ao conectar com gateway: " + String(err),
    });
  }
};
