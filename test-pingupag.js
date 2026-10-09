/**
 * Script de teste da integração Pingupag
 * Execute com: node test-pingupag.js
 * 
 * Testa:
 * 1. Validação de API Key
 * 2. Geração de PIX
 * 3. Verificação de status
 */

// Simule as variáveis de ambiente
process.env.PINGUPAG_API_KEY = "5a4a884661598e034154315cc12ce8e55ebfd026625c057dcf673b7ca7512384";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://seu-supabase.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "sua-service-role-key";

const PINGUPAG_BASE = "https://app.pingupag.com/gateway/v1";
const PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY;

function getAuthHeader() {
  if (!PINGUPAG_API_KEY) {
    throw new Error("❌ PINGUPAG_API_KEY não configurada!");
  }
  return `pingupag_sk_${PINGUPAG_API_KEY}`;
}

/**
 * Teste 1: Validação de API Key
 */
async function testAPIKey() {
  console.log("\n🧪 TESTE 1: Validação de API Key");
  console.log("─".repeat(50));

  try {
    const apiKey = getAuthHeader();
    console.log("✓ API Key configurada corretamente");
    console.log(`  Formato: ${apiKey.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error("✗ Erro:", error.message);
    return false;
  }
}

/**
 * Teste 2: Geração de PIX
 */
async function testPixGeneration() {
  console.log("\n🧪 TESTE 2: Geração de PIX via Pingupag");
  console.log("─".repeat(50));

  try {
    const apiKey = getAuthHeader();

    const payload = {
      amount: 1000, // R$ 10,00
      description: "SHOPIFY LOJA 03 - Teste",
      reference: `TESTE-${Date.now()}`,
      source: "api_externa",
      customer: {
        name: "Teste Silva",
        email: "teste@example.com",
        phone: "11999999999",
        document: "12345678901",
      },
    };

    console.log("📤 Enviando requisição para Pingupag...");
    console.log(`   POST ${PINGUPAG_BASE}/transaction`);

    const response = await fetch(`${PINGUPAG_BASE}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    console.log(`📥 Status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    if (response.ok && data.status === "success") {
      console.log("✓ PIX gerado com sucesso!");
      console.log(`  Transaction ID: ${data.transaction_id}`);
      console.log(`  Referência: ${data.id}`);
      console.log(`  Valor: R$ ${data.amount / 100}`);
      console.log(`  Expira em: ${data.expires_at}`);
      console.log(`  QR Code: ${data.qr_code.substring(0, 30)}...`);
      return {
        success: true,
        transaction_id: data.transaction_id,
        id: data.id,
      };
    } else {
      console.error("✗ Erro na geração:", data);
      return { success: false };
    }
  } catch (error) {
    console.error("✗ Erro:", error.message);
    return { success: false };
  }
}

/**
 * Teste 3: Consulta de Transação
 */
async function testQueryTransaction(transactionId) {
  console.log("\n🧪 TESTE 3: Consulta de Status de Transação");
  console.log("─".repeat(50));

  if (!transactionId) {
    console.log("⏭️  Pulando teste (nenhuma transação disponível)");
    return;
  }

  try {
    const apiKey = getAuthHeader();

    console.log(`📤 Consultando transação: ${transactionId}`);
    console.log(`   GET ${PINGUPAG_BASE}/query?action=get_transaction&id=${transactionId}`);

    const response = await fetch(
      `${PINGUPAG_BASE}/query?action=get_transaction&id=${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
        },
      }
    );

    console.log(`📥 Status: ${response.status} ${response.statusName}`);

    const data = await response.json();

    if (response.ok) {
      console.log("✓ Transação consultada com sucesso!");
      console.log(`  ID: ${data.id}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Valor: R$ ${data.amount_in_reais || (data.amount / 100)}`);
      console.log(`  Criada em: ${data.created_at}`);
      console.log(`  Atualizada em: ${data.updated_at}`);
    } else {
      console.error("✗ Erro na consulta:", data);
    }
  } catch (error) {
    console.error("✗ Erro:", error.message);
  }
}

/**
 * Teste 4: Dados do Vendedor
 */
async function testSellerData() {
  console.log("\n🧪 TESTE 4: Dados do Vendedor");
  console.log("─".repeat(50));

  try {
    const apiKey = getAuthHeader();

    console.log("📤 Consultando dados do vendedor...");
    console.log(`   GET ${PINGUPAG_BASE}/seller`);

    const response = await fetch(`${PINGUPAG_BASE}/seller`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    console.log(`📥 Status: ${response.status}`);

    const data = await response.json();

    if (response.ok) {
      console.log("✓ Dados do vendedor obtidos!");
      console.log(`  Nome: ${data.name}`);
      console.log(`  Empresa: ${data.company_name || "N/A"}`);
      console.log(`  Documento: ${data.document}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Tipo: ${data.entity_type}`);
    } else {
      console.error("✗ Erro:", data);
    }
  } catch (error) {
    console.error("✗ Erro:", error.message);
  }
}

/**
 * Teste 5: Validação de Estrutura das Funções
 */
function testFunctionStructure() {
  console.log("\n🧪 TESTE 5: Validação de Estrutura das Funções");
  console.log("─".repeat(50));

  const fs = require("fs");
  const path = require("path");

  const files = [
    "./functions/pix-pingupag.js",
    "./functions/check-payment-pingupag.js",
    "./functions/webhook-pingupag.js",
  ];

  let allExist = true;

  files.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`✓ ${file} existe`);
    } else {
      console.log(`✗ ${file} NÃO ENCONTRADO`);
      allExist = false;
    }
  });

  if (allExist) {
    console.log("\n✓ Todas as funções foram criadas com sucesso!");
  } else {
    console.log("\n✗ Alguns arquivos estão faltando!");
  }
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔" + "═".repeat(48) + "╗");
  console.log("║" + " ".repeat(10) + "🔧 TESTES PINGUPAG INTEGRATION" + " ".repeat(8) + "║");
  console.log("╚" + "═".repeat(48) + "╝");

  const apiKeyValid = await testAPIKey();

  if (!apiKeyValid) {
    console.log("\n❌ Teste falhou: Configure PINGUPAG_API_KEY");
    process.exit(1);
  }

  testFunctionStructure();

  const pixResult = await testPixGeneration();

  if (pixResult.success) {
    await testQueryTransaction(pixResult.transaction_id);
  }

  await testSellerData();

  console.log("\n");
  console.log("╔" + "═".repeat(48) + "╗");
  console.log("║" + " ".repeat(15) + "✅ TESTES CONCLUÍDOS" + " ".repeat(13) + "║");
  console.log("╚" + "═".repeat(48) + "╝");
  console.log("\n📋 Próximos passos:");
  console.log("   1. Configure PINGUPAG_API_KEY no Netlify");
  console.log("   2. Configure Webhook URL no painel Pingupag");
  console.log("   3. Faça o deploy com: git push origin main");
  console.log("   4. Teste o fluxo completo no site\n");
}

// Executar testes
runAllTests().catch(console.error);
