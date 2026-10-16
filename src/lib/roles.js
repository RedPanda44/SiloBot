'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const store = require('./storage');
const embeds = require('./embeds');
const logger = require('./logger');

const PREFIX = 'selfrole:';

/**
 * Opt-in ping roles. `label` is both the button text and the role name, so the
 * panel can fall back to a name lookup if the stored id is missing.
 */
const SELF_ROLES = [
  { key: 'releases', label: 'Releases', emoji: '🚀', description: 'Pinged when a new Silo build drops' },
  { key: 'announcements', label: 'Announcements', emoji: '📣', description: 'Important server news' },
  { key: 'events', label: 'Events', emoji: '🎉', description: 'Giveaways and community events' },
  { key: 'polls', label: 'Polls', emoji: '📊', description: 'Community polls' },
];

const configKey = (key) => `selfRole:${key}`;
const roleId = (guildId, key) => store.getConfig(guildId, configKey(key));

function resolveRole(guild, spec) {
  const id = roleId(guild.id, spec.key);
  return (id && guild.roles.cache.get(id)) || guild.roles.cache.find((r) => r.name === spec.label) || null;
}

/** The persistent self-assign roles panel. */
function panelPayload(guild) {
  const available = SELF_ROLES.filter((spec) => resolveRole(guild, spec));
  const lines = available.map((spec) => `${spec.emoji} **${spec.label}** — ${spec.description}`);

  const embed = embeds.info(
    '🎭 Roles',
    `Pick the pings you want. Click a button to add or remove it — you can change this any time.\n\n${lines.join('\n') || '_No roles configured yet._'}`,
  );

  const rows = [];
  let row = new ActionRowBuilder();
  for (const spec of available) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`${PREFIX}${spec.key}`).setLabel(spec.label).setEmoji(spec.emoji).setStyle(ButtonStyle.Secondary),
    );
    if (row.components.length === 5) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
  }
  if (row.components.length) rows.push(row);

  return rows.length ? { embeds: [embed], components: rows } : { embeds: [embed] };
}

async function toggle(interaction) {
  const key = interaction.customId.slice(PREFIX.length);
  const spec = SELF_ROLES.find((s) => s.key === key);
  if (!spec) return false;

  const role = resolveRole(interaction.guild, spec);
  if (!role) {
    await interaction.reply({ embeds: [embeds.error('Role missing', 'That role no longer exists on this server.')], ephemeral: true });
    return true;
  }

  const has = interaction.member.roles.cache.has(role.id);
  try {
    if (has) await interaction.member.roles.remove(role, 'Self-assigned role');
    else await interaction.member.roles.add(role, 'Self-assigned role');
  } catch (error) {
    logger.error('Self-role toggle failed:', error);
    await interaction.reply({
      embeds: [embeds.error('Could not update', 'I need **Manage Roles** and a role positioned above that one.')],
      ephemeral: true,
    });
    return true;
  }

  await interaction.reply({
    embeds: [embeds.success(has ? 'Role removed' : 'Role added', `${role}`)],
    ephemeral: true,
  });
  return true;
}

/** Route button interactions for self-assign roles. */
async function handleButton(interaction) {
  if (!interaction.customId.startsWith(PREFIX)) return false;
  return toggle(interaction);
}

module.exports = { SELF_ROLES, PREFIX, configKey, panelPayload, handleButton };
