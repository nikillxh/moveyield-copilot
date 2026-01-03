import { Bot } from "grammy";
import * as dotenv from 'dotenv';

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(process.env.BOT_API? process.env.BOT_API : ""); // <-- put your bot token between the ""

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Matches the message text against a string or a regular expression.
bot.hears(/echo *(.+)?/, async (ctx) => {/* ... */});// Start the bot.

bot.start();