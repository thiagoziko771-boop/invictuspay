const PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY || "YOUR_API_KEY_HERE";
const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";

async function testFullFlow() {
  console.log("========================================");
  console.log("🚀 TESTE COMPLETO - FLUXO PINGUPAG");
  console.log("========================================\n");

  try {
    // STEP 1: Gerar PIX
    console.log("1️⃣ GERANDO PIX DE R$ 65,70...\n");
    
    const pixPayload = {
      amount: 6570,
      description: "SHOPIFY LOJA 03",
      reference: `PEDIDO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: "api_externa",
      customer: {
        name: "Cliente Teste Full Flow",
        email: "teste@example.com",
        phone: "11999999999",
        document: "12345678901",
      },
      postback_url: "https://cnh-brasil-gov-br.netlify.app/webhook/pingupag",
      tracking: {
        utm_source: "test",
        utm_campaign: "test_full_flow",
        utm_medium: "direct",
        utm_content: null,
        utm_term: null,
      },
    };

    const pixResponse = await fetch(`${PINGUPAG_BASE}/transaction`, {
      method: "POST",
      headers: {
        "X-API-Key": PINGUPAG_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pixPayload),
    });

    if (!pixResponse.ok) {
      throw new Error(`Erro ao gerar PIX: ${pixResponse.status}`);
    }

    const pixData = await pixResponse.json();
    console.log("✅ PIX Gerado com Sucesso!");
    console.log(`   ID da Transação: ${pixData.transaction_id}`);
    console.log(`   Reference: ${pixData.id}`);
    console.log(`   Status: ${pixData.payment_status}`);
    console.log(`   Valor: R$ ${(pixData.amount / 100).toFixed(2)}`);
    console.log(`   QR Code: ${pixData.qr_code.substring(0, 50)}...`);
    console.log();

    const transactionId = pixData.transaction_id;

    // STEP 2: Verificar status do PIX
    console.log("2️⃣ VERIFICANDO STATUS DO PIX...\n");
    
    const checkResponse = await fetch(
      `${PINGUPAG_BASE}/query?action=get_transaction&id=${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": PINGUPAG_API_KEY,
        },
      }
    );

    if (!checkResponse.ok) {
      throw new Error(`Erro ao verificar status: ${checkResponse.status}`);
    }

    const checkData = await checkResponse.json();
    console.log("✅ Status Consultado com Sucesso!");
    console.log(`   ID: ${checkData.id || transactionId}`);
    console.log(`   Status: ${checkData.status}`);
    console.log(`   Valor: R$ ${(checkData.amount / 100).toFixed(2)}`);
    console.log();

    // STEP 3: Tentar obter detalhes da transação
    console.log("3️⃣ OBTENDO DETALHES DA TRANSAÇÃO...\n");
    
    const listResponse = await fetch(
      `${PINGUPAG_BASE}/query?action=list_transactions`,
      {
        method: "GET",
        headers: {
          "X-API-Key": PINGUPAG_API_KEY,
        },
      }
    );

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log("✅ Lista de Transações Obtida!");
      console.log(`   Total de transações: ${Array.isArray(listData) ? listData.length : 'N/A'}`);
      
      // Encontrar a transação que acabamos de gerar
      if (Array.isArray(listData)) {
        const recentTx = listData.find(tx => tx.id === transactionId || tx.transaction_id === transactionId);
        if (recentTx) {
          console.log(`   ✓ Transação gerada encontrada na lista!`);
        }
      }
    } else {
      console.log("⚠️  Não foi possível listar transações");
    }
    console.log();

    // RESUMO FINAL
    console.log("========================================");
    console.log("✅ TESTE COMPLETO - TUDO FUNCIONANDO!");
    console.log("========================================");
    console.log(`\n📊 Resumo:
   ✓ API Key autenticada
   ✓ PIX gerado com sucesso (R$ 65,70)
   ✓ Status verificado
   ✓ Gateway Pingupag respondendo corretamente
   
🎯 Próximos passos:
   1. Deployar no Netlify
   2. Testar via frontend em pix-pingupag.html
   3. Validar webhook de pagamento
   
📍 ID da Transação para testes: ${transactionId}\n`);

  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error.message);
    process.exit(1);
  }
}

testFullFlow();
