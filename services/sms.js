const axios = require('axios');

const API_KEY = process.env.SMS_ACTIVATE_API_KEY;
const BASE_URL = 'https://api.sms-activate.org/stubs/handler_api.php';

async function getAvailableServices(country = 'br') {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        action: 'getPrices',
        country: country
      }
    });

    const services = [];
    const data = response.data[country];

    if (data) {
      Object.keys(data).forEach(serviceCode => {
        const service = data[serviceCode];
        if (service.cost && service.count > 0) {
          services.push({
            code: serviceCode,
            name: serviceCode.toUpperCase(),
            price: parseFloat(service.cost) * 5.5, // Conversão aproximada RUB -> BRL
            available: service.count
          });
        }
      });
    }

    return services.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error('Erro ao buscar serviços SMS:', error.message);
    return [];
  }
}

async function purchaseNumber(service, country = 'br') {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        action: 'getNumber',
        service: service,
        country: country
      }
    });

    const data = response.data;

    if (data.includes('ACCESS_NUMBER')) {
      const parts = data.split(':');
      return {
        activationId: parts[1],
        phone: parts[2]
      };
    }

    throw new Error(data);
  } catch (error) {
    console.error('Erro ao comprar número:', error.message);
    throw error;
  }
}

async function getSmsCode(activationId) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        action: 'getStatus',
        id: activationId
      }
    });

    const data = response.data;

    if (data.includes('STATUS_OK')) {
      const code = data.split(':')[1];
      return code;
    }

    return null;
  } catch (error) {
    console.error('Erro ao verificar SMS:', error.message);
    return null;
  }
}

module.exports = {
  getAvailableServices,
  purchaseNumber,
  getSmsCode
};