'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../lib/embeds');
const { provisionGuild } = require('../lib/bootstrap');
const { ensure } = require('../lib/permissions');

const MARK = { created: '✅', renamed: '✏️', exists: '↺' };
const format = (items) => items.map((item) => `${MARK[item.status] || '•'} ${item.name}`).join('\n') || '—';

const setup = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Create the standard channels and roles for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName('server').setDescription('Create channels, roles and wire up the bot')),

  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
    await interaction.deferReply({ ephemeral: true });

    const results = await provisionGuild(interaction.guild);

    const embed = embeds
      .success('Server setup complete')
      .setDescription('✅ created · ✏️ renamed · ↺ already existed')
      .addFields(
        {
          name: 'Roles (highest first)',
          value: results.hierarchy?.length ? results.hierarchy.join(' › ') : format(results.roles),
        },
        { name: 'Roles (status)', value: format(results.roles) },
        { name: 'Channels', value: format(results.channels) },
        { name: 'Content', value: format(results.posted) },
        { name: 'Next step', value: 'Post the ticket panel with `/ticket panel` in #support.' },
      );
    return interaction.editReply({ embeds: [embed] });
  },
};

module.exports = setup;
