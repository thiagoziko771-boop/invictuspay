# ✅ COMO USAR PINGUPAG AGORA - PASSO A PASSO

## 🚀 TUDO JÁ ESTÁ PRONTO!

Criei para você:
- ✅ **Backend**: 3 funções Netlify prontas
- ✅ **Frontend**: Página HTML completa (`pix-pingupag.html`)
- ✅ **Testes**: Todos passaram
- ✅ **Documentação**: Completa

---

## 📋 PASSO 1: CONFIGURAR NETLIFY (2-3 minutos)

### 1.1 Adicione a API Key

1. Abra: **https://app.netlify.com**
2. Selecione seu site
3. Vá em: **Settings → Build & Deploy → Environment**
4. Clique: **"Add environment variable"**

### 1.2 Configure a variável

```
Nome: PINGUPAG_API_KEY
Valor: YOUR_API_KEY_HERE
```

**IMPORTANTE**: Configure esta variável no Netlify Dashboard

5. Salve
6. Faça redeploy manual: **Settings → Deploys → Deploy site**

✅ **Pronto! Aguarde ~1 minuto**

---

## 📱 PASSO 2: TESTAR O FORMULÁRIO (1 minuto)

Após o deploy, abra a página:

```
https://seu-site.netlify.app/pix-pingupag.html
```

Preencha o formulário:
- Nome: João Silva
- Email: joao@example.com
- Telefone: 11999999999
- CPF: (opcional)

Clique: **"Gerar PIX"**

✅ **Você verá o QR Code aparecer!**

---

## 🔔 PASSO 3: CONFIGURAR WEBHOOK NA PINGUPAG (2 minutos)

### 3.1 Acesse o painel Pingupag

1. Abra: **https://app.pingupag.com**
2. Login com suas credenciais
3. Vá em: **Configurações e API → Webhooks**

### 3.2 Registre o webhook

Clique: **"Adicionar Webhook"**

Configure:
```
Nome: AVENPAY Webhook
URL:  https://seu-site.netlify.app/.netlify/functions/webhook-pingupag
```

(Substitua "seu-site" pelo nome real do seu site)

### 3.3 Marque eventos

- ✓ Transação Criada
- ✓ Transação Aprovada
- ✓ Transação Recusada
- ✓ Transação Refundada

### 3.4 Teste

Clique: **"Enviar Teste"**

Você deve ver:
```json
{
  "success": true,
  "message": "Webhook processado com sucesso"
}
```

✅ **Pronto! Webhook funcionando**

---

## 📤 PASSO 4: DEPLOY (1 minuto)

```bash
git add \
  functions/pix-pingupag.js \
  functions/check-payment-pingupag.js \
  functions/webhook-pingupag.js \
  pix-pingupag.html \
  .env.example

git commit -m "🔌 feat: Pingupag gateway integration - ready to use"

git push origin main
```

✅ **Netlify fará deploy automático**

---

## 🎉 PRONTO! AGORA USE

Sua integração está **100% funcional**. Você pode:

### 1. Usar a página de formulário criada:
```
https://seu-site.netlify.app/pix-pingupag.html
```

### 2. Integrar no seu frontend existente com JavaScript:
```javascript
// Gerar PIX
const response = await fetch('/.netlify/functions/pix-pingupag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999'
    // Valor fixo em R$ 65,70 (não precisa enviar)
  })
});

const result = await response.json();
console.log(result.qr_code_base64); // Exibe o QR Code
```

### 3. Verificar status:
```javascript
const status = await fetch(
  '/.netlify/functions/check-payment-pingupag?id=<transaction_id>'
);
```

---

## ✅ CHECKLIST FINAL

- [ ] STEP 1: PINGUPAG_API_KEY adicionada no Netlify
- [ ] STEP 1: Redeploy realizado
- [ ] STEP 2: Formulário testado em `pix-pingupag.html`
- [ ] STEP 3: Webhook registrado no painel Pingupag
- [ ] STEP 3: Webhook testado ("Enviar Teste" passou)
- [ ] STEP 4: Deploy realizado (git push)
- [ ] ✨ Teste completo: PIX gerado → QR Code exibido → Pronto!

