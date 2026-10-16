'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const { ensure } = require('../lib/permissions');

const config = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the bot for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommandGroup((group) =>
      group
        .setName('welcome')
        .setDescription('Welcome messages for new members')
        .addSubcommand((sub) =>
          sub
            .setName('set')
            .setDescription('Set the welcome channel and message')
            .addChannelOption((o) =>
              o.setName('channel').setDescription('Welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true),
            )
            .addStringOption((o) =>
              o.setName('message').setDescription('Variables: {user} {server} {count}'),
            ),
        )
        .addSubcommand((sub) => sub.setName('off').setDescription('Disable welcome messages')),
    )
    .addSubcommand((sub) =>
      sub
        .setName('autorole')
        .setDescription('Role auto-granted to new members')
        .addRoleOption((o) => o.setName('role').setDescription('The role (omit to disable)')),
    )
    .addSubcommand((sub) =>
      sub
        .setName('logs')
        .setDescription('Set the moderation log channel')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('announce')
        .setDescription('Set the announcements channel')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Announcements channel').addChannelTypes(ChannelType.GuildText).setRequired(true),
        ),
    )
    .addSubcommand((sub) => sub.setName('show').setDescription('Show the current configuration')),

  async execute(interaction) {
    if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
    const guildId = interaction.guild.id;
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (group === 'welcome') {
      if (sub === 'off') {
        store.setConfig(guildId, 'welcomeChannel', null);
        return interaction.reply({ embeds: [embeds.success('Welcome messages disabled')] });
      }
      const channel = interaction.options.getChannel('channel');
      const message =
        interaction.options.getString('message') ||
        'Welcome {user} to **{server}**! You are member #{count}.';
      store.setConfig(guildId, 'welcomeChannel', channel.id);
      store.setConfig(guildId, 'welcomeMessage', message);
      return interaction.reply({
        embeds: [embeds.success('Welcome updated', `Channel: ${channel}\nMessage: ${message}`)],
      });
    }

    if (sub === 'autorole') {
      const role = interaction.options.getRole('role');
      store.setConfig(guildId, 'autorole', role ? role.id : null);
      return interaction.reply({
        embeds: [embeds.success('Autorole updated', role ? `New members now receive ${role}.` : 'Autorole disabled.')],
      });
    }

    if (sub === 'logs') {
      const channel = interaction.options.getChannel('channel');
      store.setConfig(guildId, 'logChannel', channel.id);
      return interaction.reply({ embeds: [embeds.success('Log channel set', `Moderation logs go to ${channel}.`)] });
    }

    if (sub === 'announce') {
      const channel = interaction.options.getChannel('channel');
      store.setConfig(guildId, 'announceChannel', channel.id);
      return interaction.reply({ embeds: [embeds.success('Announcements channel set', `Release and announcement posts go to ${channel}.`)] });
    }

    // show
    const welcomeChannel = store.getConfig(guildId, 'welcomeChannel');
    const autorole = store.getConfig(guildId, 'autorole');
    const logChannel = store.getConfig(guildId, 'logChannel');
    const announceChannel = store.getConfig(guildId, 'announceChannel');
    const ticketCategory = store.getConfig(guildId, 'ticketCategory');
    const supportRole = store.getConfig(guildId, 'supportRole');
    const embed = embeds.info('Server configuration').addFields(
      { name: 'Welcome channel', value: welcomeChannel ? `<#${welcomeChannel}>` : 'Disabled', inline: true },
      { name: 'Autorole', value: autorole ? `<@&${autorole}>` : 'Disabled', inline: true },
      { name: 'Log channel', value: logChannel ? `<#${logChannel}>` : 'Disabled', inline: true },
      { name: 'Announcements', value: announceChannel ? `<#${announceChannel}>` : 'Disabled', inline: true },
      { name: 'Ticket category', value: ticketCategory ? `<#${ticketCategory}>` : 'Disabled', inline: true },
      { name: 'Support role', value: supportRole ? `<@&${supportRole}>` : 'Disabled', inline: true },
      { name: 'Welcome message', value: store.getConfig(guildId, 'welcomeMessage', '(default)') },
    );
    return interaction.reply({ embeds: [embed] });
  },
};

module.exports = config;
