require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { bot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Middleware
app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.send('🤖 Bot está online!');
});

// Webhook route
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// Callback do PixIntegra
app.post('/pix-callback', async (req, res) => {
  try {
    console.log('📥 Callback recebido:', JSON.stringify(req.body, null, 2));

    const { status, txid, valor, pagador } = req.body;

    if (status === 'approved' || status === 'paid') {
      const { updateUserBalance } = require('./database/supabase');

      // Extrair user_id do campo customizado ou pagador
      const userId = pagador?.user_id || req.body.user_id;

      if (userId) {
        const valorNum = parseFloat(valor);
        await updateUserBalance(userId, valorNum);

        // Notificar usuário
        await bot.telegram.sendMessage(
          userId,
          `✅ *Pagamento confirmado!*\n\n💰 Valor: R$ ${valorNum.toFixed(2)}\n🔖 TXID: ${txid}\n\nSeu saldo foi atualizado automaticamente.`,
          { parse_mode: 'Markdown' }
        );

        console.log(`✅ Saldo atualizado para usuário ${userId}: +R$ ${valorNum.toFixed(2)}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no callback Pix:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configurar webhook
async function setupWebhook() {
  try {
    const webhookUrl = `${WEBHOOK_URL}`;
    console.log(`🔗 Configurando webhook: ${webhookUrl}`);

    await bot.telegram.setWebhook(webhookUrl);
    console.log('✅ Webhook configurado com sucesso!');

    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('📋 Info do webhook:', webhookInfo);
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  await setupWebhook();
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));