import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

const TOKEN = process.env.BOT_API;
const VAULT_ADDRESS = process.env.VAULT_ADDRESS; // e.g. 0x....
const RPC_URL = process.env.MOVEMENT_RPC_URL; // required: movement testnet RPC

if (!TOKEN) {
	console.error("BOT_API not set in .env");
	process.exit(1);
}

if (!VAULT_ADDRESS) {
	console.error("VAULT_ADDRESS not set in .env");
	// continue: some commands will fail until set
}

if (!RPC_URL) {
	console.error("MOVEMENT_RPC_URL not set in .env");
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Simple in-memory state for multi-step flows (per chat)
const sessions = new Map();

function setSession(chatId, data) {
	sessions.set(chatId, { ...(sessions.get(chatId) || {}), ...data });
}

function clearSession(chatId) {
	sessions.delete(chatId);
}

async function viewFunction(functionId, args = [], type_args = []) {
	if (!RPC_URL) throw new Error("RPC_URL not configured");
	const res = await fetch(`${RPC_URL}/view`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ function: functionId, type_arguments: type_args, arguments: args }),
	});
	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`View call failed: ${res.status} ${txt}`);
	}
	return res.json();
}

async function getStrategies() {
	if (!VAULT_ADDRESS) return [];
	try {
		// get_strategies<T>(owner: address) - pass vault address and type arg for AptosCoin
		const resp = await viewFunction(
			`${VAULT_ADDRESS}::vault::get_strategies`,
			[VAULT_ADDRESS],
			["0x1::aptos_coin::AptosCoin"]
		);
		// Resp format depends on the module. Return raw and let caller handle it.
		return resp;
	} catch (e) {
		console.error("get_strategies error", e);
		return null;
	}
}

async function getVaultState() {
	if (!VAULT_ADDRESS) return null;
	try {
		// get_vault_state<T>() returns (total_assets, total_shares, active_strategy)
		const resp = await viewFunction(
			`${VAULT_ADDRESS}::vault::get_vault_state`,
			[],
			["0x1::aptos_coin::AptosCoin"]
		);
		return resp;
	} catch (e) {
		console.error("get_vault_state error", e);
		return null;
	}
}

bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const text = `🚀 *MoveYield Copilot*\n\nTelegram-first, non-custodial vault controller on Movement Testnet.\n\nChoose an action:`;
	const opts = {
		reply_markup: {
			inline_keyboard: [
				[{ text: "📊 View strategies", callback_data: "strategies" }],
				[{ text: "💰 Deposit", callback_data: "deposit" }],
				[{ text: "� Withdraw", callback_data: "withdraw" }],
				[{ text: "�📈 Check position", callback_data: "position" }],
			],
		},
		parse_mode: 'Markdown',
	};
	bot.sendMessage(chatId, text, opts);
});

bot.on('callback_query', async (query) => {
	const chatId = query.message.chat.id;
	const data = query.data;
	if (data === 'strategies') {
		await handleStrategies(chatId);
	} else if (data === 'deposit') {
		await bot.sendMessage(chatId, 'Enter amount of MOVE to deposit (integer, in smallest unit if applicable).');
		setSession(chatId, { flow: 'deposit_step_amount' });
	} else if (data === 'withdraw') {
		await bot.sendMessage(chatId, 'Enter amount of shares to withdraw (integer).');
		setSession(chatId, { flow: 'withdraw_step_amount' });
	} else if (data === 'position') {
		await bot.sendMessage(chatId, 'To show your position I need your wallet address. Please reply with your wallet address.');
		setSession(chatId, { flow: 'position_wait_address' });
	}
	bot.answerCallbackQuery(query.id).catch(() => {});
});

