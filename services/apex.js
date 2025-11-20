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
      return response.data.map(service => ({
        service: service.service,
        name: service.name,
        rate: service.rate,
        min: service.min,
        max: service.max
      }));
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar serviços Apex:', error.message);
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
    console.error('Erro ao criar pedido Apex:', error.message);
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
    console.error('Erro ao verificar status:', error.message);
    throw error;
  }
}

module.exports = {
  getApexServices,
  createApexOrder,
  getOrderStatus
};