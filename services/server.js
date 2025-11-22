app.post('/pix-callback', async (req, res) => {
  try {
    const { status, valor, user_id } = req.body;

    if (status === 'approved' || status === 'paid') {
      const PERCENT_LUCRO = 0.70; // 70% p/ você, 30% p/ créditos
      const valorTotal = parseFloat(valor);
      const valorCredito = Math.floor(valorTotal * (1 - PERCENT_LUCRO) * 100) / 100;

      const { updateUserBalance } = require('./database/supabase');
      await updateUserBalance(user_id, valorCredito);

      await bot.telegram.sendMessage(
        user_id,
        `✅ Pagamento Pix confirmado!\n\n` +
        `💵 Depósito: R$ ${valorTotal.toFixed(2)}\n` +
        `💸 Créditos adicionados: R$ ${valorCredito.toFixed(2)}\n\n` +
        `Seu saldo já está disponível no bot.`
      );

      return res.status(200).json({ success: true });
    }

    res.status(200).json({ message: 'Pagamento não aprovado' });
  } catch (error) {
    console.error('❌ Erro no callback Pix:', error);
    res.status(500).json({ error: error.message });
  }
});
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Configuração
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const RENDER_URL = process.env.RENDER_URL || 'https://telegram-bot-render-mazi.onrender.com';
const PORT = process.env.PORT || 3000;

// Criar bot
const bot = new TelegramBot(TELEGRAM_TOKEN);

// Configurar webhook do Telegram
async function setupTelegramWebhook() {
  try {
    const webhookUrl = `${RENDER_URL}/webhook`;
    
    console.log('🔗 Configurando webhook do Telegram...');
    console.log(`   URL: ${webhookUrl}`);
    
    // Deletar webhook antigo primeiro
    await bot.deleteWebHook();
    console.log('🗑️  Webhook antigo removido');
    
    // Aguardar 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Configurar novo webhook
    const result = await bot.setWebHook(webhookUrl, {
      drop_pending_updates: true, // Descartar updates pendentes
      allowed_updates: ['message', 'callback_query'] // Tipos de updates permitidos
    });
    
    if (result) {
      console.log('✅ Webhook do Telegram configurado com sucesso!');
      
      // Verificar configuração
      const info = await bot.getWebHookInfo();
      console.log('📋 Info do webhook:', {
        url: info.url,
        has_custom_certificate: info.has_custom_certificate,
        pending_update_count: info.pending_update_count,
        max_connections: info.max_connections
      });
    } else {
      console.error('❌ Falha ao configurar webhook');
    }
  } catch (error) {
    console.error('❌ Erro ao configurar webhook do Telegram:', error.message);
    
    // Se falhar, tentar modo polling como fallback
    if (error.message.includes('Failed to resolve host')) {
      console.log('⚠️  URL ainda não está acessível. Tentando novamente em 10s...');
      setTimeout(setupTelegramWebhook, 10000);
    }
  }
}

// Middleware
app.use(express.json());

// Rota do webhook do Telegram
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Rota de health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Bot está rodando',
    timestamp: new Date().toISOString()
  });
});

// Webhook do PaguePix
const { processarWebhook } = require('./services/paguepix');
app.post('/webhook/paguepix', processarWebhook);

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: ${RENDER_URL}`);
  
  // Aguardar 3 segundos para o servidor estar pronto
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Configurar webhook do Telegram
  await setupTelegramWebhook();
  
  // Configurar webhook do PaguePix
  const { registrarWebhook } = require('./services/paguepix');
  const webhookResult = await registrarWebhook();
  
  if (webhookResult.success) {
    console.log('✅ Webhook PaguePix registrado!');
  } else {
    console.log('⚠️  Webhook PaguePix:', webhookResult.error || 'Já existe');
  }
});

module.exports = { bot };
