const axios = require('axios');
const crypto = require('crypto');

// ========================================
// CONFIGURAÇÃO
// ========================================
const PAGUEPIX_CONFIG = {
  baseURL: process.env.PAGUEPIX_BASE_URL || 'https://api.paguepix.com.br',
  clientId: process.env.PAGUEPIX_CLIENT_ID,
  clientSecret: process.env.PAGUEPIX_CLIENT_SECRET,
  webhookUrl: process.env.PAGUEPIX_WEBHOOK_URL
};

// Cache do token
let tokenCache = {
  token: null,
  expiresAt: null
};

// ========================================
// OBTER TOKEN
// ========================================
async function obterToken() {
  try {
    if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
      return { success: true, token: tokenCache.token };
    }

    console.log('🔄 Obtendo token PaguePix...');
    
    const response = await axios.post(
      `${PAGUEPIX_CONFIG.baseURL}/v1/auth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: PAGUEPIX_CONFIG.clientId,
        client_secret: PAGUEPIX_CONFIG.clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      }
    );

    tokenCache.token = response.data.access_token;
    tokenCache.expiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

    console.log('✅ Token PaguePix obtido');
    
    return {
      success: true,
      token: response.data.access_token
    };
  } catch (error) {
    console.error('❌ Erro ao obter token PaguePix:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

// ========================================
// CRIAR COBRANÇA PIX
// ========================================
async function criarCobrancaPix(dados) {
  try {
    if (!dados.valor || dados.valor <= 0) {
      throw new Error('Valor inválido');
    }

    const auth = await obterToken();
    if (!auth.success) {
      throw new Error('Falha na autenticação PaguePix');
    }

    console.log('💰 Criando cobrança PIX...');
    console.log(`   Valor: R$ ${(dados.valor / 100).toFixed(2)}`);

    const response = await axios.post(
      `${PAGUEPIX_CONFIG.baseURL}/v1/pix/charges`,
      {
        amount: dados.valor,
        description: dados.descricao || 'Pagamento via PIX',
        expiration: dados.expiracao || 30,
        payer: dados.payer
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        timeout: 30000
      }
    );

    console.log('✅ Cobrança criada:', response.data.id);

    return {
      success: true,
      charge_id: response.data.id,
      qr_code: response.data.qr_code,
      qr_code_url: response.data.qr_code_url,
      status: response.data.status,
      expiration: response.data.expiration,
      amount: response.data.amount
    };
  } catch (error) {
    console.error('❌ Erro ao criar cobrança PIX:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// ========================================
// CONSULTAR COBRANÇA
// ========================================
async function consultarCobranca(charge_id) {
  try {
    const auth = await obterToken();
    if (!auth.success) {
      throw new Error('Falha na autenticação');
    }

    const response = await axios.get(
      `${PAGUEPIX_CONFIG.baseURL}/v1/pix/charges/${charge_id}`,
      {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Erro ao consultar cobrança:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// ========================================
// PROCESSAR WEBHOOK
// ========================================
async function processarWebhook(req, res) {
  try {
    const signature = req.headers['x-paguepix-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // Verificar assinatura (se fornecida)
    if (signature) {
      const hmac = crypto.createHmac('sha256', PAGUEPIX_CONFIG.clientSecret);
      hmac.update(rawBody);
      const calculatedSignature = hmac.digest('hex');
      
      if (calculatedSignature !== signature) {
        console.error('⚠️ Assinatura inválida do webhook PaguePix');
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }
    
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { event_id, type, occurred_at, data } = body;
    
    console.log('📩 Webhook PaguePix recebido:');
    console.log(`   Tipo: ${type}`);
    console.log(`   Event ID: ${event_id}`);
    console.log(`   Charge ID: ${data?.charge_id}`);
    
    // Retornar 200 imediatamente
    res.status(200).json({ received: true });
    
    // Processar de forma assíncrona
    switch (type) {
      case 'charge.paid':
        console.log('✅ PAGAMENTO CONFIRMADO!');
        console.log(`   Valor: R$ ${(data.amount / 100).toFixed(2)}`);
        // TODO: Notificar usuário no Telegram
        // TODO: Liberar acesso/produto
        break;
        
      case 'charge.expired':
        console.log('⏰ Cobrança expirada');
        break;
        
      case 'charge.canceled':
        console.log('❌ Cobrança cancelada');
        break;
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook PaguePix:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}

// ========================================
// REGISTRAR WEBHOOK
// ========================================
async function registrarWebhook() {
  try {
    const auth = await obterToken();
    if (!auth.success) {
      throw new Error('Falha na autenticação');
    }

    console.log('🔗 Registrando webhook PaguePix:', PAGUEPIX_CONFIG.webhookUrl);

    const response = await axios.post(
      `${PAGUEPIX_CONFIG.baseURL}/v1/pix/webhooks`,
      {
        url: PAGUEPIX_CONFIG.webhookUrl,
        events: [
          'charge.created',
          'charge.paid',
          'charge.expired',
          'charge.canceled'
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        timeout: 30000
      }
    );

    console.log('✅ Webhook PaguePix registrado:', response.data.id);

    return {
      success: true,
      webhook_id: response.data.id
    };
  } catch (error) {
    // Se já existir webhook, não é erro crítico
    if (error.response?.status === 409 || error.response?.status === 400) {
      console.log('ℹ️ Webhook já registrado ou conflito');
      return { success: true, message: 'Webhook já existe' };
    }
    
    console.error('❌ Erro ao registrar webhook PaguePix:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

module.exports = {
  obterToken,
  criarCobrancaPix,
  consultarCobranca,
  processarWebhook,
  registrarWebhook
};
          
