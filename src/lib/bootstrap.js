'use strict';

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const store = require('./storage');
const logger = require('./logger');
const { toBold, toSmallCaps } = require('./fancy');
const { SELF_ROLES, configKey: selfRoleConfigKey, panelPayload } = require('./roles');
const { rulesPayload } = require('./rules');

/**
 * Roles created by `/setup server`, listed highest rank first. The bot's own
 * managed role always stays above everything in this list. `aliases` lets an
 * existing role be renamed to the canonical name instead of duplicated.
 *
 * `group` is only used to explain the server in the setup output.
 */
const ROLES = [
  // --- Leadership & staff ranks ---
  { key: 'owner', name: 'Owner', color: 0xffd700, hoist: true, group: 'rank', permissions: [PermissionFlagsBits.Administrator] },
  { key: 'head', name: 'Head of Staff', color: 0xe74c3c, hoist: true, group: 'rank', aliases: ['Head Moderator'], permissions: [PermissionFlagsBits.Administrator] },
  { key: 'admin', name: 'Administrator', color: 0xe67e22, hoist: true, group: 'rank', aliases: ['Admin'], permissions: [PermissionFlagsBits.Administrator] },
  {
    key: 'moderator',
    name: 'Moderator',
    color: 0xf1c40f,
    hoist: true,
    group: 'rank',
    permissions: [
      PermissionFlagsBits.ViewAuditLog,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ManageNicknames,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageThreads,
      PermissionFlagsBits.MentionEveryone,
    ],
  },
  {
    key: 'junior',
    name: 'Junior Staff',
    color: 0x1abc9c,
    hoist: true,
    group: 'rank',
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ManageNicknames,
    ],
  },
  { key: 'trial', name: 'Trial Staff', color: 0x95a5a6, hoist: true, group: 'rank', permissions: [PermissionFlagsBits.ManageMessages] },
  { key: 'support', name: 'Support', color: 0x3498db, hoist: true, group: 'rank', permissions: [] },

  // --- Department / responsibility leads ---
  { key: 'support_lead', name: 'Support Lead', color: 0x2980b9, hoist: true, group: 'department', permissions: [PermissionFlagsBits.ManageMessages] },
  { key: 'release_manager', name: 'Release Manager', color: 0x9b59b6, hoist: true, group: 'department', permissions: [PermissionFlagsBits.ManageMessages] },
  { key: 'developer', name: 'Silo Developer', color: 0x5865f2, hoist: true, group: 'department', permissions: [] },
  { key: 'community_manager', name: 'Community Manager', color: 0xe91e63, hoist: true, group: 'department', permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageNicknames] },
  { key: 'events_team', name: 'Events Team', color: 0xff9800, hoist: true, group: 'department', permissions: [] },
  { key: 'content_creator', name: 'Content Creator', color: 0xef5350, hoist: false, group: 'department', permissions: [] },
  { key: 'designer', name: 'Designer', color: 0x00bcd4, hoist: false, group: 'department', permissions: [] },
  { key: 'translator', name: 'Translator', color: 0x8bc34a, hoist: false, group: 'department', permissions: [] },
  { key: 'tester', name: 'Tester', color: 0x795548, hoist: false, group: 'department', permissions: [] },
  { key: 'contributor', name: 'Contributor', color: 0x607d8b, hoist: false, group: 'community', permissions: [] },

  // --- Default role for every member ---
  { key: 'member', name: 'Member', color: 0x2ecc71, hoist: false, group: 'default', permissions: [] },

  // --- Opt-in ping roles (mentionable, not hoisted) ---
  { key: 'ping_releases', name: 'Releases', color: 0x99aab5, hoist: false, mentionable: true, group: 'ping', permissions: [] },
  { key: 'ping_announcements', name: 'Announcements', color: 0x99aab5, hoist: false, mentionable: true, group: 'ping', permissions: [] },
  { key: 'ping_events', name: 'Events', color: 0x99aab5, hoist: false, mentionable: true, group: 'ping', permissions: [] },
  { key: 'ping_polls', name: 'Polls', color: 0x99aab5, hoist: false, mentionable: true, group: 'ping', permissions: [] },
];

/** Rank order, highest first. The bot's managed role sits above all of these. */
const HIERARCHY = ROLES.map((role) => role.key);

/**
 * Categories and their text channels. `name` is the plain name used in config;
 * the styled display name is derived with the fancy helpers below.
 */
