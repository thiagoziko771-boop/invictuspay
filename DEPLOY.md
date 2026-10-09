# Deployment Guide - Netlify

## Environment Variables Setup

Para que o sistema funcione corretamente na Netlify, você precisa configurar as seguintes variáveis de ambiente:

### 1. Acesse o painel da Netlify
- Vá para: https://app.netlify.com
- Selecione seu site "winnerpay"

### 2. Configure as variáveis
- Clique em **Settings** → **Build & Deploy** → **Environment**
- Adicione as seguintes variáveis:

```
WINNER_CLIENT_ID=YOUR_CLIENT_ID_HERE
WINNER_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY_HERE
```

### 3. Redeploy
- Após adicionar as variáveis, clique em **Deploys** → **Trigger deploy** → **Deploy site**

## O que foi corrigido

✅ **Erro "usage_exceeded"** - Adicionado cache para evitar requisições duplicadas
✅ **Código limpo** - Removidas funções duplicadas (pix_vizzion.js, pix_winner.js)
✅ **WinnerPay integrado** - Sistema agora usa apenas WinnerPay com credenciais válidas
✅ **API aprovada** - PIX gerando com sucesso

## Testes

Para testar localmente com Node.js:

```bash
npm install
node test-pix-approved.js
```

Resultado esperado:
```
✅ PIX GERADO COM SUCESSO!
📋 Código PIX Cópia e Cola: 00020101...
🆔 ID da Transação: TXN_...
```
