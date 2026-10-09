# 🔌 INTEGRAÇÃO PINGUPAG - GUIA COMPLETO

**Data**: Outubro 2026  
**Gateway**: Pingupag  
**API Key**: Configure no Netlify (PINGUPAG_API_KEY)

---

## ✅ FUNÇÕES CRIADAS

### 1. **Geração de PIX** - `functions/pix-pingupag.js`
- **Endpoint**: `POST /api/pix-pingupag` (ou `POST /.netlify/functions/pix-pingupag`)
- **Descrição**: Gera código PIX (QR Code) via Pingupag
- **Entrada**: Nome, email, telefone, CPF, valor, UTMs
- **Saída**: QR Code, transaction_id, status

**Exemplo de Requisição**:
```bash
curl -X POST https://seu-site.netlify.app/api/pix-pingupag \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpf": "12345678901",
    "amount": 65.70,
    "utm": {
      "utm_source": "google",
      "utm_campaign": "vendas_2026",
      "utm_medium": "cpc"
    }
  }'
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "pixCode": "00020126580014br.gov.bcb.pix0136...",
  "qr_code_base64": "data:image/png;base64,iVBORw0KGgo...",
  "transaction_id": "238",
  "transactionId": "238",
  "reference": "PEDIDO-1728394920-abc123",
  "status": "pending",
  "amount": 65.70,
  "expires_at": "2026-10-02 21:30:00"
}
```

---

### 2. **Verificação de Pagamento** - `functions/check-payment-pingupag.js`
- **Endpoint**: `GET /api/check-payment-pingupag?id=<transaction_id>`
- **Descrição**: Verifica status do pagamento (pending, paid, rejected, etc)
- **Entrada**: transaction_id (query parameter)
- **Saída**: Status atual, dados do cliente, data de pagamento

**Exemplo de Requisição**:
```bash
curl -X GET "https://seu-site.netlify.app/api/check-payment-pingupag?id=238"
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "transaction_id": "238",
  "status": "paid",
  "amount": 65.70,
  "customer_name": "João Silva",
  "customer_email": "joao@example.com",
  "paid_at": "2026-10-01T19:50:22.000Z",
  "gateway": "pingupag",
  "raw_status": "approved"
}
```

---

### 3. **Webhook de Notificação** - `functions/webhook-pingupag.js`
- **Endpoint**: `POST /api/webhook-pingupag` (ou `POST /.netlify/functions/webhook-pingupag`)
- **Descrição**: Recebe notificações da Pingupag quando status muda
- **Integração**: Configure na Pingupag com a URL: `https://seu-site.netlify.app/.netlify/functions/webhook-pingupag`

**Fluxo**:
1. Cliente faz PIX
2. Pingupag confirma o pagamento
3. Pingupag envia POST para o webhook
4. Webhook atualiza status no Supabase
5. Webhook notifica UTMify (se aprovado)

**Payload Recebido**:
```json
{
  "transaction_id": "PINGUPAG_9X2A1B8C",
  "external_id": "PEDIDO-2026-99881",
  "status": "approved",
  "amount": 6570,
  "customer": {
    "name": "João da Silva",
    "email": "joao.silva@exemplo.com",
    "phone": "11999998888",
    "document": "01234567890"
  },
  "pix_code": "00020126580014br.gov.bcb.pix0136...",
  "tracking": {
    "utm_source": "meta",
    "utm_campaign": "vendas_2026"
  },
  "timestamp": "2026-09-13 19:50:22"
}
```

---

## 🔧 CONFIGURAÇÃO NETLIFY

### 1. **Adicione a variável de ambiente**

Acesse: **Settings → Build & Deploy → Environment**

Adicione:
```
PINGUPAG_API_KEY=5a4a884661598e034154315cc12ce8e55ebfd026625c057dcf673b7ca7512384
```

(Remova o prefixo `pingupag_sk_` - o código já adiciona isso automaticamente)

### 2. **Configure o Webhook na Pingupag**

No painel Pingupag:
- Vá em: **Configurações e API** → **Webhooks**
- Adicione URL: `https://seu-site.netlify.app/.netlify/functions/webhook-pingupag`
- Teste a conexão

### 3. **Deploy**

```bash
git add functions/pix-pingupag.js functions/check-payment-pingupag.js functions/webhook-pingupag.js .env.example
git commit -m "feat: add Pingupag gateway integration"
git push origin main
```

Netlify detectará automaticamente os novos endpoints em `/functions` e fará o deploy.

---

## 🔄 FLUXO COMPLETO DE PAGAMENTO