const CATEGORIES = [
  {
    name: 'Information',
    children: [
      { name: 'announcements', staffSend: true },
      { name: 'rules', staffSend: true },
      { name: 'roles', staffSend: true },
    ],
  },
  { name: 'Community', children: [{ name: 'general' }, { name: 'off-topic' }] },
  {
    name: 'Support',
    children: [
      { name: 'support' },
      { name: 'tickets', staffOnly: true },
    ],
  },
  { name: 'Staff', children: [{ name: 'mod-logs', staffOnly: true }] },
];

async function ensureRole(guild, spec, results) {
  const names = [spec.name, ...(spec.aliases || [])].map((n) => n.toLowerCase());
  const existing = guild.roles.cache.find((r) => names.includes(r.name.toLowerCase()));
  if (existing) {
    if (existing.name !== spec.name) {
      await existing.setName(spec.name, 'Server setup');
      results.roles.push({ name: spec.name, status: 'renamed', group: spec.group, id: existing.id });
    } else {
      results.roles.push({ name: spec.name, status: 'exists', group: spec.group, id: existing.id });
    }
    return existing;
  }
  const role = await guild.roles.create({
    name: spec.name,
    color: spec.color,
    hoist: spec.hoist,
    mentionable: Boolean(spec.mentionable),
    permissions: spec.permissions,
    reason: 'Server setup',
  });
  results.roles.push({ name: spec.name, status: 'created', group: spec.group, id: role.id });
  return role;
}

/** Position the roles in `HIERARCHY`, directly under the bot's own role. */
async function applyHierarchy(guild, roles, results) {
  const ordered = HIERARCHY.filter((key) => roles[key]);
  let lastError;
  // Newly-created roles briefly report a stale bot position; retry with a fresh
  // fetch and recomputed positions until Discord settles.
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await guild.roles.fetch();
      const me = await guild.members.fetchMe(true);
      const positions = [];
      let position = me.roles.highest.position - 1;
      for (const key of ordered) {
        if (position >= 1) {
          positions.push({ role: roles[key], position });
          position -= 1;
        }
      }
      if (!positions.length) return;
      // Discord wants lower positions first.
      positions.sort((a, b) => a.position - b.position);
      await guild.roles.setPositions(positions, 'Server setup: rank roles');
      results.hierarchy = ordered.map((key) => roles[key].name);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

function staffOverwrites(guild, allowRoleIds, { readOnly = false, staffOnly = false } = {}) {
  const overwrites = [];
  const everyone = { id: guild.roles.everyone.id, allow: [], deny: [] };
  if (staffOnly) everyone.deny.push(PermissionFlagsBits.ViewChannel);
  if (readOnly) everyone.deny.push(PermissionFlagsBits.SendMessages);
  if (everyone.allow.length || everyone.deny.length) overwrites.push(everyone);

  for (const id of allowRoleIds) {
    const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory];
    if (!readOnly) allow.push(PermissionFlagsBits.SendMessages);
    overwrites.push({ id, allow });
  }
  return overwrites;
}

async function ensureCategory(guild, cat, results) {
  const styled = toBold(cat.name);
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && (c.name === styled || c.name.toLowerCase() === cat.name.toLowerCase()),
  );
  if (existing) {
    if (existing.name !== styled) {
      await existing.setName(styled, 'Server setup');
      results.channels.push({ name: styled, type: 'category', status: 'renamed' });
    } else {
      results.channels.push({ name: styled, type: 'category', status: 'exists' });
    }
    return existing;
  }
  const created = await guild.channels.create({ name: styled, type: ChannelType.GuildCategory, reason: 'Server setup' });
  results.channels.push({ name: styled, type: 'category', status: 'created' });
  return created;
}

async function ensureTextChannel(guild, parent, child, results, staffIds, modIds) {
  const styled = toSmallCaps(child.name);
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && (c.name === styled || c.name === child.name),
  );
  if (existing) {
    if (existing.name !== styled) {
      await existing.setName(styled, 'Server setup');
      results.channels.push({ name: styled, type: 'text', status: 'renamed' });
    } else {
      results.channels.push({ name: styled, type: 'text', status: 'exists' });
    }
    return existing;
  }
  const permissionOverwrites = child.staffOnly
    ? staffOverwrites(guild, child.name === 'tickets' ? staffIds : modIds, { staffOnly: true })
    : child.staffSend
      ? staffOverwrites(guild, staffIds, { readOnly: true })
      : [];
  const created = await guild.channels.create({
    name: styled,
    type: ChannelType.GuildText,
    parent: parent.id,
    permissionOverwrites,
    reason: 'Server setup',
  });
  results.channels.push({ name: styled, type: 'text', status: 'created' });
  return created;
}

