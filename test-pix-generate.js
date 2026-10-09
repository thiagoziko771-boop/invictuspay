/**
 * Teste de Geração de PIX na Gateway Pingupag
 * Gera um PIX real para teste
 */

const credentials = require('./functions/credentials');

const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";
const PINGUPAG_API_KEY = credentials.PINGUPAG_API_KEY;

async function generatePIX() {
  console.log("🔓 PIX GENERATION TEST");
  console.log("=====================================\n");

  if (!PINGUPAG_API_KEY) {
    console.error("❌ API Key not found!");
    process.exit(1);
  }

  console.log("✓ API Key loaded");
  console.log(`✓ Gateway: ${PINGUPAG_BASE}\n`);

  try {
    console.log("📤 Generating PIX for R$ 65.70...\n");

    const pixPayload = {
      amount: 6570, // R$ 65.70 em centavos
      description: "SHOPIFY LOJA 03 - TESTE",
      reference: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: "api_externa",
      customer: {
        name: "Cliente Teste",
        email: "teste@example.com",
        phone: "11999999999",
        document: "12345678901",
      },
      postback_url: "https://cnh-brasil-gov-br.netlify.app/webhook/pingupag",
    };

    console.log("📋 Payload:");
    console.log(JSON.stringify(pixPayload, null, 2));
    console.log();

    const response = await fetch(`${PINGUPAG_BASE}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PINGUPAG_API_KEY,
      },
      body: JSON.stringify(pixPayload),
    });

    console.log(`📊 Response Status: ${response.status}\n`);

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ ERRO:");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log("✅ PIX GERADO COM SUCESSO!\n");
    console.log("📋 DADOS DA TRANSAÇÃO:");
    console.log("─".repeat(50));
    console.log(`🆔 ID: ${data.transaction_id || data.id}`);
    console.log(`💰 Valor: R$ ${(data.amount / 100).toFixed(2)}`);
    console.log(`📌 Status: ${data.payment_status || data.status}`);
    console.log(`⏰ Criado em: ${data.created_at || new Date().toISOString()}`);
    console.log();

    if (data.qr_code) {
      console.log("📱 QR CODE (PIX Cópia e Cola):");
      console.log("─".repeat(50));
      console.log(data.qr_code);
      console.log();
    }

    if (data.qr_code_base64) {
      console.log("🖼️ QR CODE BASE64:");
      console.log("─".repeat(50));
      console.log(data.qr_code_base64.substring(0, 100) + "...");
      console.log();
    }

    console.log("📊 RESPOSTA COMPLETA:");
    console.log("─".repeat(50));
    console.log(JSON.stringify(data, null, 2));
    console.log();

    console.log("✅ TESTE CONCLUÍDO COM SUCESSO!");
    console.log("🎉 PIX pronto para usar!\n");

  } catch (error) {
    console.error("❌ ERRO:", error.message);
    console.error(error);
    process.exit(1);
  }
}

generatePIX();
