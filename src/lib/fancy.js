'use strict';

/**
 * Unicode "font" helpers. Discord does not let you set a real font, but channel
 * and category names can use styled Unicode letters to fake one. These convert
 * plain text into a chosen style, leaving anything without a mapping untouched.
 */

const BOLD_UPPER = 0x1d5d4; // 𝗔
const BOLD_LOWER = 0x1d5ee; // 𝗮
const BOLD_DIGIT = 0x1d7e2; // 𝟬

/** Mathematical sans-serif bold — used for category names. */
function toBold(text) {
  return [...String(text)]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(BOLD_UPPER + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(BOLD_LOWER + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(BOLD_DIGIT + (code - 48));
      return ch;
    })
    .join('');
}

const SMALL_CAPS = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ',
  l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ',
  w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};

/** Small-caps letters — used for channel names. */
function toSmallCaps(text) {
  return [...String(text)]
    .map((ch) => SMALL_CAPS[ch.toLowerCase()] ?? ch)
    .join('');
}

module.exports = { toBold, toSmallCaps };