/** Post a pinned panel once. Re-posts only if our message was deleted. */
async function ensurePinned(guild, channel, configKey, payload) {
  if (!channel) return 'missing';
  const existingId = store.getConfig(guild.id, configKey);
  if (existingId) {
    const existing = await channel.messages.fetch(existingId).catch(() => null);
    if (existing) return 'exists';
  }
  const message = await channel.send(payload).catch((error) => {
    logger.error(`Setup: failed to post ${configKey}:`, error);
    return null;
  });
  if (!message) return 'failed';
  await message.pin().catch(() => {});
  store.setConfig(guild.id, configKey, message.id);
  return 'created';
}

/**
 * Idempotently create the standard roles, categories and channels in a guild,
 * wire the bot's config to them, and post the rules + self-role panels. Existing
 * plain-named channels are renamed to the styled names instead of duplicated.
 * Safe to run repeatedly.
 */
async function provisionGuild(guild) {
  await guild.roles.fetch();
  await guild.channels.fetch();

  const results = { roles: [], channels: [], hierarchy: [], posted: [] };

  const roles = {};
  for (const spec of ROLES) {
    try {
      roles[spec.key] = await ensureRole(guild, spec, results);
    } catch (error) {
      logger.error(`Setup: failed to create role ${spec.name}:`, error);
    }
  }

  // Give the guild owner the Owner role, if we created/found one.
  if (roles.owner) {
    const owner = await guild.fetchOwner().catch(() => null);
    if (owner && !owner.roles.cache.has(roles.owner.id)) {
      await owner.roles.add(roles.owner, 'Server setup: owner').catch(() => {});
    }
  }

  // Remember which roles the self-role panel should hand out.
  for (const spec of SELF_ROLES) {
    const role = Object.values(roles).find((r) => r && r.name === spec.label);
    if (role) store.setConfig(guild.id, selfRoleConfigKey(spec.key), role.id);
  }

  try {
    await applyHierarchy(guild, roles, results);
  } catch (error) {
    logger.error('Setup: failed to rank roles:', error);
  }

  const staffIds = [roles.owner, roles.head, roles.admin, roles.moderator, roles.junior, roles.trial, roles.support, roles.support_lead]
    .filter(Boolean)
    .map((r) => r.id);
  const modIds = [roles.owner, roles.head, roles.admin, roles.moderator].filter(Boolean).map((r) => r.id);

  const channelIds = {};
  const categoryIds = {};
  for (const cat of CATEGORIES) {
    let category;
    try {
      category = await ensureCategory(guild, cat, results);
    } catch (error) {
      logger.error(`Setup: failed to create category ${cat.name}:`, error);
      continue;
    }
    categoryIds[cat.name] = category.id;

    for (const child of cat.children) {
      try {
        const channel = await ensureTextChannel(guild, category, child, results, staffIds, modIds);
        channelIds[child.name] = channel.id;
      } catch (error) {
        logger.error(`Setup: failed to create channel ${child.name}:`, error);
      }
    }
  }

  if (channelIds.announcements) store.setConfig(guild.id, 'announceChannel', channelIds.announcements);
  if (channelIds.general) store.setConfig(guild.id, 'welcomeChannel', channelIds.general);
  if (channelIds['mod-logs']) store.setConfig(guild.id, 'logChannel', channelIds['mod-logs']);
  if (categoryIds.Support) store.setConfig(guild.id, 'ticketCategory', categoryIds.Support);
  if (roles.support) store.setConfig(guild.id, 'supportRole', roles.support.id);
  if (roles.member) store.setConfig(guild.id, 'autorole', roles.member.id);

  // Post the persistent content.
  const rulesChannel = channelIds.rules ? await guild.channels.fetch(channelIds.rules).catch(() => null) : null;
  results.posted.push({ name: 'Rules (#rules)', status: await ensurePinned(guild, rulesChannel, 'rulesMessage', rulesPayload(channelIds.general)) });

  const rolesChannel = channelIds.roles ? await guild.channels.fetch(channelIds.roles).catch(() => null) : null;
  results.posted.push({ name: 'Role panel (#roles)', status: await ensurePinned(guild, rolesChannel, 'rolesMessage', panelPayload(guild)) });

  return results;
}

module.exports = { provisionGuild, ROLES, CATEGORIES, HIERARCHY };
