'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colors } = require('../config');
const embeds = require('../lib/embeds');

const ping = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency'),
  async execute(interaction) {
    const sent = Date.now();
    await interaction.reply({ content: 'Pinging…' });
    const rtt = Date.now() - sent;
    await interaction.editReply(`Pong! Gateway: ${interaction.client.ws.ping}ms · Round-trip: ${rtt}ms`);
  },
};

const help = {
  data: new SlashCommandBuilder().setName('help').setDescription('List every command'),
  async execute(interaction) {
    const commands = [...interaction.client.commands.values()];
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle('Command list')
      .setDescription(commands.map((c) => `**/${c.data.name}** — ${c.data.description}`).join('\n'))
      .setFooter({ text: `${commands.length} commands` });
    await interaction.reply({ embeds: [embed] });
  },
};

const serverinfo = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show information about this server'),
  async execute(interaction) {
    const g = interaction.guild;
    const owner = await g.fetchOwner().catch(() => null);
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(g.name)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: owner ? owner.user.tag : '—', inline: true },
        { name: 'Members', value: String(g.memberCount), inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Channels', value: String(g.channels.cache.size), inline: true },
        { name: 'Roles', value: String(g.roles.cache.size), inline: true },
        { name: 'Boost tier', value: String(g.premiumTier), inline: true },
        { name: 'Server ID', value: g.id, inline: false },
      );
    await interaction.reply({ embeds: [embed] });
  },
};

const userinfo = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show information about a member')
    .addUserOption((o) => o.setName('user').setDescription('The member to inspect')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        {
          name: 'Joined',
          value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : '—',
          inline: true,
        },
      );
    if (member && member.roles.cache.size > 1) {
      embed.addFields({
        name: 'Roles',
        value:
          member.roles.cache
            .filter((r) => r.id !== interaction.guild.id)
            .map((r) => `<@&${r.id}>`)
            .slice(0, 25)
            .join(' ') || '—',
      });
    }
    await interaction.reply({ embeds: [embed] });
  },
};

const avatar = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Show a member's avatar")
    .addUserOption((o) => o.setName('user').setDescription('The member')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`${user.tag}'s avatar`)
      .setImage(user.displayAvatarURL({ size: 512 }));
    await interaction.reply({ embeds: [embed] });
  },
};

const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
const poll = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Start a reaction poll')
    .addStringOption((o) => o.setName('question').setDescription('The question').setRequired(true))
    .addStringOption((o) =>
      o.setName('options').setDescription('Up to 5 choices separated by | (optional)'),
    ),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const raw = interaction.options.getString('options');
    const options = raw
      ? raw.split('|').map((s) => s.trim()).filter(Boolean).slice(0, 5)
      : [];

    const embed = new EmbedBuilder().setColor(colors.primary).setTitle('📊 Poll').setDescription(question);
    if (options.length) {
      embed.addFields(options.map((opt, i) => ({ name: `${NUMBER_EMOJI[i]} ${opt}`, value: '\u200b' })));
    }

    await interaction.reply({ embeds: [embed] });
    const message = await interaction.fetchReply();
    if (options.length) {
      for (let i = 0; i < options.length; i += 1) await message.react(NUMBER_EMOJI[i]);
    } else {
      await message.react('👍');
      await message.react('👎');
    }
  },
};

const EIGHT_BALL = [
  'It is certain.', 'Without a doubt.', 'Yes — definitely.', 'You may rely on it.',
  'Most likely.', 'Outlook good.', 'Signs point to yes.', 'Reply hazy, try again.',
  'Ask again later.', "Can't predict now.", "Don't count on it.", 'My reply is no.',
  'Very doubtful.', 'Absolutely not.', 'The stars say yes.',
];
const eightball = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball')
    .addStringOption((o) => o.setName('question').setDescription('Your question').setRequired(true)),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const answer = EIGHT_BALL[Math.floor(Math.random() * EIGHT_BALL.length)];
    await interaction.reply({ embeds: [embeds.info(`🎱 ${question}`, `**${answer}**`)] });
  },
};

module.exports = [ping, help, serverinfo, userinfo, avatar, poll, eightball];
