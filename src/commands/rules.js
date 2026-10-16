'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const rules = require('../lib/rules');
const { ensure } = require('../lib/permissions');

const command = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Show or post the server rules')
    .addSubcommand((sub) => sub.setName('show').setDescription('Show the rules here (only you see them)'))
    .addSubcommand((sub) =>
      sub
        .setName('post')
        .setDescription('(Re)post the welcome + rules (staff)')
        .addChannelOption((o) => o.setName('channel').setDescription('Where to post (defaults to this channel)')),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'show') {
      return interaction.reply({ embeds: [rules.rulesEmbed()], ephemeral: true });
    }

    if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    if (!channel?.isTextBased()) {
      return interaction.reply({ embeds: [embeds.error('Not a text channel')], ephemeral: true });
    }
    const generalId = store.getConfig(interaction.guild.id, 'welcomeChannel');
    await channel.send(rules.rulesPayload(generalId));
    return interaction.reply({ embeds: [embeds.success('Rules posted', `Posted in ${channel}.`)], ephemeral: true });
  },
};

module.exports = command;
