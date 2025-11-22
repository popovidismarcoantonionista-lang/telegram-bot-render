const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();

// ========================================
// CONFIGURAÇÃO
// ========================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// URL automática do Render (o Render fornece essa variável)
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const RENDER_SERVICE_NAME = process.env.RENDER_SERVICE_NAME || 'telegram-bot-render-mazi';

// Construir URL base
const BASE_URL = RENDER_EXTERNAL_URL || 
                 process.env.RENDER_URL || 
                 `https://${RENDER_SERVICE_NAME}.onrender.com`;

const WEBHOOK_PATH = '/webhook';
const WEBHOOK_URL = `${BASE_URL}${WEBHOOK_PATH}`;

console.log('🌐 Base URL:', BASE_URL);
console.log('🔗 Webhook URL:', WEBHOOK_URL);

// Criar bot
const bot = new Telegraf(TELEGRAM_TOKEN);

// ========================================
// CONFIGURAR WEBHOOK DO TELEGRAM
// ========================================
async function setupWebhook() {
  try {
    console.log('🔗 Configurando webhook do Telegram...');
    console.log(`   URL: ${WEBHOOK_URL}`);
    
    // Validar URL
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('undefined')) {
      throw new Error('URL do webhook está undefined! Verifique as variáveis de ambiente.');
    }
    
    // Deletar webhook antigo
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('🗑️  Webhook antigo removido');
    
    // Aguardar 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Configurar novo webhook
    await bot.telegram.setWebhook(WEBHOOK_URL, {
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query']
    });
    
    console.log('✅ Webhook do Telegram configurado!');
    
    // Verificar
    const info = await bot.telegram.getWebhookInfo();
    console.log('📋 Info do webhook:', {
      url: info.url,
      pending_updates: info.pending_update_count,
      max_connections: info.max_connections
    });
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    console.error('   Stack:', error.stack);
    
    // Tentar novamente em 10 segundos
    if (error.message.includes('Failed to resolve host') || error.message.includes('undefined')) {
      console.log('⚠️  Tentando novamente em 10 segundos...');
      setTimeout(setupWebhook, 10000);
    }
  }
}

// ========================================
// MIDDLEWARE
// ========================================
app.use(express.json());

// ========================================
// ROTAS
// ========================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Telegram Bot',
    timestamp: new Date().toISOString(),
    webhook_url: WEBHOOK_URL
  });
});

// Webhook do Telegram
app.post(WEBHOOK_PATH, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Webhook do PaguePix
const { processarWebhook: processarWebhookPaguePix } = require('./services/paguepix');
app.post('/webhook/paguepix', processarWebhookPaguePix);

// ========================================
// COMANDOS DO BOT
// ========================================
bot.command('start', (ctx) => {
  ctx.reply('🤖 Bot iniciado! Use /pagar <valor> para gerar um PIX.');
});

bot.command('pagar', async (ctx) => {
  const valor = parseFloat(ctx.message.text.split(' ')[1]);
  
  if (isNaN(valor) || valor <= 0) {
    return ctx.reply('❌ Uso: /pagar 10.50');
  }
  
  const { criarCobrancaPix } = require('./services/paguepix');
  
  const resultado = await criarCobrancaPix({
    valor: Math.round(valor * 100), // Converter para centavos
    descricao: `Pagamento de R$ ${valor.toFixed(2)}`,
    expiracao: 30
  });
  
  if (resultado.success) {
    ctx.reply(
      `💰 *PIX Gerado!*\n\n` +
      `Valor: R$ ${(resultado.amount / 100).toFixed(2)}\n` +
      `ID: \`${resultado.charge_id}\`\n` +
      `Expira em: 30 minutos\n\n` +
      `📱 *PIX Copia e Cola:*\n\`${resultado.qr_code}\``,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.reply(`❌ Erro: ${resultado.error}`);
  }
});

// ========================================
// INICIAR SERVIDOR
// ========================================
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL pública: ${BASE_URL}`);
  
  // Aguardar servidor estar pronto
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Configurar webhook do Telegram
  await setupWebhook();
  
  // Configurar webhook do PaguePix
  try {
    const { registrarWebhook } = require('./services/paguepix');
    const result = await registrarWebhook();
    
    if (result.success) {
      console.log('✅ Webhook PaguePix registrado!');
    } else {
      console.log('ℹ️  Webhook PaguePix:', result.message || result.error);
    }
  } catch (error) {
    console.error('⚠️  Erro ao registrar webhook PaguePix:', error.message);
  }
});

// Tratamento de erros
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

module.exports = { bot, app };
📋 Variáveis de Ambiente no Render
Adicione no painel do Render (Environment):

TELEGRAM_BOT_TOKEN=seu_token_aqui
RENDER_URL=https://telegram-bot-render-mazi.onrender.com
PAGUEPIX_CLIENT_ID=981e56a97f908360f9c3452804fce44c872f984c
PAGUEPIX_CLIENT_SECRET=925509895a99f4a22adab7d6ce55a281ab11d73d69f74cee30bc7804ced56b95
PAGUEPIX_BASE_URL=https://api.paguepix.com.br
PAGUEPIX_WEBHOOK_URL=https://telegram-bot-render-mazi.onrender.com/webhook/paguepix
PORT=3000
        
