# 🚀 MoveYield Copilot

Non-custodial DeFi Yield Aggregator on Movement Blockchain, accessible via Telegram.

## 🌐 Links

- **Telegram Bot**: [@moveYieldCopilot_bot](https://t.me/moveYieldCopilot_bot)
- **Website**: [moveyieldcopilot.vercel.app](https://movement-web3-template-ten.vercel.app)
- **Contract Explorer**: [View on Movement Explorer](https://explorer.movementnetwork.xyz/account/0x5c1438090e291865f9f74c8d0f920e770ace8f65e2bf18b85a9905efdc4b31c2?network=bardock+testnet)

## 📋 Overview

MoveYield Copilot is a Telegram-based DeFi application that allows users to:
- 💰 **Deposit** funds into yield-generating vaults
- 💸 **Withdraw** funds from vaults
- 📊 **Check positions** and track yields
- 🎯 **View strategies** available on the platform

All transactions are **non-custodial** - users sign transactions directly with their Nightly wallet.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Telegram Bot   │────▶│   Web Frontend  │────▶│  Nightly Wallet │
│   (Node.js)     │     │    (Next.js)    │     │   (Browser)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │ Movement Network│
                                               │ (Smart Contract)│
                                               └─────────────────┘
```

## 📁 Project Structure

```
moveyield-copilot/
├── contracts/                 # Move smart contracts
│   ├── sources/
│   │   └── vault.move        # Main vault contract
│   └── Move.toml
├── my-bot/                    # Telegram bot
│   ├── bot.js                # Bot logic
│   ├── .env                  # Environment variables
│   └── package.json
└── movement-web3-template/    # Web frontend
    ├── app/
    │   ├── page.tsx          # Landing page
    │   └── sign/
    │       └── page.tsx      # Transaction signing page
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm or npm
- Movement CLI (for contract deployment)
- Nightly Wallet browser extension

### 1. Clone the Repository

```bash
git clone https://github.com/parthchandel/moveyield-copilot.git
cd moveyield-copilot
```

### 2. Deploy Smart Contract (Optional)

```bash
cd contracts
movement init
movement move publish --named-addresses move_yield_copilot=default
```

### 3. Setup Telegram Bot

```bash
cd my-bot
npm install
```

Create `.env` file:
```env
BOT_API=your_telegram_bot_token
VAULT_ADDRESS=0x5c1438090e291865f9f74c8d0f920e770ace8f65e2bf18b85a9905efdc4b31c2
MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
WEBAPP_URL=https://moveyieldcopilot.vercel.app
```

Run the bot:
```bash
node bot.js
```

### 4. Setup Web Frontend

```bash
cd movement-web3-template
npm install
npm run dev
```

## 🤖 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and main menu |
| `/deposit` | Deposit MOVE tokens into vault |
| `/withdraw` | Withdraw MOVE tokens from vault |
| `/strategies` | View available yield strategies |
| `/position` | Check your current position |

## 🔧 Smart Contract

The vault contract (`vault.move`) provides:

- **deposit<T>**: Deposit tokens and receive shares
- **withdraw<T>**: Burn shares and receive tokens
- **get_position**: View user's share balance
- **get_strategies**: List available strategies
- **get_total_assets**: View total vault TVL

### Contract Address
```
0x5c1438090e291865f9f74c8d0f920e770ace8f65e2bf18b85a9905efdc4b31c2
```

## 🌐 Deploying the Bot

### Option 1: Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add environment variables (BOT_API, VAULT_ADDRESS, etc.)
4. Deploy!

### Option 2: Render

1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Set build command: `npm install`
4. Set start command: `node bot.js`
5. Add environment variables
6. Deploy!

### Option 3: VPS (DigitalOcean, AWS, etc.)

```bash
# SSH into server
ssh user@your-server

# Clone repo
git clone https://github.com/parthchandel/moveyield-copilot.git
cd moveyield-copilot/my-bot

# Install dependencies
npm install

# Create .env file with your variables
nano .env

# Run with PM2 for persistence
npm install -g pm2
pm2 start bot.js --name moveyield-bot
pm2 save
pm2 startup
```

## 🔐 Security

- **Non-custodial**: Private keys never leave user's wallet
- **Transaction signing**: All transactions signed client-side via Nightly wallet
- **Read-only bot**: Bot only reads blockchain state, cannot execute transactions

## 🛠️ Tech Stack

- **Blockchain**: Movement Network (Aptos-based)
- **Smart Contract**: Move language
- **Bot**: Node.js + node-telegram-bot-api
- **Frontend**: Next.js 13 + Tailwind CSS
- **Wallet**: Nightly Wallet
- **Deployment**: Vercel (frontend)

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

Built with ❤️ for the Movement ecosystem