bot.on('message', async (msg) => {
	const chatId = msg.chat.id;
	const text = msg.text?.trim();
	if (!text) return;

	const session = sessions.get(chatId) || {};

	try {
		if (session.flow === 'deposit_step_amount') {
			const amount = text.trim();
			
			// Validate amount is a positive integer
			const amountNum = parseInt(amount, 10);
			if (Number.isNaN(amountNum) || amountNum <= 0 || !(/^\d+$/.test(amount))) {
				await bot.sendMessage(chatId, '❌ *Invalid amount*\n\nPlease enter a valid positive integer (e.g., 100, 1000).', { parse_mode: 'Markdown' });
				return;
			}
			
			// Save amount and ask for strategy
			const strategies = await getStrategies();
			if (!strategies) {
				await bot.sendMessage(chatId, '❌ Could not fetch strategies from chain. Please try later.');
				clearSession(chatId);
				return;
			}
			
			// Response is [[...strategies]], unwrap first element
			const strategyList = Array.isArray(strategies[0]) ? strategies[0] : strategies;
			
			if (!Array.isArray(strategyList) || strategyList.length === 0) {
				await bot.sendMessage(chatId, '❌ No strategies found on-chain.');
				clearSession(chatId);
				return;
			}
			
			const riskLabels = { 0: 'Low', 1: 'Medium', 2: 'High' };
			let listText = '*Available strategies* (reply with the number):\n';
			strategyList.forEach((s, i) => {
				const name = s.name || `Strategy ${i}`;
				const riskLevel = s.risk_level !== undefined ? s.risk_level : '-';
				const riskText = riskLabels[riskLevel] || riskLevel;
				const desc = s.description || '';
				listText += `\n*${i}: ${name}*\nRisk: ${riskText}\n${desc}\n`;
			});
			await bot.sendMessage(chatId, `💰 *Deposit Amount:* ${amount} MOVE\n\n${listText}`, { parse_mode: 'Markdown' });
			setSession(chatId, { flow: 'deposit_choose_strategy', amount, strategies: strategyList });
			return;
		}

		if (session.flow === 'deposit_choose_strategy') {
			const strategyIndex = parseInt(text.trim(), 10);
			const amount = session.amount;
			const strategyList = session.strategies || [];
			
			if (Number.isNaN(strategyIndex) || strategyIndex < 0 || strategyIndex >= strategyList.length) {
				await bot.sendMessage(chatId, `❌ *Invalid strategy*\n\nPlease reply with a number between 0 and ${strategyList.length - 1}.`, { parse_mode: 'Markdown' });
				return;
			}
			
			const selectedStrategy = strategyList[strategyIndex];
			const strategyName = selectedStrategy ? selectedStrategy.name : `Strategy ${strategyIndex}`;
			
			// Get fees from contract (in basis points, divide by 100 to get percentage)
			const mgmtFeeBps = selectedStrategy?.management_fee_bps || 0;
			const perfFeeBps = selectedStrategy?.performance_fee_bps || 0;
			const mgmtFeePercent = (parseInt(mgmtFeeBps, 10) / 100).toFixed(2);
			const perfFeePercent = (parseInt(perfFeeBps, 10) / 100).toFixed(2);

			// Transaction payload for the user
			const txPayload = {
				function: `${VAULT_ADDRESS}::vault::deposit`,
				type_arguments: ["0x1::aptos_coin::AptosCoin"],
				arguments: [amount],
			};

			const summary = `✅ *Deposit Ready*

💰 *Amount:* ${amount} MOVE
📊 *Strategy:* ${strategyName}
💸 *Management Fee:* ${mgmtFeePercent}%
💸 *Performance Fee:* ${perfFeePercent}%

📝 *Transaction Payload:*
\`\`\`json
${JSON.stringify(txPayload, null, 2)}
\`\`\`

👉 *To complete:*
1. Open Nightly wallet (browser extension or app)
2. Go to Movement Testnet
3. Use the payload above to call the deposit function

Or use Movement Explorer to submit:`;

			// Link to Movement explorer (they have a contract interaction UI)
			const explorerUrl = `https://explorer.movementnetwork.xyz/account/${VAULT_ADDRESS}/modules/run/vault/deposit?network=testnet`;

			await bot.sendMessage(chatId, summary, {
				parse_mode: 'Markdown',
				reply_markup: {
					inline_keyboard: [
						[{ text: '🔗 Open Movement Explorer', url: explorerUrl }],
					],
				},
			});
			
			clearSession(chatId);
			return;
		}

		if (session.flow === 'withdraw_step_amount') {
			const amount = text.trim();
			
			// Validate amount is a positive integer
			const amountNum = parseInt(amount, 10);
			if (Number.isNaN(amountNum) || amountNum <= 0 || !(/^\d+$/.test(amount))) {
				await bot.sendMessage(chatId, '❌ *Invalid amount*\n\nPlease enter a valid positive integer (e.g., 100, 1000).', { parse_mode: 'Markdown' });
				return;
			}

			// Transaction payload for the user
			const txPayload = {
				function: `${VAULT_ADDRESS}::vault::withdraw`,
				type_arguments: ["0x1::aptos_coin::AptosCoin"],
				arguments: [amount],
			};

			const summary = `💸 *Withdraw Ready*

💰 *Shares to withdraw:* ${amount}

📝 *Transaction Payload:*
\`\`\`json
${JSON.stringify(txPayload, null, 2)}
\`\`\`

👉 *To complete:*
1. Open Nightly wallet (browser extension or app)
2. Go to Movement Testnet
3. Use the payload above to call the withdraw function

Or use Movement Explorer to submit:`;

			const explorerUrl = `https://explorer.movementnetwork.xyz/account/${VAULT_ADDRESS}/modules/run/vault/withdraw?network=testnet`;

			await bot.sendMessage(chatId, summary, {
				parse_mode: 'Markdown',
				reply_markup: {
					inline_keyboard: [
						[{ text: '🔗 Open Movement Explorer', url: explorerUrl }],
					],
				},
			});
			
			clearSession(chatId);
			return;
		}

		if (session.flow === 'position_wait_address') {
			const address = text.trim();
			
			// Validate address format (should be 0x followed by 64 hex chars)
			if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
				await bot.sendMessage(chatId, '❌ *Invalid wallet address*\n\nPlease enter a valid Movement address (e.g., 0x1234...abcd).', { parse_mode: 'Markdown' });
				return;
			}
			
			// fetch vault state
			const vaultState = await getVaultState();
			// Try to fetch account resources to find position info
			let userShares = null;
			let accountFound = false;
			if (RPC_URL) {
				try {
					const r = await fetch(`${RPC_URL}/accounts/${address}/resources`);
					if (r.ok) {
						accountFound = true;
						const resources = await r.json();
						// Heuristic: find resource with type containing 'vault' or 'position' and a 'shares' field
						for (const res of resources) {
							const type = res.type.toLowerCase();
							if (type.includes('vault') || type.includes('position')) {
								if (res.data && (res.data.shares || res.data.share_amount || res.data.balance)) {
									userShares = res.data.shares || res.data.share_amount || res.data.balance;
									break;
								}
							}
						}
					} else if (r.status === 404) {
						await bot.sendMessage(chatId, '❌ *Account not found*\n\nThis address does not exist on Movement Testnet.', { parse_mode: 'Markdown' });
						clearSession(chatId);
						return;
					}
				} catch (e) {
					console.error('account resources fetch failed', e);
				}
			}

			// Format vault state nicely
			let vaultMsg = '📊 *Vault State*\n';
			if (vaultState && Array.isArray(vaultState) && vaultState.length >= 3) {
				const [totalAssets, totalShares, activeStrategy] = vaultState;
				const strategyNames = { 0: 'Stable Safe', 1: 'MOVE Long' };
				vaultMsg += `\nTotal Assets: ${totalAssets} MOVE`;
				vaultMsg += `\nTotal Shares: ${totalShares}`;
				vaultMsg += `\nActive Strategy: ${strategyNames[activeStrategy] || activeStrategy}`;
			} else {
				vaultMsg += '\nCould not fetch vault state.';
			}
			
			let positionMsg = '\n\n📈 *Your Position*\n';
			if (userShares !== null) {
				positionMsg += `\nShares: ${userShares}`;
			} else if (accountFound) {
				positionMsg += '\nNo position found for this address.';
			} else {
				positionMsg += '\nCould not fetch position.';
			}
			
			await bot.sendMessage(chatId, vaultMsg + positionMsg, { parse_mode: 'Markdown' });
			clearSession(chatId);
			return;
		}

		// fallback: simple commands typed as text
		if (text === '/strategies') {
			await handleStrategies(chatId);
			return;
		}

		if (text === '/deposit') {
			await bot.sendMessage(chatId, 'Enter amount of MOVE to deposit (integer).');
			setSession(chatId, { flow: 'deposit_step_amount' });
			return;
		}

		if (text === '/position') {
			await bot.sendMessage(chatId, 'Please reply with your wallet address to check position.');
			setSession(chatId, { flow: 'position_wait_address' });
			return;
		}

	} catch (err) {
		console.error(err);
		await bot.sendMessage(chatId, 'An error occurred while processing your request.');
		clearSession(chatId);
	}
});

async function handleStrategies(chatId) {
	const strategies = await getStrategies();
	if (!strategies) {
		await bot.sendMessage(chatId, 'Could not fetch strategies from chain. Ensure MOVEMENT_RPC_URL and VAULT_ADDRESS are configured.');
		return;
	}
	
	// Response is [[...strategies]], unwrap first element
	const strategyList = Array.isArray(strategies[0]) ? strategies[0] : strategies;
	
	if (!Array.isArray(strategyList) || strategyList.length === 0) {
		await bot.sendMessage(chatId, 'No strategies found on-chain.');
		return;
	}
	
	const riskLabels = { 0: 'Low', 1: 'Medium', 2: 'High' };
	
	let msg = '📊 *Strategies:*\n';
	strategyList.forEach((s, i) => {
		const name = s.name || `Strategy ${i}`;
		const riskLevel = s.risk_level !== undefined ? s.risk_level : '-';
		const riskText = riskLabels[riskLevel] || riskLevel;
		const desc = s.description || '';
		msg += `\n*${i}: ${name}*\nRisk: ${riskText}\n${desc}\n`;
	});
	msg += '\n_Note: No APY or projected yield is shown (testnet)._';
	await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

console.log('Bot started (polling)');