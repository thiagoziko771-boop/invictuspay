/**
 * Teste de DEBUG - Ver a resposta bruta da InvictusPay
 */

const INVICTUSPAY_BASE = "https://api.invictuspayv2.com.br/api/v1";
const INVICTUSPAY_API_KEY = "sk_XeHEPgVYP5hSDktcwBniLI1tu6zdTIhQpvSZyVeU2uBj1xuk6TszDHFy";

async function testInvictuspayDebug() {
  console.log("\n🔍 TESTE DEBUG - INVICTUSPAY API");
  console.log("=" .repeat(70));

  const payload = {
    amount: 6570, // R$ 65.70 em centavos
    paymentMethod: "pix",
    customer: {
      name: "Teste Debug",
      email: "teste@debug.com",
      document: "15261638453", // CPF válido
      phone: "11999999999",
    },
    items: [
      {
        description: "SHOPIFY LOJA 03",
        quantity: 1,
        amount: 6570,
        externalRef: "order_test_debug",
      }
    ],
    postbackUrl: "https://cnh-brasil-gov-br.netlify.app/webhook/invictuspay",
    pix: {
      expirationInSeconds: 1800,
    },
  };

  console.log("\n📤 Payload enviado:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const resp = await fetch(`${INVICTUSPAY_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": INVICTUSPAY_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    console.log("\n📊 Status HTTP:", resp.status);
    console.log("📋 Headers:", Object.fromEntries(resp.headers));

    const text = await resp.text();
    console.log("\n📥 Resposta RAW:");
    console.log(text);

    if (text) {
      try {
        const parsed = JSON.parse(text);
        console.log("\n✅ Parsed JSON:");
        console.log(JSON.stringify(parsed, null, 2));

        // Verificar estrutura
        console.log("\n🔎 Estrutura:");
        console.log("parsed.transaction?", !!parsed.transaction);
        console.log("parsed.transaction?.id?", parsed.transaction?.id);
        console.log("parsed.transaction?.pix?", !!parsed.transaction?.pix);
        console.log("parsed.transaction?.pix?.qr_code?", parsed.transaction?.pix?.qr_code);
        console.log("parsed.transaction?.pix?.brcode?", parsed.transaction?.pix?.brcode);
        console.log("parsed.id?", parsed.id);
        console.log("parsed.pix?", !!parsed.pix);
        console.log("parsed.qr_code?", parsed.qr_code);
      } catch (e) {
        console.log("❌ Erro ao fazer parse:", e.message);
      }
    }

  } catch (err) {
    console.error("❌ Erro na requisição:", err.message);
  }
}

testInvictuspayDebug();
