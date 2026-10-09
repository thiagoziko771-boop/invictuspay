/**
 * Teste de Integração InvictusPay
 * Valida a conexão e gera um PIX na gateway
 */

const https = require('https');
const url = require('url');

const API_KEY = 'sk_XeHEPgVYP5hSDktcwBniLI1tu6zdTIhQpvSZyVeU2uBj1xuk6TszDHFy';
const BASE_URL = 'https://api.invictuspayv2.com.br/api/v1';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = BASE_URL + path;
    const urlObj = new url.URL(fullUrl);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': API_KEY,
        'Accept': 'application/json',
      },
    };

    console.log(`\n📡 ${method} ${path}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✓ Status: ${res.statusCode}`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Response:', JSON.stringify(parsed, null, 2));
          } else {
            console.log('Error:', JSON.stringify(parsed, null, 2));
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          console.log(`✓ Status: ${res.statusCode}`);
          console.log('Response (raw):', data.substring(0, 500));
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000);

    if (body) {
      console.log('Body:', JSON.stringify(body, null, 2));
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAccount() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 1: Verificar Conta');
  console.log('='.repeat(60));
  
  try {
    const result = await makeRequest('GET', '/account');
    return result.status === 200;
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

async function testBalance() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 2: Verificar Saldo');
  console.log('='.repeat(60));
  
  try {
    const result = await makeRequest('GET', '/balance');
    if (result.data?.balance) {
      const balanceBRL = result.data.balance / 100;
      console.log(`💰 Saldo disponível: R$ ${balanceBRL.toFixed(2)}`);
    }
    return result.status === 200;
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

async function testCreateTransaction() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE: Criar Transação PIX');
  console.log('='.repeat(60));
  
  const randId = Math.random().toString(36).slice(2, 10);
  const amountCents = 6570; // R$ 65,70

  const payload = {
    amount: amountCents,
    paymentMethod: 'pix',
    customer: {
      name: 'Teste InvictusPay',
      email: `teste${randId}@example.com`,
      document: '12345678909',
      phone: '11999999999',
    },
    items: [
      {
        description: 'Teste de Integração',
        quantity: 1,
        amount: amountCents,
        externalRef: `order_${randId}`,
      }
    ],
    postbackUrl: 'https://cnh-brasil-gov-br.netlify.app/webhook/invictuspay',
    pix: {
      expirationInSeconds: 1800,
    },
  };

  try {
    const result = await makeRequest('POST', '/transactions', payload);
    
    if (result.status === 200 || result.status === 201) {
      // A resposta pode ter a estrutura: { success: true, data: { transaction: ... } }
      const data = result.data.data || result.data.transaction || result.data;
      const transactionId = data?.id || data?.transaction?.id;
      const pixCode = data?.pix?.qr_code || data?.pix?.brcode || data?.qr_code || null;

      if (transactionId && pixCode) {
        console.log('\n✅ PIX GERADO COM SUCESSO');
        console.log(`📍 Transaction ID: ${transactionId}`);
        console.log(`💳 PIX Code (primeiros 50 chars):\n${pixCode.substring(0, 50)}...`);
        console.log(`💳 PIX Code Completo:\n${pixCode}`);
        console.log(`⏱️  Expira em: 30 minutos`);
        console.log(`💰 Valor: R$ ${(amountCents / 100).toFixed(2)}`);
        
        return {
          success: true,
          transactionId,
          pixCode,
          amount: amountCents / 100,
        };
      } else {
        console.error('❌ PIX incompleto:', { transactionId, pixCode: !!pixCode });
        console.error('Full response:', JSON.stringify(result.data, null, 2));
        return null;
      }
    } else {
      console.error(`❌ Erro HTTP ${result.status}`);
      console.error('Response:', JSON.stringify(result.data, null, 2));
      return null;
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return null;
  }
}

async function testCheckTransaction(transactionId) {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 4: Verificar Status da Transação');
  console.log('='.repeat(60));
  
  try {
    const result = await makeRequest('GET', `/transactions/${transactionId}`);
    
    if (result.status === 200) {
      const tx = result.data.transaction || result.data;
      console.log(`📊 Status: ${tx.status}`);
      console.log(`💰 Valor: R$ ${(tx.amount / 100).toFixed(2)}`);
      console.log(`📅 Criado em: ${tx.created_at}`);
      
      return true;
    } else {
      console.error(`❌ Erro HTTP ${result.status}`);
      return false;
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

async function testListTransactions() {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE 5: Listar Transações');
  console.log('='.repeat(60));
  
  try {
    const result = await makeRequest('GET', '/transactions?page=1&per_page=5');
    
    if (result.status === 200) {
      const transactions = result.data.transactions || result.data.data || [];
      console.log(`📋 Total de transações: ${transactions.length}`);
      
      if (transactions.length > 0) {
        console.log('\n🔍 Últimas 3 transações:');
        transactions.slice(0, 3).forEach((tx, idx) => {
          console.log(`  ${idx + 1}. ID: ${tx.id}`);
          console.log(`     Status: ${tx.status}`);
          console.log(`     Valor: R$ ${(tx.amount / 100).toFixed(2)}`);
        });
      }
      
      return true;
    } else {
      console.error(`❌ Erro HTTP ${result.status}`);
      return false;
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('█  TESTES DE INTEGRAÇÃO - INVICTUSPAY');
  console.log('█'.repeat(60));
  console.log(`🕐 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(-10)}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const results = {
    createTransaction: false,
    checkTransaction: false,
    listTransactions: false,
  };

  // Teste 1: Criar transação (principal)
  const txResult = await testCreateTransaction();
  results.createTransaction = !!txResult;

  if (!results.createTransaction) {
    console.error('\n❌ Falha ao criar transação. Verifique a chave API.');
    process.exit(1);
  }

  // Teste 2: Verificar transação (se criou)
  if (txResult) {
    results.checkTransaction = await testCheckTransaction(txResult.transactionId);
  }

  // Teste 3: Listar transações
  results.listTransactions = await testListTransactions();

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${test}`);
  });

  console.log(`\n📊 Resultado: ${passed}/${total} testes passaram`);
  console.log(`🕐 Finalizado em: ${new Date().toLocaleString('pt-BR')}`);

  if (passed === total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Integração OK.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Alguns testes falharam.');
    process.exit(1);
  }
}

// Executar
runAllTests().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
