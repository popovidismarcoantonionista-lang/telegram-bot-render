# 🤖 Bot Telegram - Deploy no Render

Bot completo com SMS-Activate, Apex Seguidores e PixIntegra.

## 🗂️ Estrutura

```
telegram-bot-render/
├── server.js            # Express + Webhook
├── bot.js               # Lógica do bot
├── package.json         # Dependências
├── Dockerfile           # Container
├── Procfile             # Render
├── .env.example
├── services/
│   ├── sms.js
│   ├── apex.js
│   └── pix.js
├── database/
│   └── supabase.js
└── utils/
    └── keyboards.js
```

## 📋 Funcionalidades

- 💬 Compra de SMS descartável (SMS-Activate)
- 👥 Compra de seguidores (Apex Seguidores)
- 💳 Depósito via Pix com callback automático (PixIntegra)
- 💰 Sistema de saldo com Supabase
- 👤 Menu interativo
- ✅ Webhook pré-configurado

## 🗄️ Configuração do Supabase

Execute este SQL no Supabase:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT,
  balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
```

## 🚀 Deploy no Render

### 1️⃣ Criar Web Service

1. Acesse [render.com](https://render.com)
2. Clique em **New +** → **Web Service**
3. Conecte este repositório GitHub

### 2️⃣ Configurações do Build

```
Build Command: npm install
Start Command: node server.js
```

### 3️⃣ Variáveis de Ambiente

Adicione no Render:

```env
BOT_TOKEN=seu_token_do_botfather
WEBHOOK_URL=https://seu-app.onrender.com/webhook
SMS_ACTIVATE_API_KEY=sua_key
APEX_API_KEY=sua_key
PIXINTEGRA_API_KEY=sua_key
PIXINTEGRA_API_TOKEN=seu_token
SUPABASE_URL=sua_url
SUPABASE_SERVICE_ROLE=sua_key
PORT=3000
```

### 4️⃣ Depois do Deploy

✅ O webhook será configurado automaticamente ao iniciar!

## 📱 Testar o Bot

1. Abra o Telegram
2. Procure seu bot pelo username
3. Digite `/start`
4. Pronto! 🎉

## 💡 Importante

- Configure o webhook da PixIntegra para: `https://seu-app.onrender.com/pix-callback`
- A chave Pix já está configurada: **092.675.711-33**
- Mantenha as API keys em segurança

## 🔧 Desenvolvimento Local

```bash
npm install
cp .env.example .env
# Edite o .env com suas credenciais
node server.js
```

## 📞 Suporte

Em caso de dúvidas, abra uma issue no repositório.

---

**Pronto para deploy! 🚀**