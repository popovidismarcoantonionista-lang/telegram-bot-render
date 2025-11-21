require('dotenv').config();
const axios = require('axios');

// ==============================================
// TESTE APEX SEGUIDORES
// ==============================================
async function testApex() {
  console.log('\n=============================================');
  console.log('🧪 TESTE APEX SEGUIDORES');
  console.log('=============================================');

  const API_KEY = process.env.APEX_API_KEY;
  const BASE_URL = 'https://apexseguidores.com.br/api/v2';

  console.log(`🔑 API Key: ${API_KEY ? `${API_KEY.substring(0, 10)}...` : '❌️ NÃO ENCONTRADA!'}`);
  console.log(`🔑 Base URL: ${BASE_URL}`);

  try {
    console.log('\n⏳ Enviando requisição...');
    const response = await axios.post(BASE_URL, {
      key: API_KEY,
      action: 'services'
    }, {
      timeout: 10000
    });

    console.log(`\n✅ Sucesso! Status: ${response.status}`);
    console.log(`💼 Serviços encontrados: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);

    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('\nPrimeiros 3 serviços:');
      response.data.slice(0, 3).forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} - R$ ${s.rate}/1000`);
      });
    } else {
      console.error('❌️ Nenhum serviço encontrado!');
      console.log('Resposta:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('\n❌️ ERRO APEX:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('Nenhuma resposta recebida da API');
      console.error('Request:', error.request._header);
    } else {
      console.error('Message:', error.message);
    }
  }
}

// ==============================================
// TESTE PIXINTEGRA
// =============================================
async function testPix() {
  console.log('\n=============================================');
  console.log('💳 TESTE PIXINTEGRA');
  console.log('=============================================');

  const API_KEY = process.env.PIXINTEGRA_API_KEY;
  const API_TOKEN = process.env.PIXINTEGRA_API_TOKEN;
  const BASE_URL = 'https://api.pixintegra.net';

  console.log(`🔑 API Key: ${API_KEY ? `${API_KEY.substring(0, 10)}...` : '❌️ NÃO ENCONTRADA!'}`);
  console.log(`🔑 API Token: ${API_TOKEN ? `${API_TOKEN.substring(0, 10)}...` : '❌️ NÃO ENCONTRADA!'}`);
  console.log(`🔑 Base URL: ${BASE_URL}`);

  try {
    console.log('\n⏳ Enviando requisição de teste...');
    const response = await axios.post(
      `${BASE_URL}/v1/cobrancas`,
      {
        valor: '5.00',
        chave: '092.675.711-33',
        descricao: 'Teste API Pix',
        expires_in: 1800
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        timeout: 10000
      }
    );

    console.log(`\n✅ Sucesso! Status: ${response.status}`);
    console.log(`🔱 TXID: ${response.data.txid || 'N/A'}`);
    console.log(`💳 Pix gerado com sucesso!`);
  } catch (error) {
    console.error('\n❌️ ERRO PIX:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('Nenhuma resposta recebida da API');
      console.error('Request:', error.request._header);
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Executar testes
async function main() {
  console.log('\n🚀 ================================================================');
  console.log('🚀                     TESTE DE APIS - BOT TELEGRAM');
  console.log('🚀 ================================================================');

  await testApex();
  await testPix();

  console.log('\n🎉 ================================================================');
  console.log('🎉                     TESTES CONCLUÍDOS!');
  console.log('🎉 ================================================================');
}

main().catch(console.error);