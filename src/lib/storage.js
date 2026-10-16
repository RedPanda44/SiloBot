'use strict';

const fs = require('fs');
const path = require('path');
const { dataDir } = require('../config');
const logger = require('./logger');

/**
 * Dead-simple JSON persistence. Good enough for a community server and easy to
 * swap for SQLite/Postgres later. The whole store is kept in memory and flushed
 * to `data/store.json` on every write.
 */
const file = path.join(dataDir, 'store.json');
let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    cache = {};
  }
  if (!cache.guilds) cache.guilds = {};
  if (!cache.meta) cache.meta = {};
  return cache;
}

function flush() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(cache, null, 2));
  } catch (error) {
    logger.error('Failed to persist store:', error);
  }
}

function guild(id) {
  const db = load();
  const g = (db.guilds[id] ||= { config: {}, warnings: {}, levels: {}, tickets: {} });
  g.config ||= {};
  g.warnings ||= {};
  g.levels ||= {};
  g.tickets ||= {};
  return g;
}

module.exports = {
  // --- Per-guild config ---
  getConfig(guildId, key, fallback = null) {
    const value = guild(guildId).config[key];
    return value === undefined ? fallback : value;
  },
  setConfig(guildId, key, value) {
    guild(guildId).config[key] = value;
    flush();
  },

  // --- Warnings ---
  addWarning(guildId, userId, entry) {
    const g = guild(guildId);
    (g.warnings[userId] ||= []).push(entry);
    flush();
    return g.warnings[userId];
  },
  getWarnings(guildId, userId) {
    return guild(guildId).warnings[userId] || [];
  },
  clearWarnings(guildId, userId) {
    delete guild(guildId).warnings[userId];
    flush();
  },

  // --- Leveling (stores total XP; level is derived) ---
  getXp(guildId, userId) {
    return guild(guildId).levels[userId]?.xp || 0;
  },
  setXp(guildId, userId, xp) {
    guild(guildId).levels[userId] = { xp };
    flush();
  },
  leaderboard(guildId) {
    return Object.entries(guild(guildId).levels)
      .map(([id, data]) => ({ id, xp: data.xp || 0 }))
      .sort((a, b) => b.xp - a.xp);
  },

  // --- Tickets (userId -> channelId) ---
  getTicket(guildId, userId) {
    return guild(guildId).tickets[userId] || null;
  },
  setTicket(guildId, userId, channelId) {
    guild(guildId).tickets[userId] = channelId;
    flush();
  },
  removeTicket(guildId, userId) {
    delete guild(guildId).tickets[userId];
    flush();
  },
  allTickets(guildId) {
    return { ...guild(guildId).tickets };
  },

  // --- Bot-wide state (shared across every guild) ---
  getGlobal(key, fallback = null) {
    const value = load().meta[key];
    return value === undefined ? fallback : value;
  },
  setGlobal(key, value) {
    load().meta[key] = value;
    flush();
  },
};
