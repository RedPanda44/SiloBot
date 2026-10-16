'use strict';

const { PermissionFlagsBits } = require('discord.js');
const embeds = require('./embeds');

/** Turn a permission bit into a readable name. */
function nameOf(bit) {
  const found = Object.entries(PermissionFlagsBits).find(([, value]) => value === bit);
  return found ? found[0] : String(bit);
}

/**
 * Guard a moderation command. Replies with an error embed and returns false when
 * either the invoking member or the bot is missing one of `perms`.
 */
async function ensure(interaction, perms, { checkUser = true, checkBot = true } = {}) {
  const me = interaction.guild.members.me;
  const userMissing = checkUser ? perms.filter((p) => !interaction.member.permissions.has(p)) : [];
  const botMissing = checkBot ? perms.filter((p) => !me.permissions.has(p)) : [];

  if (userMissing.length) {
    await interaction.reply({
      embeds: [embeds.error('You are missing permissions', `Required: ${userMissing.map(nameOf).join(', ')}`)],
      ephemeral: true,
    });
    return false;
  }
  if (botMissing.length) {
    await interaction.reply({
      embeds: [embeds.error('I am missing permissions', `I need: ${botMissing.map(nameOf).join(', ')}`)],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

module.exports = { ensure, nameOf };