```
1. FRONTEND: Usuário preenche formulário
   ↓
2. FRONTEND: POST /api/pix-pingupag
   ↓
3. BACKEND: pix-pingupag.js executa
   - Valida dados
   - Chama API Pingupag
   - Recebe QR Code
   - Salva no Supabase (status: pending)
   - Notifica UTMify (não-bloqueante)
   ↓
4. FRONTEND: Exibe QR Code ao usuário
   ↓
5. USUARIO: Escaneia QR Code e faz PIX
   ↓
6. PINGUPAG: Recebe confirmação de pagamento
   ↓
7. PINGUPAG: Envia POST para webhook
   ↓
8. BACKEND: webhook-pingupag.js executa
   - Recebe notificação
   - Atualiza Supabase (status: paid)
   - Notifica UTMify
   ↓
9. FRONTEND: Monitora com check-payment-pingupag.js
   - GET /api/check-payment-pingupag?id=<tx_id>
   - Recebe status: "paid"
   - Exibe "Pagamento Confirmado!"
```

---

## 📊 MAPEAMENTO DE STATUS

| Status Pingupag | Status Interno | Descrição |
|---|---|---|
| `pending` | `pending` | Aguardando pagamento |
| `approved` | `paid` | Pagamento confirmado ✓ |
| `processing` | `processing` | Sendo processado |
| `under_review` | `under_review` | Em análise manual |
| `failed` | `rejected` | Pagamento recusado ✗ |
| `refunded` | `refunded` | Estornado |
| `chargeback` | `chargeback` | Contestação bancária |

---

## 💾 BANCO DE DADOS (SUPABASE)

**Tabela**: `transactions`

| Campo | Tipo | Descrição |
|---|---|---|
| `transaction_id` | STRING | ID único da Pingupag |
| `amount` | DECIMAL | Valor em reais |
| `customer_name` | STRING | Nome do cliente |
| `customer_email` | STRING | Email do cliente |
| `customer_cpf` | STRING | CPF do cliente |
| `customer_phone` | STRING | Telefone do cliente |
| `brcode` | STRING | Código PIX (cópia e cola) |
| `status` | STRING | pending/paid/rejected/refunded |
| `utm_source` | STRING | Origem do tráfego |
| `utm_campaign` | STRING | Campanha |
| `utm_medium` | STRING | Meio (cpc, social, etc) |
| `gateway` | STRING | "pingupag" |
| `paid_at` | TIMESTAMP | Data de pagamento |
| `created_at` | TIMESTAMP | Data de criação |
| `e2e_id` | STRING | ID End-to-End do PIX |

---

## 🧪 TESTES

### Teste Local com cURL

**1. Gerar PIX**:
```bash
curl -X POST http://localhost:8888/api/pix-pingupag \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Silva",
    "email": "teste@example.com",
    "phone": "11988888888",
    "amount": 10.00
  }'
```

**2. Verificar Status**:
```bash
curl "http://localhost:8888/api/check-payment-pingupag?id=123"
```

**3. Simular Webhook** (com ngrok):
```bash
curl -X POST http://seu-ngrok-url.ngrok.io/.netlify/functions/webhook-pingupag \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "238",
    "status": "approved",
    "amount": 1000,
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com",
      "document": "12345678901"
    },
    "timestamp": "2026-10-01 19:50:22"
  }'
```

---

## 🔐 SEGURANÇA

✅ **API Key em variáveis de ambiente** (não hardcoded)  
✅ **Timeouts para evitar travamentos** (30s PIX, 10s check)  
✅ **Tratamento de erros não-bloqueador** (UTMify/Supabase)  
✅ **Validação de dados de entrada**  
✅ **CORS habilitado** para requisições do frontend

---

## 🚨 TROUBLESHOOTING

### "PINGUPAG_API_KEY não configurada"
- Verifique se a variável foi adicionada no Netlify
- Redeploy o site após adicionar a variável
- Use apenas a chave sem o prefixo `pingupag_sk_`

### "Transação não encontrada"
- Verifique se o `transaction_id` está correto
- Confirme se a transação foi criada na Pingupag (não na AvenPayments)

### "Erro ao gerar PIX"
- Verifique conexão de internet
- Confirme que o amount é um número válido (ex: 65.70)
- Verifique logs do Netlify (Functions → Logs)

### Webhook não está sendo disparado
- Confirme URL no painel Pingupag
- Teste a URL manualmente com curl (veja em Testes)
- Verifique logs do Netlify

---

## 📚 REFERÊNCIA COMPLETA PINGUPAG

Documentação oficial: https://app.pingupag.com/documentacao

### Endpoints da API Pingupag
- `POST /gateway/v1/transaction` - Criar transação
- `GET /gateway/v1/query?action=get_transaction&id=<id>` - Consultar transação
- `GET /gateway/v1/seller` - Dados do vendedor
- `POST /gateway/v1/refund` - Solicitar reembolso

---

## 📞 PRÓXIMOS PASSOS

1. ✅ **Funções criadas** (pix-pingupag, check-payment-pingupag, webhook-pingupag)
2. ⏳ **Configurar PINGUPAG_API_KEY no Netlify**
3. ⏳ **Configurar Webhook URL no painel Pingupag**
4. ⏳ **Fazer deploy**
5. ⏳ **Testar fluxo completo**

---

**Última atualização**: Outubro 2026  
**Próximo passo**: Configurar variáveis no Netlify e fazer deploy
