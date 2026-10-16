'use strict';

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const config = require('./config');
const logger = require('./lib/logger');

if (!config.token || !config.clientId) {
  logger.error('DISCORD_TOKEN and CLIENT_ID are required to deploy commands.');
  process.exit(1);
}

// Collect every command's JSON payload from the commands/ directory.
const body = [];
const commandsDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'))) {
  const mod = require(path.join(commandsDir, file));
  for (const command of Array.isArray(mod) ? mod : [mod]) {
    body.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
      logger.info(`Registered ${body.length} command(s) to guild ${config.guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body });
      logger.info(`Registered ${body.length} global command(s) (may take up to ~1h to appear).`);
    }
  } catch (error) {
    logger.error('Failed to deploy commands:', error);
    process.exit(1);
  }
})();
