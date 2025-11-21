const axios = require('axios');

const API_KEY = process.env.APEX_API_KEY;
const BASE_URL = 'https://apexseguidores.com.br/api/v2';

async function getApexServices() {
  try {
    const response = await axios.post(BASE_URL, {
      key: API_KEY,
      action: 'services'
    });
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(service => ({ service: service.service, name: service.name, rate: service.rate, min: service.min, max: service.max }));
    }
    return [];
  } catch (error) {
    let msg = '';
    if (error.response) { msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) { msg = `request: ${error.request}`
    } else { msg = `message: ${error.message}`; }
    console.error('+++ ERRO APEX DEBUG +++', msg);
    return [];
  }
}

async function createApexOrder(service, link, quantity) {
  try {
    const response = await axios.post(BASE_URL, {
      key: API_KEY,
      action: 'add',
      service: service,
      link: link,
      quantity: quantity
    });
    if (response.data && response.data.order) {
      return response.data;
    }
    throw new Error(response.data.error || 'Erro desconhecido');
  } catch (error) {
    let msg = '';
    if (error.response) { msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) { msg = `request: ${error.request}`
    } else { msg = `message: ${error.message}`; }
    console.error('+++ ERRO APEX DEBUG +++', msg);
    throw error;
  }
}

async function getOrderStatus(orderId) {
  try {
    const response = await axios.post(BASE_URL, {
      key: API_KEY,
      action: 'status',
      order: orderId
    });
    return response.data;
  } catch (error) {
    let msg = '';
    if (error.response) { msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) { msg = `request: ${error.request}`
    } else { msg = `message: ${error.message}`; }
    console.error('+++ ERRO APEX DEBUG +++', msg);
    throw error;
  }
}

module.exports = {
  getApexServices,
  createApexOrder,
  getOrderStatus
};