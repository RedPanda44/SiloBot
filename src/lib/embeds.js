'use strict';

const { EmbedBuilder } = require('discord.js');
const { colors, brand } = require('../config');

/** Apply shared branding (footer/timestamp) to every embed. */
function withBrand(embed) {
  embed.setTimestamp();
  const footer = { text: brand.footer };
  if (brand.iconUrl) footer.iconURL = brand.iconUrl;
  embed.setFooter(footer);
  return embed;
}

const make = (color, title, description) => {
  const embed = new EmbedBuilder().setColor(color);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return withBrand(embed);
};

module.exports = {
  base: make,
  success: (title, description) => make(colors.success, title, description),
  error: (title, description) => make(colors.danger, title, description),
  warn: (title, description) => make(colors.warning, title, description),
  info: (title, description) => make(colors.primary, title, description),
  neutral: (title, description) => make(colors.neutral, title, description),
};
