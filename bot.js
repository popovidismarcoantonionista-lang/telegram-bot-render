require('dotenv').config();
const { Telegraf } = require('telegraf');
const { getMainKeyboard, getBackKeyboard } = require('./utils/keyboards');
const { getUserBalance, createUser, updateUserBalance } = require('./database/supabase');
const { getAvailableServices, purchaseNumber, getSmsCode } = require('./services/sms');
const { getApexServices, createApexOrder } = require('./services/apex');
const { createPixCharge } = require('./services/pix');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Armazenamento temporário de sessões
const userSessions = new Map();

// ==========================================
// COMANDO /START
// ==========================================
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name;

  await createUser(userId, username);

  await ctx.reply(
    `🤖 *Bem-vindo ao Bot de Serviços!*` + `\n\n` +
    `👤 Usuário: ${username}\n` +
    `🆔 ID: ${userId}\n\n` +
    `Escolha uma opção abaixo:`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard()
    }
  );
});

// ==========================================
// MENU PRINCIPAL
// ==========================================
bot.hears('💬 Comprar SMS', async (ctx) => {
  userSessions.set(ctx.from.id, { action: 'sms_select_service' });

  await ctx.reply(
    '📱 *Comprar SMS Descartável*\n\n' +
    'Carregando serviços disponíveis...',
    { parse_mode: 'Markdown' }
  );

  try {
    const services = await getAvailableServices();

    if (services.length === 0) {
      return ctx.reply('❌ Nenhum serviço disponível no momento.');
    }

    let message = '📋 *Serviços disponíveis:*\n\n';
    services.slice(0, 10).forEach((service, index) => {
      message += `${index + 1}. ${service.name} - R$ ${service.price.toFixed(2)}\n`;
    });
    message += '\n💡 Digite o número do serviço desejado.';

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

bot.hears('👥 Comprar Seguidores', async (ctx) => {
  await ctx.reply(
    '👥 *Comprar Seguidores*\n\n' +
    'Carregando serviços disponíveis...',
    { parse_mode: 'Markdown' }
  );

  try {
    const services = await getApexServices();

    if (services.length === 0) {
      return ctx.reply('❌ Nenhum serviço disponível no momento.');
    }

    let message = '📋 *Serviços de Seguidores:*\n\n';
    services.slice(0, 10).forEach((service, index) => {
      message += `${index + 1}. ${service.name}\n`;
      message += `   💰 Preço: R$ ${service.rate}/1000\n`;
      message += `   ⏱ Min: ${service.min} | Max: ${service.max}\n\n`;
    });
    message += '💡 Digite: numero_serviço link quantidade\n';
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
    '💰 *Depositar via Pix*\n\n' +
    'Digite o valor que deseja depositar:\n' +
    'Exemplo: 50\n\n' +
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
      `💰 *Seu Saldo Atual*\n\n` +
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
    '📞 *Suporte ao Cliente*\n\n' +
    '📧 Email: marconista2301@gmail.com\n' +
    '💬 Telegram: @marcodeveloper604\n' +
    '⏰ Horário: 14h às 18h\n\n' +
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
    '🏠 Menu Principal',
    { reply_markup: getMainKeyboard() }
  );
});
