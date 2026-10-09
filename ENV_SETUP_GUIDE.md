# 🔐 Guia de Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE - SEGURANÇA

As credenciais sensíveis NÃO devem estar no código. Elas devem ser configuradas nas variáveis de ambiente do Netlify.

## 📋 Variáveis Necessárias

Você precisa configurar as seguintes variáveis de ambiente no Netlify:

### 1. **PINGUPAG_API_KEY**
- **Tipo**: Secret (sensível)
- **Valor**: `pingupag_sk_YOUR_KEY_HERE` (configure no Netlify)
- **Descrição**: Chave de autenticação da API Pingupag

### 2. **NEXT_PUBLIC_SUPABASE_URL**
- **Tipo**: Secret (sensível)
- **Valor**: `https://YOUR_PROJECT.supabase.co/` (configure no Netlify)
- **Descrição**: URL do projeto Supabase

### 3. **SUPABASE_SERVICE_ROLE_KEY**
- **Tipo**: Secret (sensível)
- **Valor**: `YOUR_SERVICE_KEY_HERE` (configure no Netlify)
- **Descrição**: Chave de serviço do Supabase

### 4. **UTMIFY_TOKEN** (Opcional)
- **Tipo**: Secret (sensível)
- **Valor**: `YOUR_TOKEN_HERE` (configure no Netlify)
- **Descrição**: Token de integração com UTMify

## 🚀 Como Configurar no Netlify

### Opção 1: Via Dashboard Netlify

1. Acesse seu site no Netlify Dashboard
2. Vá para **Site Settings** → **Build & Deploy** → **Environment**
3. Clique em **Add environment variables**
4. Para cada variável:
   - Insira o **Key** (nome da variável)
   - Insira o **Value** (valor da credencial)
   - ☑️ **Marque "Contains secret values"** para cada uma
5. Clique **Import** ou **Save**
6. Vá em **Deploys** e clique **Trigger Deploy**

### Opção 2: Via `.env` local (para testes locais apenas)

```bash
# Crie um arquivo .env na raiz do projeto
PINGUPAG_API_KEY=pingupag_sk_YOUR_KEY_HERE
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co/
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY_HERE
UTMIFY_TOKEN=YOUR_TOKEN_HERE
```

**⚠️ NUNCA commit este arquivo!** Ele está no `.gitignore`.

## ✅ Verificação

Após configurar as variáveis:

1. Faça um novo deploy: **Deploys** → **Trigger Deploy**
2. Aguarde o build completar
3. Teste a geração de PIX em: `https://seu-site.netlify.app/pix-pingupag.html`

## 🔍 Troubleshooting

### "Credenciais da gateway não configuradas"
- Verifique se `PINGUPAG_API_KEY` está configurada no Netlify
- Faça um novo deploy após adicionar a variável
- Aguarde 2-3 minutos para a variável estar disponível

### Build falha com "Secrets scanning found secrets"
- NÃO coloque credenciais em documentação ou testes
- Use `YOUR_KEY_HERE` em exemplos
- Credenciais devem estar APENAS no Netlify

### Função retorna erro 500
- Verifique os logs do Netlify: **Deploys** → **Deploy log**
- Procure por erros relacionados a `PINGUPAG_API_KEY`

## 📚 Referências

- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify Secrets Scanning](https://docs.netlify.com/configure-builds/secrets-scanning/)
- [Pingupag API Documentation](https://app.pingupag.com/gateway)
