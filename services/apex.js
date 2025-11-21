const axios = require('axios');
const qs = require('qs'); // querystring serializer

const API_KEY = process.env.APEX_API_KEY;
const BASE_URL = 'https://apexseguidores.com/api/v2';

async function getApexServices() {
  try {
    const data = qs.stringify({
      key: API_KEY,
      action: 'services'
    });

    const response = await axios.post(BASE_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data.map(service => ({
        service: service.service,
        name: service.name,
        rate: parseFloat(service.rate),
        min: service.min,
        max: service.max
      }));
    }

    console.error(
      '+++ ERRO APEX DEBUG (services) +++ Resposta inesperada:',
      JSON.stringify(response.data).slice(0, 400)
    );
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
    const data = qs.stringify({
      key: API_KEY,
      action: 'add',
      service,
      link,
      quantity
    });

    const response = await axios.post(BASE_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
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
    const data = qs.stringify({
      key: API_KEY,
      action: 'status',
      order: orderId
    });

    const response = await axios.post(BASE_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
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
