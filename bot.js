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

// CORRECCÇ×O tretches fuindo criticalmente no layout Box PIX e codigo.
bot_lines = bot_fixed.split('\n')

// PATEH Box Pid: zero caso concatenado
FLAG_RIM= '💳 Rimove all backticks and leave somente as aspase alternativa.'
excutesc_<export_default>();
