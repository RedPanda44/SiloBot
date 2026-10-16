'use strict';

const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../lib/embeds');
const knowledge = require('../lib/knowledge');

/** Render a knowledge-base entry as an embed. */
function renderEntry(entry) {
  const embed = embeds.info(`🛠 ${entry.title}`);
  if (entry.intro) embed.setDescription(entry.intro);
  if (entry.steps?.length) {
    embed.addFields({
      name: 'Try this',
      value: entry.steps.map((step, i) => `**${i + 1}.** ${step}`).join('\n'),
    });
  }
  if (entry.note) embed.addFields({ name: 'Good to know', value: entry.note });
  if (entry.links?.length) {
    embed.addFields({ name: 'Links', value: entry.links.map((l) => `[${l.label}](${l.url})`).join('\n') });
  }
  if (entry.footer) embed.setFooter({ text: entry.footer });
  return embed;
}

/** One slash command per knowledge-base entry (e.g. `/itunes`, `/drivers`). */
function commandFor(entry) {
  return {
    data: new SlashCommandBuilder().setName(entry.command).setDescription(entry.summary.slice(0, 100)),
    async execute(interaction) {
      await interaction.reply({ embeds: [renderEntry(entry)] });
    },
  };
}

const support = {
  data: new SlashCommandBuilder().setName('support').setDescription('List every troubleshooting shortcut'),
  async execute(interaction) {
    const lines = knowledge.entries.map((e) => `**/${e.command}** — ${e.summary}`);
    await interaction.reply({ embeds: [embeds.info('Support shortcuts', lines.join('\n'))] });
  },
};

module.exports = [support, ...knowledge.entries.map(commandFor)];
