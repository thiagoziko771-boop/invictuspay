# 🎨 FRONTEND INTEGRATION - PINGUPAG

## Como integrar Pingupag no seu frontend

---

## 📋 EXEMPLO 1: Geração de PIX (HTML + JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Gerar PIX - Pingupag</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    form { max-width: 400px; }
    input, button { padding: 10px; margin: 5px 0; width: 100%; }
    button { background: #007bff; color: white; border: none; cursor: pointer; }
    button:hover { background: #0056b3; }
    .qr-container { margin-top: 20px; text-align: center; }
    .error { color: red; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>Gerar PIX</h1>

  <form id="pixForm">
    <label>Nome:</label>
    <input type="text" name="nome" required />

    <label>Email:</label>
    <input type="email" name="email" required />

    <label>Telefone:</label>
    <input type="tel" name="phone" placeholder="11999999999" required />

    <label>CPF:</label>
    <input type="text" name="cpf" placeholder="12345678901" />

    <label>Valor (R$):</label>
    <input type="number" name="amount" value="65.70" step="0.01" required />

    <button type="submit">Gerar PIX</button>
  </form>

  <div id="result"></div>

  <script>
    document.getElementById('pixForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const data = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        cpf: formData.get('cpf'),
        amount: parseFloat(formData.get('amount')),
        utm: {
          utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'direct',
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || 'direct',
        }
      };

      try {
        const response = await fetch('/.netlify/functions/pix-pingupag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          displayQRCode(result);
          monitorPayment(result.transaction_id);
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError('Erro ao gerar PIX: ' + error.message);
      }
    });

    function displayQRCode(result) {
      const html = `
        <div class="qr-container">
          <h2 class="success">✓ PIX Gerado com Sucesso!</h2>
          <img src="${result.qr_code_base64}" alt="QR Code PIX" style="max-width: 300px;" />
          <p><strong>Valor:</strong> R$ ${result.amount}</p>
          <p><strong>ID:</strong> ${result.transaction_id}</p>
          <hr />
          <p><strong>Cópia e Cola:</strong></p>
          <textarea id="pixCode" readonly style="width: 100%; height: 100px;">${result.pixCode}</textarea>
          <button onclick="copyToClipboard()">Copiar Código</button>
          <p class="success">Aguardando pagamento...</p>
        </div>
      `;
      document.getElementById('result').innerHTML = html;
    }

    function copyToClipboard() {
      document.getElementById('pixCode').select();
      document.execCommand('copy');
      alert('Código copiado!');
    }

    function monitorPayment(transactionId) {
      let attempts = 0;
      const maxAttempts = 60; // 5 minutos

      const interval = setInterval(async () => {
        attempts++;

        try {
          const response = await fetch(`/.netlify/functions/check-payment-pingupag?id=${transactionId}`);
          const result = await response.json();

          if (result.success && result.status === 'paid') {
            clearInterval(interval);
            showPaymentConfirmed(result);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            showError('Timeout aguardando pagamento');
          }
        } catch (error) {
          console.error('Erro ao verificar pagamento:', error);
        }
      }, 5000); // Verifica a cada 5 segundos
    }

    function showPaymentConfirmed(result) {
      const html = `
        <div class="qr-container">
          <h2 class="success">✓✓✓ Pagamento Confirmado!</h2>
          <p><strong>Valor:</strong> R$ ${result.amount}</p>
          <p><strong>Cliente:</strong> ${result.customer_name}</p>
          <p><strong>Data:</strong> ${new Date(result.paid_at).toLocaleString('pt-BR')}</p>
          <button onclick="window.location.href='/'">Voltar ao Início</button>
        </div>
      `;
      document.getElementById('result').innerHTML = html;
    }

    function showError(message) {
      document.getElementById('result').innerHTML = `<p class="error">❌ ${message}</p>`;
    }
  </script>
</body>
</html>
```

---

## 📋 EXEMPLO 2: Componente React

```jsx
import React, { useState, useEffect } from 'react';

export default function PingupagPayment() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    phone: '',
    cpf: '',
    amount: 65.70
  });
  const [pixData, setPixData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generatePIX = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/pix-pingupag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          utm: {
            utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'direct'
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setPixData(result);
        monitorPayment(result.transaction_id);
      } else {
        setError(result.error || 'Erro ao gerar PIX');
      }
    } catch (err) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const monitorPayment = (transactionId) => {
    let attempts = 0;
    const maxAttempts = 60;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(
          `/.netlify/functions/check-payment-pingupag?id=${transactionId}`
        );
        const result = await response.json();

        if (result.success && result.status === 'paid') {
          setPaymentStatus('PAID');
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError('Timeout aguardando pagamento');
        }
      } catch (err) {
        console.error('Erro ao verificar:', err);
      }
    }, 5000);
  };

  if (paymentStatus === 'PAID') {
    return (
      <div style={{ textAlign: 'center', color: 'green' }}>
        <h2>✓ Pagamento Confirmado!</h2>
        <p>Obrigado por sua compra de R$ {pixData.amount}</p>
        <button onClick={() => window.location.href = '/'}>Voltar</button>
      </div>
    );
  }

  if (pixData) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h2>✓ PIX Gerado!</h2>
        <img 
          src={pixData.qr_code_base64} 
          alt="QR Code" 
          style={{ maxWidth: '300px', margin: '20px 0' }} 
        />
        <p><strong>Valor:</strong> R$ {pixData.amount}</p>
        <p><strong>ID:</strong> {pixData.transaction_id}</p>
        <textarea 
          value={pixData.pixCode} 
          readOnly 
          style={{ width: '100%', height: '100px', marginTop: '10px' }}
        />
        <p style={{ marginTop: '10px', color: '#666' }}>
          Aguardando pagamento...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Gerar PIX - Pingupag</h1>
      
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}

      <form onSubmit={generatePIX}>
        <div>
          <label>Nome:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Telefone:</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="11999999999"
            required
          />
        </div>

        <div>
          <label>CPF:</label>
          <input
            type="text"
            name="cpf"
            value={formData.cpf}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label>Valor (R$):</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.01"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar PIX'}
        </button>
      </form>
    </div>
  );
}
```

---

## 📋 EXEMPLO 3: Vue.js

```vue
<template>
  <div class="pix-form">
    <h1>Gerar PIX - Pingupag</h1>

    <form @submit.prevent="generatePIX" v-if="!pixData">
      <div>
        <label>Nome:</label>
        <input v-model="form.nome" type="text" required />
      </div>
      <div>
        <label>Email:</label>
        <input v-model="form.email" type="email" required />
      </div>
      <div>
        <label>Telefone:</label>
        <input v-model="form.phone" type="tel" required />
      </div>
      <div>
        <label>CPF:</label>
        <input v-model="form.cpf" type="text" />
      </div>
      <div>
        <label>Valor:</label>
        <input v-model.number="form.amount" type="number" step="0.01" required />
      </div>
      <button :disabled="loading">{{ loading ? 'Gerando...' : 'Gerar PIX' }}</button>
      <p v-if="error" style="color: red;">❌ {{ error }}</p>
    </form>

    <div v-else-if="paymentStatus === 'PAID'" style="text-align: center; color: green;">
      <h2>✓ Pagamento Confirmado!</h2>
      <p>Obrigado por sua compra de R$ {{ pixData.amount }}</p>
      <button @click="$router.push('/')">Voltar</button>
    </div>

    <div v-else style="text-align: center;">
      <h2>✓ PIX Gerado!</h2>
      <img :src="pixData.qr_code_base64" style="max-width: 300px;" />
      <p><strong>Valor:</strong> R$ {{ pixData.amount }}</p>
      <textarea :value="pixData.pixCode" readonly style="width: 100%; height: 100px;"></textarea>
      <p>Aguardando pagamento...</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        nome: '',
        email: '',
        phone: '',
        cpf: '',
        amount: 65.70
      },
      pixData: null,
      paymentStatus: null,
      error: null,
      loading: false
    };
  },
  methods: {
    async generatePIX() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch('/.netlify/functions/pix-pingupag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...this.form,
            amount: parseFloat(this.form.amount)
          })
        });

        const result = await response.json();

        if (result.success) {
          this.pixData = result;
          this.monitorPayment(result.transaction_id);
        } else {
          this.error = result.error;
        }
      } catch (err) {
        this.error = 'Erro: ' + err.message;
      } finally {
        this.loading = false;
      }
    },

    monitorPayment(transactionId) {
      let attempts = 0;

      setInterval(async () => {
        attempts++;
        if (attempts > 60) return;

        try {
          const response = await fetch(
            `/.netlify/functions/check-payment-pingupag?id=${transactionId}`
          );
          const result = await response.json();

          if (result.success && result.status === 'paid') {
            this.paymentStatus = 'PAID';
          }
        } catch (err) {
          console.error('Erro:', err);
        }
      }, 5000);
    }
  }
};
</script>
```

---

## 📋 EXEMPLO 4: Captura de UTM Parameters

```javascript
// Capturar UTMs da URL e enviar com PIX

function getUTMParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || 'direct',
    utm_medium: params.get('utm_medium') || 'direct',
    utm_campaign: params.get('utm_campaign') || 'direct',
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
  };
}

// Usar ao enviar para PIX
const response = await fetch('/.netlify/functions/pix-pingupag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    amount: 65.70,
    utm: getUTMParameters()  // ← Aqui!
  })
});
```

---

## 🎯 INTEGRAÇÃO COM ANALYTICS

```javascript
// Google Analytics
gtag('event', 'purchase', {
  transaction_id: result.transaction_id,
  value: result.amount,
  currency: 'BRL',
  items: [{
    item_id: result.transaction_id,
    item_name: 'SHOPIFY LOJA 03',
    price: result.amount
  }]
});

// Facebook Pixel
fbq('track', 'Purchase', {
  value: result.amount,
  currency: 'BRL',
  content_name: 'SHOPIFY LOJA 03',
  content_type: 'product',
  content_id: result.transaction_id
});
```

---

## ✅ CHECKLIST DE INTEGRAÇÃO

- [ ] Criar formulário com campos: nome, email, phone, cpf, amount
- [ ] Capturar UTM parameters da URL
- [ ] Chamar `POST /.netlify/functions/pix-pingupag`
- [ ] Exibir QR Code do response
- [ ] Monitorar com `GET /.netlify/functions/check-payment-pingupag?id=<id>`
- [ ] Exibir confirmação quando status = "paid"
- [ ] Integrar com analytics (GA, Facebook Pixel)
- [ ] Testar em staging antes de produção

---

## 🚀 DEPLOY CHECKLIST

```bash
# 1. Adicionar PINGUPAG_API_KEY no Netlify
# 2. Configurar Webhook no painel Pingupag
# 3. Testar endpoints
# 4. Fazer deploy
```

---

**Última atualização**: Outubro 2026
