'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const { ensure } = require('../lib/permissions');

/** Post an action to the configured mod-log channel, if any. */
async function logAction(guild, { action, target, moderator, reason }) {
  const channelId = store.getConfig(guild.id, 'logChannel');
  if (!channelId) return;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = embeds
    .neutral(`Moderation: ${action}`)
    .addFields(
      { name: 'Target', value: `${target.tag ?? target} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
      { name: 'Reason', value: reason || 'No reason provided' },
    );
  await channel.send({ embeds: [embed] }).catch(() => {});
}

const kick = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.KickMembers]))) return;
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [embeds.error('Not found', 'That member is not in this server.')], ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ embeds: [embeds.error('Cannot kick', 'That member has a higher role than me.')], ephemeral: true });
    }
    await member.kick(reason);
    await interaction.reply({ embeds: [embeds.success('Member kicked', `**${user.tag}** was kicked.\nReason: ${reason}`)] });
    await logAction(interaction.guild, { action: 'Kick', target: user, moderator: interaction.user, reason });
  },
};

const ban = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption((o) => o.setName('user').setDescription('Member to ban').setRequired(true))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Delete this many days of their messages (0-7)').setMinValue(0).setMaxValue(7))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.BanMembers]))) return;
    const user = interaction.options.getUser('user');
    const days = interaction.options.getInteger('delete_days') || 0;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ embeds: [embeds.error('Cannot ban', 'That member has a higher role than me.')], ephemeral: true });
    }
    await interaction.guild.members.ban(user.id, { deleteMessageSeconds: days * 86_400, reason });
    await interaction.reply({ embeds: [embeds.success('Member banned', `**${user.tag}** was banned.\nReason: ${reason}`)] });
    await logAction(interaction.guild, { action: 'Ban', target: user, moderator: interaction.user, reason });
  },
};

const timeout = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .addUserOption((o) => o.setName('user').setDescription('Member to time out').setRequired(true))
    .addIntegerOption((o) => o.setName('minutes').setDescription('Duration in minutes (1-10080)').setMinValue(1).setMaxValue(10_080).setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),
  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ModerateMembers]))) return;
    const user = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [embeds.error('Not found', 'That member is not in this server.')], ephemeral: true });
    }
    if (!member.moderatable) {
      return interaction.reply({ embeds: [embeds.error('Cannot time out', 'That member has a higher role than me.')], ephemeral: true });
    }
    await member.timeout(minutes * 60_000, reason);
    await interaction.reply({ embeds: [embeds.success('Member timed out', `**${user.tag}** is muted for ${minutes} minute(s).\nReason: ${reason}`)] });
    await logAction(interaction.guild, { action: `Timeout (${minutes}m)`, target: user, moderator: interaction.user, reason });
  },
};

const purge = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk-delete recent messages')
    .addIntegerOption((o) => o.setName('count').setDescription('How many messages (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this member')),
  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ManageMessages]))) return;
    const count = interaction.options.getInteger('count');
    const user = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const filtered = (user ? messages.filter((m) => m.author.id === user.id) : messages).first(count);
    const deleted = await interaction.channel.bulkDelete(filtered, true);
    await interaction.editReply({ embeds: [embeds.success('Messages purged', `Deleted **${deleted.size}** message(s).`)] });
  },
};

const warn = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(true)),
  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ModerateMembers]))) return;
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const list = store.addWarning(interaction.guild.id, user.id, {
      reason,
      by: interaction.user.id,
      at: Date.now(),
    });
    await user
      .send({ embeds: [embeds.warn(`You were warned in ${interaction.guild.name}`, reason)] })
      .catch(() => {});
    await interaction.reply({
      embeds: [embeds.warn('Member warned', `**${user.tag}** now has **${list.length}** warning(s).\nReason: ${reason}`)],
    });
    await logAction(interaction.guild, { action: `Warn (#${list.length})`, target: user, moderator: interaction.user, reason });
  },
};

const warnings = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("Show a member's warnings")
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const list = store.getWarnings(interaction.guild.id, user.id);
    if (!list.length) {
      return interaction.reply({ embeds: [embeds.info('No warnings', `**${user.tag}** has a clean record.`)] });
    }
    const embed = embeds
      .warn(`Warnings for ${user.tag}`, `Total: **${list.length}**`)
      .addFields(
        list.slice(-10).map((w, i) => ({
          name: `#${list.length - Math.min(10, list.length) + i + 1} · <t:${Math.floor(w.at / 1000)}:R>`,
          value: `${w.reason}\n— by <@${w.by}>`,
        })),
      );
    await interaction.reply({ embeds: [embed] });
  },
};

const clearwarnings = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription("Clear a member's warnings")
    .addUserOption((o) => o.setName('user').setDescription('The member').setRequired(true)),
  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ModerateMembers]))) return;
    const user = interaction.options.getUser('user');
    store.clearWarnings(interaction.guild.id, user.id);
    await interaction.reply({ embeds: [embeds.success('Warnings cleared', `Cleared warnings for **${user.tag}**.`)] });
  },
};

module.exports = [kick, ban, timeout, purge, warn, warnings, clearwarnings];
