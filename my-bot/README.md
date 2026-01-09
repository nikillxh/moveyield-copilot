# MoveYield Copilot - Telegram Bot

This bot is a minimal Telegram-first interface for the on-chain vault on Movement devnet.

Key points:
- The bot never holds or signs user private keys.
- The bot only reads on-chain state and constructs transaction payloads for users to sign in their wallet.

Required environment variables (create a `.env` file):

```
BOT_API=your_telegram_bot_token
VAULT_ADDRESS=0x...   # on-chain vault module address
MOVEMENT_RPC_URL=https://your.movement.devnet.rpc
```

Running

Install dependencies:

```bash
cd my-bot
npm install
```

Start bot:

```bash
node bot.js
```

How users sign transactions

1. When the bot builds a transaction payload (for example deposit), it will send you a JSON `entry_function_payload`.
2. Copy that payload into your Movement-compatible wallet (Nightly, Martian, or other) where you can paste a raw transaction payload, sign, and submit.
3. The bot does not and will not have access to your private keys.

Notes

- The bot uses the RPC `/views` endpoint to call view functions (`get_strategies`, `get_vault_state`). Ensure `MOVEMENT_RPC_URL` points to a fullnode that exposes `/views` and account resource endpoints.
- This is a minimal skeleton. Adjust payload shape as required by your wallet.
