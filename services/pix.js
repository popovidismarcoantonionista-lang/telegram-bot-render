const axios = require('axios');

const API_KEY = process.env.PIXINTEGRA_API_KEY;
const API_TOKEN = process.env.PIXINTEGRA_API_TOKEN;
const BASE_URL = 'https://api.pixintegra.net';

async function createPixCharge(amount, userId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/cobrancas`,
      {
        valor: amount.toFixed(2),
        chave: '092.675.711-33', // Chave Pix CPF
        descricao: `Recarga Bot - User ${userId}`,
        expires_in: 1800, // 30 minutos
        webhook_url: `${process.env.WEBHOOK_URL.replace('/webhook', '')}/pix-callback`,
        user_id: userId.toString() // Passar user_id para o callback
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      }
    );

    return {
      txid: response.data.txid,
      pixCopiaECola: response.data.brcode || response.data.pix_copia_cola,
      qrCode: response.data.qr_code,
      expiresAt: response.data.expires_at
    };
  } catch (error) {
    let msg = '';
    if (error.response) {
      msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      msg = `request: ${error.request}`
    } else {
      msg = `message: ${error.message}`
    }
    console.error('+++ ERRO PIP8 DEBUG +++', msg);
    throw error;
  }
}

async function checkPixStatus(txid) {
  try {
    const response = await axios.get(
      `${BASE_URL}/v1/cobrancas/${txid}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'X-API-Key': API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    let msg = '';
    if (error.response) {
      msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      msg = `request: ${error.request}`
    } else {
      msg = `message: ${error.message}`
    }
    console.error('+++ ERRO PIP8 DEBUG +++', msg);
    throw error;
  }
}

module.exports = {
  createPixCharge,
  checkPixStatus
  };