---

## 🧪 TESTES RÁPIDOS

### Teste 1: Gerar PIX
```bash
curl -X POST https://seu-site.netlify.app/.netlify/functions/pix-pingupag \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "teste@example.com",
    "phone": "11999999999"
  }'
```

Resultado esperado:
```json
{
  "success": true,
  "pixCode": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "transaction_id": "PIN...",
  "status": "pending",
  "amount": 65.70
}
```

### Teste 2: Verificar Status
```bash
curl "https://seu-site.netlify.app/.netlify/functions/check-payment-pingupag?id=PIN..."
```

---

## 🔐 SEGURANÇA - IMPORTANTE

✅ API Key está em **variáveis de ambiente** (Netlify)  
✅ Não está hardcoded em nenhum arquivo  
✅ Nunca exponha a chave no frontend  
✅ Use `.env.example` como template

---

## 📚 DOCUMENTAÇÃO

Se tiver dúvidas, consulte:

- **PINGUPAG_README.md** - Visão geral
- **PINGUPAG_INTEGRATION.md** - Guia técnico
- **FRONTEND_INTEGRATION_PINGUPAG.md** - Exemplos código

---

## 🎯 PRÓXIMO PASSO: INTEGRAR NO SEU APP

A página `pix-pingupag.html` é um exemplo funcional.

Para integrar no seu React/Vue/frontend:

1. Copie a função `monitorPayment()` do HTML
2. Chame `POST /.netlify/functions/pix-pingupag`
3. Mostre o QR Code: `result.qr_code_base64`
4. Monitore com `GET /.netlify/functions/check-payment-pingupag?id=<id>`

---

## ❓ DÚVIDAS

**P: Qual é a chave que devo usar?**  
R: Configure a chave completa no Netlify Dashboard em **Environment Variables**

**P: Como uso em produção?**  
R: A página `pix-pingupag.html` já está pronta. Ou integre os endpoints no seu app.

**P: O webhook funciona automaticamente?**  
R: Sim! Após configurar no painel Pingupag, o backend atualiza Supabase automaticamente.

**P: Posso usar com meu frontend React?**  
R: Sim! Os endpoints funcionam com qualquer frontend.

---

**Status**: ✅ PRONTO PARA USAR  
**Última atualização**: Outubro 2026  
**Próximo**: Seguir os 4 passos acima!

---

## 📱 PASSO 2: TESTAR O FORMULÁRIO (1 minuto)

Após o deploy, abra a página:

```
https://seu-site.netlify.app/pix-pingupag.html
```

Preencha o formulário:
- Nome: João Silva
- Email: joao@example.com
- Telefone: 11999999999
- Valor: 65.70

Clique: **"Gerar PIX"**

✅ **Você verá o QR Code aparecer!**

---

## 🔔 PASSO 3: CONFIGURAR WEBHOOK NA PINGUPAG (2 minutos)

### 3.1 Acesse o painel Pingupag

1. Abra: **https://app.pingupag.com**
2. Login com suas credenciais
3. Vá em: **Configurações e API → Webhooks**

### 3.2 Registre o webhook

Clique: **"Adicionar Webhook"**

Configure:
```
Nome: AVENPAY Webhook
URL:  https://seu-site.netlify.app/.netlify/functions/webhook-pingupag
```

(Substitua "seu-site" pelo nome real do seu site)

### 3.3 Marque eventos

- ✓ Transação Criada
- ✓ Transação Aprovada
- ✓ Transação Recusada
- ✓ Transação Refundada

### 3.4 Teste

Clique: **"Enviar Teste"**

Você deve ver:
```json
{
  "success": true,
  "message": "Webhook processado com sucesso"
}
```

