'use strict';

const { Events, ActivityType, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const logger = require('../lib/logger');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const { randomXp, levelFromXp } = require('../lib/leveling');
const { startReleaseWatcher } = require('../lib/releases');
const { handleButton } = require('../lib/tickets');
const selfRoles = require('../lib/roles');

// Per-user XP cooldown, kept in memory (resets on restart, which is fine).
const xpCooldowns = new Map();

const ready = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.info(`Logged in as ${client.user.tag} (${client.user.id}) in ${client.guilds.cache.size} guild(s).`);
    client.user.setPresence({
      status: 'online',
      activities: [{ name: `${client.guilds.cache.size} server(s)`, type: ActivityType.Watching }],
    });
    startReleaseWatcher(client);
  },
};

const interactionCreate = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    try {
      if (interaction.isButton()) {
        if (await handleButton(interaction)) return;
        if (await selfRoles.handleButton(interaction)) return;
        return;
      }

      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Interaction failed (${interaction.commandName || interaction.customId}):`, error);
      const payload = {
        embeds: [embeds.error('Something went wrong', 'That action failed. Please try again.')],
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};

const guildMemberAdd = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const guildId = member.guild.id;

    // Autorole
    const autorole = store.getConfig(guildId, 'autorole');
    if (autorole) {
      const role = member.guild.roles.cache.get(autorole);
      if (role) await member.roles.add(role).catch(() => {});
    }

    // Welcome message
    const channelId = store.getConfig(guildId, 'welcomeChannel');
    if (!channelId) return;
    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const template = store.getConfig(
      guildId,
      'welcomeMessage',
      'Welcome {user} to **{server}**! You are member #{count}.',
    );
    const text = template
      .replaceAll('{user}', `<@${member.id}>`)
      .replaceAll('{server}', member.guild.name)
      .replaceAll('{count}', String(member.guild.memberCount));

    const embed = embeds.info('👋 Welcome!').setDescription(text).setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};

const guildMemberRemove = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const channelId = store.getConfig(member.guild.id, 'logChannel');
    if (!channelId) return;
    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return;
    await channel
      .send({ embeds: [embeds.neutral('Member left', `${member.user.tag} (${member.id})`)] })
      .catch(() => {});
  },
};

const messageCreate = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    const member = message.member;
    if (!member) return;

    // --- Automod (skipped for members who can manage messages) ---
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const { blockInvites, blockLinks, exemptRoles } = config.automod;
      const exempt = exemptRoles.some((roleId) => member.roles.cache.has(roleId));
      if (!exempt) {
        const hasInvite = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i.test(message.content);
        const hasLink = /https?:\/\/\S+/i.test(message.content);
        if ((blockInvites && hasInvite) || (blockLinks && hasLink)) {
          await message.delete().catch(() => {});
          const notice = await message.channel
            .send({ embeds: [embeds.warn('Automod', `${message.author}, that link is not allowed here.`)] })
            .catch(() => null);
          if (notice) setTimeout(() => notice.delete().catch(() => {}), 5000);
          return;
        }
      }
    }

    // --- Leveling ---
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    if (now - (xpCooldowns.get(key) || 0) < config.xp.cooldownMs) return;
    xpCooldowns.set(key, now);

    const before = store.getXp(message.guild.id, message.author.id);
    const total = before + randomXp();
    store.setXp(message.guild.id, message.author.id, total);

    if (levelFromXp(total) > levelFromXp(before)) {
      await message.channel
        .send({ embeds: [embeds.success('Level up!', `${message.author} reached **level ${levelFromXp(total)}**!`)] })
        .catch(() => {});
    }
  },
};

module.exports = [ready, interactionCreate, guildMemberAdd, guildMemberRemove, messageCreate];
