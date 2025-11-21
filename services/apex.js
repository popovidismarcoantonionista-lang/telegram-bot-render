const axios = require('axios');

const API_KEY = process.env.APEX_API_KEY;
// Endpoint CORRETO da Apex Seguidores:
const BASE_URL = 'https://apexseguidores.com/api/v2';

async function getApexServices() {
  try {
    const response = await axios.post(BASE_URL, {
      key: API_KEY,
      action: 'services'
    });

    // A API correta retorna um ARRAY de serviços
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(service => ({
        service: service.service,
        name: service.name,
        rate: parseFloat(service.rate),
        min: service.min,
        max: service.max
      }));
    }

    console.error('+++ ERRO APEX DEBUG (services) +++ Resposta inesperada:', JSON.stringify(response.data).slice(0, 400));
    return [];
  } catch (error) {
    let msg = '';
    if (error.response) {
      msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      msg = `request: ${error.request}`;
    } else {
      msg = `message: ${error.message}`;
    }
    console.error('+++ ERRO APEX DEBUG (services) +++', msg);
    return [];
  }
}

async function createApexOrder(service, link, quantity) {
  try {
    const response = await axios.post(BASE_URL, {
      key: API_KEY,
      action: 'add',
      service,
      link,
      quantity
    });

    if (response.data && response.data.order) {
      return response.data;
    }
    throw new Error(response.data.error || 'Erro desconhecido ao criar pedido na Apex');
  } catch (error) {
    let msg = '';
    if (error.response) {
      msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      msg = `request: ${error.request}`;
    } else {
      msg = `message: ${error.message}`;
    }
    console.error('+++ ERRO APEX DEBUG (createApexOrder) +++', msg);
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
    if (error.response) {
      msg = `status: ${error.response.status} | data: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      msg = `request: ${error.request}`;
    } else {
      msg = `message: ${error.message}`;
    }
    console.error('+++ ERRO APEX DEBUG (getOrderStatus) +++', msg);
    throw error;
  }
}

module.exports = {
  getApexServices,
  createApexOrder,
  getOrderStatus
};