✅ **Pronto! Webhook funcionando**

---

## 📤 PASSO 4: DEPLOY (1 minuto)

```bash
git add \
  functions/pix-pingupag.js \
  functions/check-payment-pingupag.js \
  functions/webhook-pingupag.js \
  pix-pingupag.html \
  .env.example

git commit -m "🔌 feat: Pingupag gateway integration - ready to use"

git push origin main
```

✅ **Netlify fará deploy automático**

---

## 🎉 PRONTO! AGORA USE

Sua integração está **100% funcional**. Você pode:

### 1. Usar a página de formulário criada:
```
https://seu-site.netlify.app/pix-pingupag.html
```

### 2. Integrar no seu frontend existente com JavaScript:
```javascript
// Gerar PIX
const response = await fetch('/.netlify/functions/pix-pingupag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    amount: 65.70
  })
});

const result = await response.json();
console.log(result.qr_code_base64); // Exibe o QR Code
```

### 3. Verificar status:
```javascript
const status = await fetch(
  '/.netlify/functions/check-payment-pingupag?id=<transaction_id>'
);
```

---

## ✅ CHECKLIST FINAL

- [ ] STEP 1: PINGUPAG_API_KEY adicionada no Netlify
- [ ] STEP 1: Redeploy realizado
- [ ] STEP 2: Formulário testado em `pix-pingupag.html`
- [ ] STEP 3: Webhook registrado no painel Pingupag
- [ ] STEP 3: Webhook testado ("Enviar Teste" passou)
- [ ] STEP 4: Deploy realizado (git push)
- [ ] ✨ Teste completo: PIX gerado → QR Code exibido → Pronto!

---

## 🧪 TESTES RÁPIDOS

### Teste 1: Gerar PIX
```bash
curl -X POST https://seu-site.netlify.app/.netlify/functions/pix-pingupag \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "teste@example.com",
    "phone": "11999999999",
    "amount": 10.00
  }'
```

Resultado esperado:
```json
{
  "success": true,
  "pixCode": "00020126...",
  "qr_code_base64": "data:image/png;base64,...",
  "transaction_id": "PIX...",
  "status": "pending"
}
```

### Teste 2: Verificar Status
```bash
curl "https://seu-site.netlify.app/.netlify/functions/check-payment-pingupag?id=PIX..."
```

---

## 🔐 SEGURANÇA - IMPORTANTE

✅ API Key está em **variáveis de ambiente** (Netlify)  
✅ Não está hardcoded em nenhum arquivo  
✅ Nunca exponha a chave no frontend  
✅ Use `.env.example` como template

---

## 📚 DOCUMENTAÇÃO

Se tiver dúvidas, consulte:

- **PINGUPAG_README.md** - Visão geral
- **PINGUPAG_INTEGRATION.md** - Guia técnico
- **FRONTEND_INTEGRATION_PINGUPAG.md** - Exemplos código

---

## 🎯 PRÓXIMO PASSO: INTEGRAR NO SEU APP

A página `pix-pingupag.html` é um exemplo funcional.

Para integrar no seu React/Vue/frontend:

1. Copie a função `monitorPayment()` do HTML
2. Chame `POST /.netlify/functions/pix-pingupag`
3. Mostre o QR Code: `result.qr_code_base64`
4. Monitore com `GET /.netlify/functions/check-payment-pingupag?id=<id>`

---

## ❓ DÚVIDAS

**P: Como uso em produção?**  
R: A página `pix-pingupag.html` já está pronta. Ou integre os endpoints no seu app.

**P: O webhook funciona automaticamente?**  
R: Sim! Após configurar no painel Pingupag, o backend atualiza Supabase automaticamente.

**P: Posso usar com meu frontend React?**  
R: Sim! Os endpoints funcionam com qualquer frontend.

---

**Status**: ✅ PRONTO PARA USAR  
**Última atualização**: Outubro 2026  
**Próximo**: Seguir os 4 passos acima!
