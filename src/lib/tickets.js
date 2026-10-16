'use strict';

const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const store = require('./storage');
const embeds = require('./embeds');
const logger = require('./logger');

const BUTTONS = {
  open: 'ticket:open',
  close: 'ticket:close',
};

const supportRoleId = (guildId) => store.getConfig(guildId, 'supportRole');
const categoryId = (guildId) => store.getConfig(guildId, 'ticketCategory');

/** The persistent "open a ticket" panel (embed + button). */
function panelPayload() {
  const embed = embeds
    .info('🎫 Support tickets', 'Need a hand with something? Click the button below and a private channel will be created just for you and the support team.');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BUTTONS.open).setLabel('Open a ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary),
  );
  return { embeds: [embed], components: [row] };
}

/** Extract the owning user id from a ticket channel's topic (`ticket:<id>`). */
function ticketOwner(channel) {
  const match = /(?:^|\s)ticket:(\d{17,20})(?:\s|$)/.exec(channel?.topic || '');
  return match ? match[1] : null;
}

function isStaff(interaction) {
  if (interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  const roleId = supportRoleId(interaction.guild.id);
  return Boolean(roleId && interaction.member.roles.cache.has(roleId));
}

async function openTicket(interaction) {
  const { guild } = interaction;
  const userId = interaction.user.id;

  const existingId = store.getTicket(guild.id, userId);
  if (existingId) {
    const existing = await guild.channels.fetch(existingId).catch(() => null);
    if (existing) {
      return interaction.reply({ embeds: [embeds.warn('Ticket already open', `You already have a ticket: ${existing}.`)], ephemeral: true });
    }
    store.removeTicket(guild.id, userId);
  }

  await interaction.deferReply({ ephemeral: true });

  const roleId = supportRoleId(guild.id);
  const permissionOverwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];
  if (roleId) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    });
  }

  let channel;
  try {
    channel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`.slice(0, 100),
      type: ChannelType.GuildText,
      parent: categoryId(guild.id) || undefined,
      topic: `ticket:${userId}`,
      permissionOverwrites,
    });
  } catch (error) {
    logger.error('Failed to create ticket channel:', error);
    return interaction.editReply({ embeds: [embeds.error('Could not open a ticket', 'I need the **Manage Channels** permission in this server.')] });
  }

  store.setTicket(guild.id, userId, channel.id);

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BUTTONS.close).setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );
  await channel
    .send({
      content: `${interaction.user}${roleId ? ` · <@&${roleId}>` : ''}`,
      embeds: [embeds.info('Ticket opened', 'Describe your issue and the support team will help shortly. Use `/support` for common fixes while you wait.')],
      components: [closeRow],
    })
    .catch(() => {});

  return interaction.editReply({ embeds: [embeds.success('Ticket created', `Head over to ${channel}.`)] });
}

async function closeTicket(interaction) {
  const ownerId = ticketOwner(interaction.channel);
  if (!ownerId) {
    return interaction.reply({ embeds: [embeds.error('Not a ticket', 'Run this inside a ticket channel.')], ephemeral: true });
  }
  if (interaction.user.id !== ownerId && !isStaff(interaction)) {
    return interaction.reply({ embeds: [embeds.error('Not allowed', 'Only the ticket owner or support staff can close this ticket.')], ephemeral: true });
  }

  store.removeTicket(interaction.guild.id, ownerId);
  await interaction.reply({ embeds: [embeds.success('Closing ticket', 'This channel will be deleted in 5 seconds.')] });
  setTimeout(() => interaction.channel.delete('Ticket closed').catch(() => {}), 5000);
}

/** Route button interactions for the ticket system. */
async function handleButton(interaction) {
  if (!interaction.customId.startsWith('ticket:')) return false;
  const action = interaction.customId.split(':')[1];
  if (action === 'open') await openTicket(interaction);
  else if (action === 'close') await closeTicket(interaction);
  return true;
}

module.exports = { BUTTONS, panelPayload, openTicket, closeTicket, handleButton, ticketOwner, isStaff };
