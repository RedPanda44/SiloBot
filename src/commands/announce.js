'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const { ensure } = require('../lib/permissions');

/** Resolve the configured announcements channel, replying with an error if missing. */
async function announceChannel(interaction) {
  const channelId = store.getConfig(interaction.guild.id, 'announceChannel');
  if (!channelId) {
    await interaction.reply({
      embeds: [embeds.error('No announcements channel', 'Set one with `/config announce channel:#announcements`.')],
      ephemeral: true,
    });
    return null;
  }
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    await interaction.reply({ embeds: [embeds.error('Invalid channel', 'The configured announcements channel is gone. Set it again.')], ephemeral: true });
    return null;
  }
  return channel;
}

const announce = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement to the announcements channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('release')
        .setDescription('Announce a new version release')
        .addStringOption((o) => o.setName('version').setDescription('Version, e.g. 1.5.4').setRequired(true))
        .addStringOption((o) => o.setName('notes').setDescription('Release notes / highlights'))
        .addStringOption((o) => o.setName('url').setDescription('Link to the release or download page'))
        .addRoleOption((o) => o.setName('ping').setDescription('Role to ping with the announcement')),
    )
    .addSubcommand((sub) =>
      sub
        .setName('message')
        .setDescription('Post a plain announcement')
        .addStringOption((o) => o.setName('text').setDescription('The announcement text').setRequired(true))
        .addRoleOption((o) => o.setName('ping').setDescription('Role to ping with the announcement')),
    ),

  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
    const channel = await announceChannel(interaction);
    if (!channel) return;

    const sub = interaction.options.getSubcommand();
    const ping = interaction.options.getRole('ping');
    const content = ping ? ping.toString() : undefined;

    if (sub === 'release') {
      const version = interaction.options.getString('version');
      const notes = interaction.options.getString('notes');
      const url = interaction.options.getString('url');
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({ name: config.brand.name })
        .setTitle(`🚀 ${config.brand.name} ${version} released`)
        .setDescription(notes || 'A new version is available.')
        .setFooter({ text: config.brand.footer })
        .setTimestamp();
      if (url) embed.setURL(url);
      await channel.send({ content, embeds: [embed] });
      return interaction.reply({ embeds: [embeds.success('Release announced', `Posted to ${channel}.`)], ephemeral: true });
    }

    const text = interaction.options.getString('text');
    await channel.send({ content, embeds: [embeds.info('📣 Announcement', text)] });
    return interaction.reply({ embeds: [embeds.success('Announcement posted', `Posted to ${channel}.`)], ephemeral: true });
  },
};

module.exports = announce;
