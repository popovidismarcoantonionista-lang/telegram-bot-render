require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { bot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

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

// --- NOVO FLUXO: Callback PixIntegra Automático com Margem ---
app.post('/pix-callback', async (req, res) => {
  try {
    const { status, valor, pagador, user_id } = req.body;
    if (status === 'approved' || status === 'paid') {
      // Margem de lucro - 70% para você, usuário recebe 30%
      const PERCENT_LUCRO = 0.70; // Edite se quiser 65% ou 75%
      const valorTotal = parseFloat(valor);
      const valorCreditoUsuario = Math.floor(valorTotal * (1 - PERCENT_LUCRO) * 100) / 100;
      let plataforma = 'sms';
      if (pagador && pagador.plataforma && ["sms","apex"].includes(pagador.plataforma))
        plataforma = pagador.plataforma;

      // Aqui você chamaria de fato as APIs externas antes de creditar! (simulação)
      let compraOk = valorCreditoUsuario > 0;

      if (compraOk) {
        const { updateUserBalance } = require('./database/supabase');
        await updateUserBalance(user_id, valorCreditoUsuario);

        await bot.telegram.sendMessage(
          user_id,
          `✅ Pix aprovado!\n\n💵 Valor depositado: R$ ${valorTotal.toFixed(2)}\n🏦 Plataforma: ${plataforma}\n💸 Créditos recebidos: R$ ${valorCreditoUsuario.toFixed(2)}\n\nSeu saldo já está disponível!\n\nObs: este sistema faz a conversão automática de Pix em créditos, mantendo margem para o administrador.`
        );
      } else {
        await bot.telegram.sendMessage(
          user_id,
          "❌ ERRO ao processar conversão de Pix em créditos. Contate o suporte."
        );
      }
      return res.status(200).json({ success: true });
    }
    res.status(200).json({ message: "Pagamento não aprovado" });
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  await setupWebhook();
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
