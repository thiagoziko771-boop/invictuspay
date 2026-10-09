# ✅ CHECKLIST DE DEPLOYMENT - PINGUPAG

**Data**: Outubro 2026  
**Status**: 🟢 PRONTO PARA DEPLOY  
**API Key**: Configurada nas variáveis de ambiente do Netlify (use `PINGUPAG_API_KEY`)

---

## ✅ VERIFICAÇÕES PRÉ-DEPLOYMENT

- [x] **Funções Criadas**
  - [x] `functions/pix-pingupag.js` - Geração de PIX
  - [x] `functions/check-payment-pingupag.js` - Verificação de status
  - [x] `functions/webhook-pingupag.js` - Recebimento de webhooks

- [x] **Documentação Criada**
  - [x] `PINGUPAG_INTEGRATION.md` - Guia completo
  - [x] `test-pingupag.js` - Script de testes

- [x] **Testes Executados** (✅ TODOS PASSARAM)
  - [x] ✓ API Key validada
  - [x] ✓ Estrutura das funções validada
  - [x] ✓ PIX gerado com sucesso (ID: `PINTF43MIZG`)
  - [x] ✓ Transação consultada com sucesso
  - [x] ✓ Dados do vendedor obtidos

---

## 🔧 STEP 1: CONFIGURAR NETLIFY

### 1.1 Adicione a Variável de Ambiente

1. Acesse: https://app.netlify.com
2. Selecione seu site
3. **Settings → Build & Deploy → Environment**
4. Clique em **Add environment variable**

**Adicione**:
```
PINGUPAG_API_KEY = 5a4a884661598e034154315cc12ce8e55ebfd026625c057dcf673b7ca7512384
```

**Importante**: 
- ✓ Use APENAS a chave sem `pingupag_sk_` (o código adiciona automaticamente)
- ✓ Redeploy após adicionar (verá "Last build updated")

### 1.2 Verificação Netlify

```bash
# Após adicionar a variável, redeploy:
# Settings → Deploys → Deploy site
```

Resultado esperado: Netlify detecta novos endpoints:
```
✓ /.netlify/functions/pix-pingupag
✓ /.netlify/functions/check-payment-pingupag
✓ /.netlify/functions/webhook-pingupag
```

---

## 🔧 STEP 2: CONFIGURAR WEBHOOK NO PAINEL PINGUPAG

### 2.1 Acesse o Painel Pingupag

1. Vá em: https://app.pingupag.com
2. Login com suas credenciais
3. Menu: **Configurações e API** → **Webhooks**

### 2.2 Registre a URL do Webhook

Clique em **Adicionar Webhook** e configure:

**Nome**: `AVENPAY Webhook`

**URL**: 
```
https://seu-site.netlify.app/.netlify/functions/webhook-pingupag
```

(Substitua `seu-site` pelo nome real do seu site Netlify)

**Eventos**: Marque:
- ✓ Transação Criada
- ✓ Transação Aprovada
- ✓ Transação Recusada
- ✓ Transação Refundada

### 2.3 Teste a URL

Pingupag oferece opção de **"Enviar Teste"**. Você receberá:
```json
{
  "success": true,
  "message": "Webhook processado com sucesso",
  "transaction_id": "...",
  "status": "pending"
}
```

✓ Se receber `"success": true`, está configurado corretamente.

---

## 📤 STEP 3: FAZER COMMIT E PUSH

```bash
# 1. Stage dos arquivos
git add \
  functions/pix-pingupag.js \
  functions/check-payment-pingupag.js \
  functions/webhook-pingupag.js \
  PINGUPAG_INTEGRATION.md \
  PINGUPAG_DEPLOY_CHECKLIST.md \
  test-pingupag.js \
  .env.example

# 2. Commit
git commit -m "🔌 feat: integrate Pingupag gateway

- Add pix-pingupag.js for PIX generation
- Add check-payment-pingupag.js for status check
- Add webhook-pingupag.js for payment notifications
- Add comprehensive documentation and tests
- Supports: QR Code, transaction tracking, UTM parameters
- Integration with Supabase and UTMify"

# 3. Push para main
git push origin main
```

**Resultado**: Netlify detectará automaticamente e fará redeploy:
```
✅ Functions detected and deployed
✅ Build successful in 45s
```

---

## 🧪 STEP 4: TESTAR FLUXO COMPLETO

### 4.1 Teste no Ambiente Staging (Netlify Preview)

