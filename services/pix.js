const axios = require('axios');

const pixintegraClient = axios.create({
  baseURL: 'https://pixintegra.com.br',  // ✅ URL CORRETA
  headers: {
    'Authorization': 'Bearer apitoken_f6815555698bded8004cbdce0598651999af6f40c9eba8',
    'X-API-Key': 'apikey_bf4b4688300dd58afed9e11ffe28b40157d7c8bb1f9cda',
    'Content-Type': 'application/json'
  }
});

// Exemplo para criar cobrança
pixintegraClient.post('/api/v1/cobrancas', {
  // seu payload aqui
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
