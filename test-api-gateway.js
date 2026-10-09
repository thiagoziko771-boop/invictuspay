const PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY || "YOUR_API_KEY_HERE";
const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";

async function testGateway() {
  console.log("🔍 Testando conexão com Pingupag Gateway...\n");

  try {
    // Teste 1: Get Vendor
    console.log("1️⃣ Teste: GET /query?action=get_vendor");
    const vendorResponse = await fetch(`${PINGUPAG_BASE}/query?action=get_vendor`, {
      method: "GET",
      headers: {
        "X-API-Key": PINGUPAG_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log(`Status: ${vendorResponse.status}`);
    const vendorData = await vendorResponse.json();
    console.log("Response:", JSON.stringify(vendorData, null, 2));
    console.log();

    if (vendorResponse.ok) {
      console.log("✅ Autenticação OK! Gateway respondeu com sucesso.\n");
    } else {
      console.log("❌ Erro na autenticação:", vendorData);
      console.log();
    }

    // Teste 2: Tentar gerar um PIX
    console.log("2️⃣ Teste: POST /transaction - Gerar PIX de teste");
    const pixPayload = {
      amount: 6570, // R$ 65,70
      description: "TESTE API",
      reference: `TESTE-${Date.now()}`,
      source: "api_externa",
      customer: {
        name: "Cliente Teste",
        email: "teste@example.com",
        phone: "11999999999",
        document: "12345678901",
      },
    };

    console.log("Payload:", JSON.stringify(pixPayload, null, 2));

    const pixResponse = await fetch(`${PINGUPAG_BASE}/transaction`, {
      method: "POST",
      headers: {
        "X-API-Key": PINGUPAG_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pixPayload),
    });

    console.log(`\nStatus: ${pixResponse.status}`);
    const pixData = await pixResponse.json();
    console.log("Response:", JSON.stringify(pixData, null, 2));
    console.log();

    if (pixResponse.ok) {
      console.log("✅ PIX gerado com sucesso!");
      console.log(`   ID: ${pixData.id}`);
      console.log(`   QR Code: ${pixData.qr_code}`);
    } else {
      console.log("❌ Erro ao gerar PIX:", pixData);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

testGateway();
