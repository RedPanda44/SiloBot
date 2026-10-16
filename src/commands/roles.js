'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../lib/embeds');
const roles = require('../lib/roles');
const { ensure } = require('../lib/permissions');

const command = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Self-assignable roles')
    .addSubcommand((sub) => sub.setName('panel').setDescription('(Re)post the role picker in this channel (staff)'))
    .addSubcommand((sub) => sub.setName('list').setDescription('List the roles you can pick')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const description = roles.SELF_ROLES.map((r) => `${r.emoji} **${r.label}** — ${r.description}`).join('\n');
      return interaction.reply({ embeds: [embeds.info('🎭 Self-assign roles', description)], ephemeral: true });
    }

    if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
    await interaction.channel.send(roles.panelPayload(interaction.guild));
    return interaction.reply({ embeds: [embeds.success('Role panel posted')], ephemeral: true });
  },
};

module.exports = command;
