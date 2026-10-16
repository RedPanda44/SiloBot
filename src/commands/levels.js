'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../lib/embeds');
const store = require('../lib/storage');
const { progress, levelFromXp } = require('../lib/leveling');

const rank = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show a member level and XP')
    .addUserOption((o) => o.setName('user').setDescription('The member')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const total = store.getXp(interaction.guild.id, user.id);
    const p = progress(total);
    const embed = embeds
      .info(`${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Level', value: String(p.level), inline: true },
        { name: 'Progress', value: `${p.into} / ${p.needed} XP`, inline: true },
        { name: 'Total XP', value: String(p.total), inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};

const leaderboard = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Top members by XP'),
  async execute(interaction) {
    const top = store.leaderboard(interaction.guild.id).slice(0, 10);
    if (!top.length) {
      return interaction.reply({ embeds: [embeds.info('Leaderboard', 'No XP yet — start chatting!')] });
    }
    const lines = top.map(
      (entry, index) => `**${index + 1}.** <@${entry.id}> — level ${levelFromXp(entry.xp)} (${entry.xp} XP)`,
    );
    await interaction.reply({ embeds: [embeds.info('🏆 Leaderboard', lines.join('\n'))] });
  },
};

module.exports = [rank, leaderboard];
