# Integração InvictusPay

## Configuração

### 1. Chave de API
A chave API deve estar configurada em uma das seguintes formas:

**Opção A: Variável de Ambiente (Recomendado)**
```bash
INVICTUSPAY_API_KEY=sk_XeHEPgVYP5hSDktcwBniLI1tu6zdTIhQpvSZyVeU2uBj1xuk6TszDHFy
```

**Opção B: Arquivo credentials.js**
```javascript
module.exports = {
  INVICTUSPAY_API_KEY: "sk_XeHEPgVYP5hSDktcwBniLI1tu6zdTIhQpvSZyVeU2uBj1xuk6TszDHFy",
  // ... outras credenciais
};
```

### 2. Endpoints Netlify Functions

Configure em `netlify.toml`:

```toml
[[functions]]
node_bundler = "esbuild"

[functions.pix-invictuspay]
handler = "functions/pix-invictuspay.js"

[functions.check-payment-invictuspay]
handler = "functions/check-payment-invictuspay.js"

[functions.webhook-invictuspay]
handler = "functions/webhook-invictuspay.js"
```

## APIs Disponíveis

### 1. Gerar PIX
**POST** `/.netlify/functions/pix-invictuspay`

Cria uma nova cobrança PIX.

**Request Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "cpf": "12345678909",
  "amount": 65.70,
  "utm": {
    "utm_source": "google",
    "utm_campaign": "campaigns",
    "utm_medium": "cpc"
  }
}
```

**Response (Sucesso 200):**
```json
{
  "success": true,
  "pixCode": "00020126580014br.gov.bcb.brcode...",
  "pix_code": "00020126580014br.gov.bcb.brcode...",
  "transaction_id": "01HZXK3NDEKTSV4RRFFQ69G5FA",
  "status": "pending",
  "amount": 65.70,
  "gateway": "invictuspay"
}
```

**Valores Padrão:**
- R$ 65,70 (primeira taxa)
- R$ 81,50 (upsell, quando amount entre 70-90)

### 2. Verificar Status de Pagamento
**GET** `/.netlify/functions/check-payment-invictuspay?id=TRANSACTION_ID`

Retorna o status atual do pagamento.

**Query Parameters:**
- `id` ou `transaction_id` - ID da transação (obrigatório)

**Response (Sucesso 200):**
```json
{
  "success": true,
  "status": "paid",
  "transaction_id": "01HZXK3NDEKTSV4RRFFQ69G5FA",
  "amount": 65.70,
  "payment_method": "pix",
  "paid_at": "2026-02-06T14:30:00.000Z",
  "created_at": "2026-02-06T14:25:00.000Z",
  "gateway": "invictuspay",
  "source": "live"
}
```

**Status Possíveis:**
- `pending` - Aguardando pagamento
- `processing` - Pagamento em processamento
- `paid` - Pagamento confirmado
- `failed` - Pagamento falhou
- `expired` - Cobrança expirada
- `refunded` - Estornada
- `chargeback` - Chargeback confirmado
- `in_dispute` - Em disputa

### 3. Webhook de Notificação
**POST** `/.netlify/functions/webhook-invictuspay`

Recebe notificações de mudanças de status.

**Headers Esperados:**
```
X-Webhook-Event: EVENT:CHARGE_PAID
Content-Type: application/json
```

**Eventos Suportados:**
- `EVENT:CHARGE_PAID` - Pagamento confirmado
- `EVENT:CHARGE_EXPIRED` - Cobrança expirada
- `EVENT:CHARGE_REFUND` - Estorno processado
- `EVENT:CHARGE_CHARGEBACK` - Chargeback confirmado
- `EVENT:CHARGE_STATUS_CHANGED` - Status alterado

## Integração no Front-end

### Exemplo JavaScript
```javascript
// 1. Gerar PIX
async function gerarPix() {
  const response = await fetch('/.netlify/functions/pix-invictuspay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      cpf: '12345678909'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('PIX Code:', data.pixCode);
    console.log('Transaction ID:', data.transaction_id);
    // Exibir QR Code
  }
}

// 2. Verificar status
async function verificarPagamento(transactionId) {
  const response = await fetch(
    `/.netlify/functions/check-payment-invictuspay?id=${transactionId}`
  );
  
  const data = await response.json();
  console.log('Status:', data.status);
  
  if (data.status === 'paid') {
    console.log('Pagamento confirmado!');
  }
}

// 3. Pool de status (opcional)
async function monitorarPagamento(transactionId) {
  let tentativas = 0;
  const maxTentativas = 120; // 2 horas com 60 segundos de intervalo
  
  const interval = setInterval(async () => {
    tentativas++;
    const data = await verificarPagamento(transactionId);
    
    if (data.status === 'paid') {
      clearInterval(interval);
      console.log('Pagamento confirmado!');
    }
    
    if (tentativas >= maxTentativas) {
      clearInterval(interval);
      console.log('Timeout');
    }
  }, 60000); // a cada 60 segundos
}
```

## Configuração de Webhooks no Painel

1. Acesse a plataforma InvictusPay
2. Navegue para: **Integração → Webhooks**
3. Clique em **Criar webhook**
4. Configure:
   - **Nome:** "PINGUPAG Notification"
   - **URL:** `https://seu-dominio.netlify.app/.netlify/functions/webhook-invictuspay`
   - **Eventos:** Selecione os eventos desejados
5. **Ativar** e **Salvar**

## Tratamento de Erros

### Resposta de Erro HTTP
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "debug": "Detalhes adicionais"
}
```

### Códigos de Erro Comuns

| Código | Significado |
|--------|-------------|
| 400 | Parametros inválidos |
| 401 | Chave API inválida |
| 404 | Transação não encontrada |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |
| 502 | Falha ao conectar com gateway |

## Rate Limit

A API InvictusPay possui limite de:
- **90 requisições por minuto** por conta

Headers em resposta:
```
X-RateLimit-Limit: 90
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707955200
```

## Boas Práticas

1. **Sempre validar** respostas de sucesso (`success: true`)
2. **Usar transaction_id** como chave única
3. **Implementar retry** com backoff exponencial
4. **Cachear** respostas de status quando possível
5. **HTTPS obrigatório** para webhooks
6. **Idempotência** - processar webhooks uma única vez
7. **Logging** de todas as transações para debug

## Troubleshooting

### "INVICTUSPAY_API_KEY não configurada"
- Verifique se a variável de ambiente está definida
- Confirme que o arquivo `credentials.js` existe
- Reinicie a função (Netlify redeploy)

### "Transaction não encontrada"
- Verifique se o transaction_id está correto
- Confirme que a transação foi criada (status 200)
- Aguarde alguns segundos após criação

### "Rate limit exceeded"
- Implemente backoff exponencial
- Use `X-RateLimit-Remaining` para monitorar
- Respeite o `Retry-After` header

## Documentação Oficial

Para mais informações, consulte:
https://api.invictuspayv2.com.br/api/v1/docs

## Suporte

- **Email:** suporte@invictuspay.com.br
- **Status de Webhooks:** Painel InvictusPay → Logs
