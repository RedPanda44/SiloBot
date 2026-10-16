'use strict';

const stamp = () => new Date().toISOString();

/** Tiny timestamped logger so bot output is easy to scan in a terminal or PM2 logs. */
module.exports = {
  info: (...args) => console.log(`[${stamp()}] [INFO ]`, ...args),
  warn: (...args) => console.warn(`[${stamp()}] [WARN ]`, ...args),
  error: (...args) => console.error(`[${stamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.DEBUG) console.log(`[${stamp()}] [DEBUG]`, ...args);
  },
};
