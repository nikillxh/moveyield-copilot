# MoveYield Copilot - Deployment Guide

## Important: Telegram Web Apps require HTTPS

The "Connect Wallet & Pay" button uses Telegram's Web App feature, which **only works with HTTPS URLs**. Localhost won't work!

---

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Deploy the frontend
```bash
cd movement-web3-template
pnpm dlx vercel
```

Follow the prompts. Once deployed, you'll get a URL like:
`https://your-project.vercel.app`

### Step 2: Update the bot's .env
Edit `my-bot/.env` and set:
```
WEBAPP_URL=https://your-project.vercel.app
```

### Step 3: Restart the bot
```bash
pkill -f "node.*bot.js"
cd my-bot && node bot.js
```

---

## Option 2: Use ngrok (for testing)

### Step 1: Install ngrok
```bash
# Snap
sudo snap install ngrok

# Or download from https://ngrok.com/download
```

### Step 2: Expose localhost
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 3: Update .env and restart
```bash
# Edit my-bot/.env
WEBAPP_URL=https://abc123.ngrok.io

# Restart bot
pkill -f "node.*bot.js"
cd my-bot && node bot.js
```

---

## Testing the Flow

1. Open Telegram and start your bot
2. Type `/start`
3. Click "💰 Deposit"
4. Enter an amount (e.g., `100`)
5. Select a strategy (e.g., `0`)
6. Click "🔗 Connect Wallet & Pay"
7. Nightly wallet should open inside Telegram
8. Approve the transaction

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────▶│  Bot (Node) │────▶│ Movement RPC│
│     User    │     │  (polling)  │     │  (testnet)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ web_app button
       ▼
┌─────────────┐     ┌─────────────┐
│  Next.js    │────▶│   Nightly   │
│  /sign page │     │   Wallet    │
└─────────────┘     └─────────────┘
```

The bot is **non-custodial** - it never holds your keys. Transactions are signed directly in your wallet via the Nightly adapter.
