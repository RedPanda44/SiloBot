'use strict';

require('dotenv').config();

const path = require('path');

/**
 * Central configuration. Everything that tunes the bot's behaviour lives here
 * (or is pulled from the environment) so the command/event files stay simple.
 */
module.exports = {
  // --- Credentials (from .env) ---
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',

  // --- Paths ---
  dataDir: path.join(__dirname, '..', 'data'),

  // --- Branding ---
  brand: {
    name: 'Silo',
    footer: 'Silo Community Bot',
    // Set a URL to show an image next to embeds (optional).
    iconUrl: '',
  },

  // --- Embed colours (decimal / 0x hex) ---
  colors: {
    primary: 0x0a84ff,
    success: 0x2ecc71,
    warning: 0xf1c40f,
    danger: 0xed4245,
    neutral: 0x2b2d31,
  },

  // --- Leveling ---
  xp: {
    perMessageMin: 15,
    perMessageMax: 25,
    cooldownMs: 60_000, // one XP gain per user per minute
  },

  // --- Basic automod ---
  automod: {
    blockInvites: true, // delete discord.gg invite links from non-mods
    blockLinks: false, // delete all http(s) links from non-mods
    exemptRoles: [], // role IDs that bypass automod
  },

  // --- Community: automatic release announcements ---
  announce: {
    // GitHub "owner/name" whose releases are announced automatically.
    repo: process.env.ANNOUNCE_REPO || 'RedPanda44/Silo',
    // How often to poll GitHub for new releases, in minutes.
    pollMinutes: Number(process.env.ANNOUNCE_POLL_MINUTES) || 15,
  },
};