```bash
# Gerar PIX
curl -X POST https://seu-site.netlify.app/.netlify/functions/pix-pingupag \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Silva",
    "email": "teste@example.com",
    "phone": "11988888888",
    "amount": 10.00,
    "utm": {
      "utm_source": "test",
      "utm_campaign": "test_campaign"
    }
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "pixCode": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "transaction_id": "PIX...",
  "status": "pending",
  "amount": 10.00
}
```

### 4.2 Verificar Status

```bash
curl "https://seu-site.netlify.app/.netlify/functions/check-payment-pingupag?id=PIX..."
```

**Resposta esperada**:
```json
{
  "success": true,
  "status": "pending",
  "amount": 10.00,
  "gateway": "pingupag"
}
```

### 4.3 Monitorar Webhook

Logs do Netlify:
```bash
# Settings → Deploys → Function logs
```

Quando webhook é disparado, você verá:
```
[Webhook Pingupag] Recebido: {...}
[Webhook] Atualizando <id> → paid
[Supabase] ✓ <id> atualizado para: paid
[UTMify] Notificação enviada: 200
```

---

## 🎯 ENDPOINTS ATIVOS APÓS DEPLOY

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/.netlify/functions/pix-pingupag` | `POST` | Gera PIX/QR Code |
| `/.netlify/functions/check-payment-pingupag` | `GET` | Verifica status |
| `/.netlify/functions/webhook-pingupag` | `POST` | Recebe notificações |

---

## 🚨 TROUBLESHOOTING

### ❌ "PINGUPAG_API_KEY não configurada"

**Causa**: Variável não foi configurada ou não fez redeploy

**Solução**:
```bash
# 1. Confirme no Netlify: Settings → Build & Deploy → Environment
# 2. Redeploy manual: Settings → Deploys → Deploy site
# 3. Aguarde build terminar
```

### ❌ "Webhook não está sendo disparado"

**Causa**: URL incorreta ou não teste no painel

**Solução**:
```bash
# 1. Verifique a URL no painel Pingupag
# 2. Clique em "Enviar Teste" no painel
# 3. Monitore logs Netlify em tempo real
# 4. Verifique se o webhook está "Ativo"
```

### ❌ "Erro 502 ao gerar PIX"

**Causa**: Timeout ou erro de conectividade

**Solução**:
```bash
# 1. Verifique logs da função
# 2. Confirme que PINGUPAG_API_KEY é válida
# 3. Teste a API manualmente:
curl -X POST https://app.pingupag.com/gateway/v1/transaction \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "description": "Test", "reference": "TEST-123", "source": "api_externa", "customer": {"name": "Test", "email": "test@example.com", "phone": "11999999999", "document": "12345678901"}}'
```

### ❌ "Transação não atualiza no Supabase"

**Causa**: Webhook não está disparando

**Solução**:
```bash
# 1. Confirme URL do webhook no painel Pingupag
# 2. Teste manualmente com curl (veja em Testes)
# 3. Verifique permissões do Supabase
# 4. Monitore logs Netlify
```

---

## 📊 CHECKLIST FINAL

- [ ] ✓ PINGUPAG_API_KEY adicionada no Netlify
- [ ] ✓ Redeploy realizado no Netlify
- [ ] ✓ Webhook URL registrada no painel Pingupag
- [ ] ✓ Webhook testado no painel ("Enviar Teste")
- [ ] ✓ Commit e push realizados
- [ ] ✓ Teste de PIX gerado com sucesso
- [ ] ✓ Teste de verificação de status funcionando
- [ ] ✓ Logs Netlify monitorados
- [ ] ✓ Fluxo completo testado

---

## 🎉 PRONTO PARA PRODUÇÃO!

Quando todos os itens acima forem completos:

```bash
# Deploy final (se necessário)
git push origin main

# Monitorar:
# - Netlify Functions Logs
# - Supabase Database
# - Pingupag Dashboard
```

---

## 📞 REFERÊNCIAS RÁPIDAS

**Pingupag Dashboard**: https://app.pingupag.com  
**Netlify Site**: https://app.netlify.com  
**Supabase Console**: https://app.supabase.com  

**Documentação API Pingupag**: https://app.pingupag.com/documentacao  
**Guia de Integração AVENPAY**: `PINGUPAG_INTEGRATION.md`

---

**Status**: ✅ PRONTO  
**Última atualização**: Outubro 2026  
**Próximo**: Executar STEP 1 (Configurar Netlify)
