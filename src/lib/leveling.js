'use strict';

const { xp } = require('../config');

/**
 * Quadratic curve: level L requires `5L² + 50L + 100` XP to complete.
 * Level 0 -> 100 XP, level 1 -> 155, level 2 -> 220, ...
 */
function xpToComplete(level) {
  return 5 * level * level + 50 * level + 100;
}

/** Derive the current level from a total XP amount. */
function levelFromXp(totalXp) {
  let level = 0;
  let remaining = totalXp;
  while (remaining >= xpToComplete(level)) {
    remaining -= xpToComplete(level);
    level += 1;
  }
  return level;
}

/** XP progress info for a total XP amount (used by /rank). */
function progress(totalXp) {
  const level = levelFromXp(totalXp);
  let remaining = totalXp;
  for (let l = 0; l < level; l += 1) remaining -= xpToComplete(l);
  const needed = xpToComplete(level);
  return { level, into: remaining, needed, total: totalXp };
}

/** Random XP for a single message. */
function randomXp() {
  const { perMessageMin: min, perMessageMax: max } = xp;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { xpToComplete, levelFromXp, progress, randomXp };
