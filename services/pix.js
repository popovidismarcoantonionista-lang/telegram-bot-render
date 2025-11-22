const axios = require('axios');

const pixintegraClient = axios.create({
  baseURL: 'https://api.pixintegra.com.br/v1',  // ✅ URL CORRETA com /v1
  headers: {
    'Authorization': 'Bearer apitoken_f6815555698bded8004cbdce0598651999af6f40c9eba8',
    'X-API-Key': 'apikey_bf4b4688300dd58afed9e11ffe28b40157d7c8bb1f9cda',
    'Content-Type': 'application/json'
  }
});

// ✅ Criar cobrança (endpoint correto)
pixintegraClient.post('/cob', {  // ⚠️ Note: é '/cob', não '/cobrancas'
  txid: "20231128-001",
  valor: { 
    original: "150.00" 
  },
  pagador: {
    nome: "João da Silva",
    cpf: "12345678909",
    email: "joao@email.com"
  },
  expiracao: 3600
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
