'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const tickets = require('../lib/tickets');
const { ensure } = require('../lib/permissions');

const ticket = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Support ticket tools')
    .addSubcommand((sub) => sub.setName('open').setDescription('Open a private support ticket'))
    .addSubcommand((sub) => sub.setName('close').setDescription('Close the current ticket'))
    .addSubcommand((sub) => sub.setName('panel').setDescription('Post the ticket panel in this channel (staff)'))
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Configure the ticket system (staff)')
        .addChannelOption((o) =>
          o.setName('category').setDescription('Category new tickets are created in').addChannelTypes(ChannelType.GuildCategory).setRequired(true),
        )
        .addRoleOption((o) => o.setName('support_role').setDescription('Role that can see and manage tickets').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'open') return tickets.openTicket(interaction);
    if (sub === 'close') return tickets.closeTicket(interaction);

    if (sub === 'panel') {
      if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
      await interaction.channel.send(tickets.panelPayload());
      return interaction.reply({ embeds: [embeds.success('Panel posted')], ephemeral: true });
    }

    // setup
    if (!(await ensure(interaction, [PermissionFlagsBits.ManageGuild]))) return;
    const category = interaction.options.getChannel('category');
    const role = interaction.options.getRole('support_role');
    store.setConfig(interaction.guild.id, 'ticketCategory', category.id);
    store.setConfig(interaction.guild.id, 'supportRole', role.id);
    return interaction.reply({
      embeds: [embeds.success('Ticket system configured', `New tickets go into **${category.name}** and are visible to ${role}.`)],
    });
  },
};

module.exports = ticket;
