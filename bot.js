require('dotenv').config();
const { Telegraf } = require('telegraf');
const { getMainKeyboard, getServicesKeyboard, getBackKeyboard } = require('./utils/keyboards');
const { getUserBalance, createUser, updateUserBalance } = require('./database/supabase');
const { getAvailableServices, purchaseNumber, getSmsCode } = require('./services/sms');
const { getApexServices, createApexOrder } = require('./services/apex');
const { createPixCharge } = require('./services/pix');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Armazenamento temporário de sessões
const userSessions = new Map();

// ==========================================================
// COMANDO DE TESTE DE APIS (NOVO!)
// ==========================================================
bot.command('testapis', async (ctx) => {
  await ctx.reply('🧀 Iniciando testes das APIs...\nAguarde uns 30 segundos.');

  let result = '🚀 =========== TESTE DE APIS ============\n\n';

  // Teste Apex Seguidores
  result += '🧪 TESTE APEX SEGUIDORESL\n';
  try {
    const services = await getApexServices();
    if (services.length > 0) {
      result += `“ Sucesso! ${services.length} serviços encontrados\n`;
      result += `Primeiro: ${services[0].name}\n`;
    } else {
      result += '❌ Nenhum serviço retornado\n';
    }
  } catch (error) {
    if (error.response) {
      result += `❌ Erro ${error.response.status}: ${JSON.stringify(error.response.data)}\n`;
    } else {
      result += `❌ Erro: ${error.message}\n`;
    }
  }

  // Teste PixIntegra
  result += '\n💳 TESTE PIXINTEGRA\n';
  try {
    const pixData = await axios.post(
      'https://api.pixintegra.net/v1/cobrancas',
      {
        valor: '5.00',
        chave: '092.675.711-33',
        descricao: 'Teste API',
        expires_in: 1800
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PIXINTEGRA_API_TOKEN}`,
          'Content-Type': 'application/json',
          'X-API-Key': process.env.PIXINTEGRA_API_KEY
        },
        timeout: 10000
      }
    );
    result += `✅ Sucesso! TID: ${pixData.data.txid || 'N/A'}\n`;
  } catch (error) {
    if (error.response) {
      result += `❌ Erro ${error.response.status}: ${JSON.stringify(error.response.data)}\n`;
    } else {
      result += `❌ Erro: ${error.message}\n`;
    }
  }

  result += '\n🎉 ============ FIM DO TESTE ============';
  await ctx.reply(result);
});

// ==========================================================
// COMANDO /START
// ==========================================================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name;

  // Criar usuário no banco se não existir
  await createUser(userId, username);

  await ctx.reply(
    `🤀 *Bem-vindo ao Bot de Serviços!*\\n\\n` +
    `👤 Usuário: ${username}\\n\\n` +
    `🆔 ID: ${userId}\\n\\n` +
    `Escolha uma opção abaixo:`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard()
    }
  );
});

// ==========================================================
// MENU PRINCIPAL
// ==========================================================
bot.hears('💬 Comprar SMS', async (ctx) => {
  userSessions.set(ctx.from.id, { action: 'sms_select_service' });

  await ctx.reply(
    '📱 *Comprar SMS Descartável*\\n\\n' +
    'Carregando serviços disponíveis...',
    { parse_mode: 'Markdown' }
  );

  try {
    const services = await getAvailableServices();

    if (services.length === 0) {
      return ctx.reply('❌ Nenhum serviço disponível no momento.');
    }

    let message = '💹 *Serviços disponíveis:*\\n\\n';
    services.slice(0, 10).forEach((service, index) => {
      message += `${index + 1}. ${service.name} - R$ ${service.price.toFixed(2)}\\n`;
    });
    message += '\\n\\n💡 Digite o número do serviço desejado.';

    userSessions.set(ctx.from.id, { 
      action: 'sms_select_service', 
      services: services.slice(0, 10) 
    });

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      reply_markup: getBackKeyboard()
    });
  } catch (error) {
    console.error('Erro ao buscar serviços SMS:', error);
    await ctx.reply('❌ Erro ao carregar serviços. Tente novamente.');
  }
});

bot.hears('👩, Comprar Seguidores', async (ctx) => {
  await ctx.reply(
    '👥 *Comprar Seguidores*\\n\\n' +
    'Carregando serviços disponíveis...',
    { parse_mode: 'Markdown' }
  );

  try {
    const services = await getApexServices();

    if (services.length === 0) {
      return ctx.reply('❌ Nenhum serviço disponível no momento.');
    }

    let message = '💹 *Serviços de Seguidores:*\\n\\n';
    services.slice(0, 10).forEach((service, index) => {
      message += `${index + 1}. ${service.name}\\n`;
      message += `    💰 Preço: R$ ${service.rate}/1000\\n`;
      message += `    ⏡ Min: ${service.min} | Max: ${service.max}\\n\\n`;
    });
    message += '💡 Digite: número_serviço link quantidade\\n';
    message += 'Exemplo: 1 https://instagram.com/user 1000';

    userSessions.set(ctx.from.id, { 
      action: 'followers_order', 
      services: services.slice(0, 10) 
    });

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      reply_markup: getBackKeyboard()
    });
  } catch (error) {
    console.error('Erro ao buscar serviços Apex:', error);
    await ctx.reply('❌ Erro ao carregar serviços. Tente novamente.');
  }
});

bot.hears('💳 Depositar via Pix', async (ctx) => {
  await ctx.reply(
    '💰 *Depositar via Pix*\\n\\n' +
    'Digite o valor que deseja depositar:\\n' +
    'Exemplo: 50\\n\\n' +
    '💡 Valor mínimo: R$ 5,00',
    {
      parse_mode: 'Markdown',
      reply_markup: getBackKeyboard()
    }
  );

  userSessions.set(ctx.from.id, { action: 'pix_amount' });
});

bot.hears('💰 Meu Saldo', async (ctx) => {
  try {
    const balance = await getUserBalance(ctx.from.id);

    await ctx.reply(
      `💰 *Seu Saldo Atual*\\n\\n` +
      `💵 R$ ${balance.toFixed(2)}`,
      {
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard()
      }
    );
  } catch (error) {
    await ctx.reply('❌ Erro ao consultar saldo.');
  }
});

bot.hears('📞 Suporte', async (ctx) => {
  await ctx.reply(
    '📞 *Suporte ao Cliente*\\n\\n' +
    '📧 Email: suporte@seubot.com\\n' +
    '💬 Telegram: @seu_suporte\\n' +
    '⏰ Horário: 9h às 18h\\n\\n' +
    '💡 Resposta em até 24h úteis.',
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard()
    }
  );
});

bot.hears('⬅️ Voltar', async (ctx) => {
  userSessions.delete(ctx.from.id);

  await ctx.reply(
    '🏐 Menu Principal',
    { reply_markup: getMainKeyboard() }
  );
});

// ==========================================================
// HANDLER DE TEXTO (FLUXOS)
// =========================================================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);

  if (!session) return;

  const text = ctx.message.text;

  // ========= FLUXO SMS =========
  if (session.action === 'sms_select_service') {
    const serviceIndex = parseInt(text) - 1;

    if (isNaN(serviceIndex) || !session.services[serviceIndex]) {
      return ctx.reply('❌ Serviço inválido. Digite um número da lista.');
    }

    const service = session.services[serviceIndex];
    const balance = await getUserBalance(userId);

    if (balance < service.price) {
      return ctx.reply(
        `❌ Saldo insuficiente!\\n\\n` +
        `💰 Seu saldo: R$ ${balance.toFixed(2)}\\n` +
        `💵 Necessário: R$ ${service.price.toFixed(2)}\\n\\n` +
        `Use /start para depositar.`
      );
    }

    await ctx.reply('⏳ Gerando número...');

    try {
      const result = await purchaseNumber(service.code, 'br');

      // Descontar saldo
      await updateUserBalance(userId, -service.price);

      await ctx.reply(
        `✅ *Número gerado!*\\n\\n` +
        `📱 Número: ${result.phone}\\n` +
        `🆔 ID: ${result.activationId}\\n` +
        `⏱ Válido por: 20 minutos\\n\\n` +
        `💡 Aguardando SMS...`,
        { parse_mode: 'Markdown' }
      );

      // Aguardar SMS
      userSessions.set(userId, { 
        action: 'sms_waiting', 
        activationId: result.activationId,
        attempts: 0
      });

      // Iniciar polling
      checkSmsCode(ctx, userId, result.activationId);

    } catch (error) {
      console.error('Erro ao comprar SMS:', error);
      await ctx.reply('❌ Erro ao gerar número. Tente novamente.');
    }
  }

  // ========= FLUXO SEGUIDORES =========
  else if (session.action === 'followers_order') {
    const parts = text.split(' ');

    if (parts.length !== 3) {
      return ctx.reply('❌ Formato inválido. Use: número_serviço link quantidade');
    }

    const serviceIndex = parseInt(parts[0]) - 1;
    const link = parts[1];
    const quantity = parseInt(parts[2]);

    if (isNaN(serviceIndex) || !session.services[serviceIndex]) {
      return ctx.reply('❌ Serviço inválido.');
    }

    const service = session.services[serviceIndex];
    const cost = (parseFloat(service.rate) / 1000) * quantity;
    const balance = await getUserBalance(userId);

    if (balance < cost) {
      return ctx.reply(
        `❌ Saldo insuficiente!\\n\\n` +
        `💰 Seu saldo: R$ ${balance.toFixed(2)}\\n` +
        `💵 Necessário: R$ ${cost.toFixed(2)}`
      );
    }

    await ctx.reply('⏳ Criando pedido...');

    try {
      const order = await createApexOrder(service.service, link, quantity);

      await updateUserBalance(userId, -cost);

      await ctx.reply(
        `✅ *Pedido criado!*\\n\\n` +
        `🆔 ID: ${order.order}\\n` +
        `👩, Quantidade: ${quantity}\\n` +
        `💰 Custo: R$ ${cost.toFixed(2)}\\n\\n` +
        `⏱ Processamento iniciado!`,
        { parse_mode: 'Markdown', reply_markup: getMainKeyboard() }
      );

      userSessions.delete(userId);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      await ctx.reply('❌ Erro ao criar pedido. Tente novamente.');
    }
  }

  // ========= FLUXO PIX =========
  else if (session.action === 'pix_amount') {
    const amount = parseFloat(text);

    if (isNaN(amount) || amount < 5) {
      return ctx.reply('❌ Valor inválido. Mínimo: R$ 5,00');
    }

    await ctx.reply('⏳ Gerando cobrança Pix...');

    try {
      const charge = await createPixCharge(amount, userId);

      await ctx.reply(
        `💳 *Cobrança Pix Gerada*\\n\\n` +
        `💰 Valor: R$ ${amount.toFixed(2)}\\n` +
        `💖 TXID: ${charge.txid}\\n\\n` +
        `📋 *Pix Copia e Cola:*\\n\\`${charge.pixCopiaECola}\\`\\n\\n` +
        `⏱ Válido por: 30 minutos\\n\\n` +
        `✅ O saldo será creditado automaticamente após o pagamento.`,
        { parse_mode: 'Markdown', reply_markup: getMainKeyboard() }
      );

      userSessions.delete(userId);
    } catch (error) {
      console.error('Erro ao gerar Pix:', error);
      await ctx.reply('❌ Erro ao gerar cobrança. Tente novamente.');
    }
  }
});

// ==========================================================
// POLLING DE SMS
// ==========================================================
async function checkSmsCode(ctx, userId, activationId, maxAttempts = 40) {
  const session = userSessions.get(userId);

  if (!session || session.action !== 'sms_waiting') return;

  if (session.attempts >= maxAttempts) {
    userSessions.delete(userId);
    return ctx.reply('⏱ Tempo esgotado. Nenhum SMS recebido.', {
      reply_markup: getMainKeyboard()
    });
  }

  try {
    const code = await getSmsCode(activationId);

    if (code) {
      userSessions.delete(userId);

      await ctx.reply(
        `“ *SMS RECEBIDO!*\\n\\n` +
        `💐 Código: \\`${code}\\`\\n\\n` +
        `💡 Use este código no aplicativo.`,
        { parse_mode: 'Markdown', reply_markup: getMainKeyboard() }
      );
    } else {
      session.attempts++;
      userSessions.set(userId, session);

      setTimeout(() => checkSmsCode(ctx, userId, activationId, maxAttempts), 15000);
    }
  } catch (error) {
    console.error('Erro ao verificar SMS:', error);
  }
}

// Exportar bot
module.exports = { bot };