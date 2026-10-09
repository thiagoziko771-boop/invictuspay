/**
 * Teste da função Netlify localmente
 * Simula o comportamento da função pix-pingupag
 */

// Simular o environment
process.env.PINGUPAG_API_KEY = process.env.PINGUPAG_API_KEY || "YOUR_API_KEY_HERE";

// Mock do Supabase para evitar dependências
const mockSupabase = {
  from: () => ({
    insert: async () => ({ data: null, error: null })
  })
};

// Mockar o require da lib/supabase
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === './lib/supabase') {
    return { getSupabase: () => mockSupabase };
  }
  return originalRequire.apply(this, arguments);
};

// Carregar a função
const handler = require('./functions/pix-pingupag').handler;

async function testFunction() {
  console.log("🧪 Testando função Netlify localmente...\n");

  const mockEvent = {
    body: JSON.stringify({
      nome: "Teste Local",
      email: "teste@example.com",
      phone: "11999999999",
      cpf: null,
      utm: {
        utm_source: "test",
        utm_campaign: "test_local",
        utm_medium: "direct"
      }
    })
  };

  try {
    console.log("📤 Chamando handler com payload de teste...\n");
    const response = await handler(mockEvent);
    
    console.log("✅ Resposta da Função:");
    console.log(`   Status Code: ${response.statusCode}`);
    
    const body = JSON.parse(response.body);
    
    if (response.statusCode === 200) {
      console.log(`   ✓ Success: ${body.success}`);
      console.log(`   ✓ Transaction ID: ${body.transaction_id}`);
      console.log(`   ✓ Amount: R$ ${body.amount}`);
      console.log(`   ✓ Status: ${body.status}`);
      console.log("\n✅ FUNÇÃO FUNCIONANDO PERFEITAMENTE!");
    } else {
      console.log("❌ Erro na resposta:");
      console.log(`   Error: ${body.error}`);
      console.log(`   Debug: ${body.debug}`);
    }
    
  } catch (error) {
    console.error("❌ ERRO:", error.message);
    console.error(error);
  }
}

testFunction();
