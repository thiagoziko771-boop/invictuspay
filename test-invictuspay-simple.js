/**
 * Teste simples de conectividade com InvictusPay
 */

const https = require('https');

const API_KEY = 'sk_XeHEPgVYP5hSDktcwBniLI1tu6zdTIhQpvSZyVeU2uBj1xuk6TszDHFy';
const ENDPOINTS = [
  'https://api.invictuspayv2.com.br/api/v1/transactions',
  'https://api.invictuspayv2.com.br/api/v1/account',
  'https://api.invictuspayv2.com.br/api/v1/balance',
  'https://api.invictuspayv2.com.br/api/v1',
];

function testEndpoint(url, method = 'GET') {
  return new Promise((resolve) => {
    const options = new URL(url);
    
    const req = https.request({
      hostname: options.hostname,
      path: options.pathname + options.search,
      method: method,
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n${method} ${url}`);
        console.log(`Status: ${res.statusCode}`);
        if (data) {
          try {
            console.log('Response:', JSON.stringify(JSON.parse(data), null, 2).substring(0, 200));
          } catch {
            console.log('Response:', data.substring(0, 100));
          }
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`\n${method} ${url}`);
      console.log(`❌ Erro: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

async function run() {
  console.log('Testando conectividade com InvictusPay...\n');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n\n💡 Dica: Se todos retornam 404, a chave pode estar inválida.');
}

run();
