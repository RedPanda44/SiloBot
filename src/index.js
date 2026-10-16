'use strict';

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const config = require('./config');
const logger = require('./lib/logger');

if (!config.token) {
  logger.error('DISCORD_TOKEN is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // welcome / autorole / leave logs
    GatewayIntentBits.GuildMessages, // automod
    GatewayIntentBits.MessageContent, // leveling + automod (PRIVILEGED intent)
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// --- Load slash commands (each file exports one command or an array) ---
const commandsDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'))) {
  const mod = require(path.join(commandsDir, file));
  const list = Array.isArray(mod) ? mod : [mod];
  for (const command of list) {
    if (command?.data?.name && typeof command.execute === 'function') {
      client.commands.set(command.data.name, command);
    } else {
      logger.warn(`Skipped invalid command in ${file}`);
    }
  }
}
logger.info(`Loaded ${client.commands.size} command(s).`);

// --- Load gateway events ---
for (const event of require('./events')) {
  const handler = (...args) => event.execute(...args, client);
  if (event.once) client.once(event.name, handler);
  else client.on(event.name, handler);
}
logger.info('Registered event handlers.');

// --- Safety nets so a single bad interaction never takes the bot down ---
client.on('error', (error) => logger.error('Client error:', error));
process.on('unhandledRejection', (error) => logger.error('Unhandled rejection:', error));
process.on('uncaughtException', (error) => logger.error('Uncaught exception:', error));

client.login(config.token);
