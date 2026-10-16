'use strict';

const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const store = require('./storage');
const logger = require('./logger');

const GLOBAL_KEY = 'lastReleaseTag';
const DESCRIPTION_LIMIT = 3800; // Discord caps embed descriptions at 4096.

function truncate(text, limit = DESCRIPTION_LIMIT) {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

/** Fetch the newest non-draft, non-prerelease release for a repo. */
async function fetchLatestRelease(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=10`, {
    headers: {
      'user-agent': 'silo-community-bot',
      accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub responded ${res.status} ${res.statusText}`);
  const list = await res.json();
  const stable = list
    .filter((r) => !r.draft && !r.prerelease && r.published_at)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  return stable[0] || null;
}

function releaseEmbed(release) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setAuthor({ name: config.brand.name })
    .setTitle(`🚀 ${config.brand.name} ${release.tag_name} released`)
    .setURL(release.html_url)
    .setDescription(truncate(release.body) || 'A new version is available.')
    .setTimestamp(new Date(release.published_at))
    .setFooter({ text: `${config.brand.footer} · ${config.announce.repo}` });
  return embed;
}

async function announceToGuilds(client, release) {
  let posted = 0;
  for (const guild of client.guilds.cache.values()) {
    const channelId = store.getConfig(guild.id, 'announceChannel');
    if (!channelId) continue;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) continue;
    await channel
      .send({ embeds: [releaseEmbed(release)] })
      .then(() => { posted += 1; })
      .catch(() => {});
  }
  return posted;
}

/**
 * Check GitHub for a newer release and announce it. `baseline` records the
 * current tag without posting (used on first launch so an old release is not
 * blasted out to everyone).
 */
async function checkReleases(client, { baseline = false } = {}) {
  const { repo } = config.announce;
  if (!repo) return null;

  const release = await fetchLatestRelease(repo);
  if (!release) return null;

  const seen = store.getGlobal(GLOBAL_KEY);
  if (seen === release.tag_name) return null;

  if (!seen && baseline) {
    store.setGlobal(GLOBAL_KEY, release.tag_name);
    logger.info(`Baseline release recorded: ${release.tag_name}.`);
    return null;
  }

  const posted = await announceToGuilds(client, release);
  store.setGlobal(GLOBAL_KEY, release.tag_name);
  logger.info(`Announced release ${release.tag_name} to ${posted} channel(s).`);
  return release;
}

/** Poll GitHub on launch (baseline) and then on an interval. */
function startReleaseWatcher(client) {
  const minutes = Math.max(1, Number(config.announce.pollMinutes) || 15);
  checkReleases(client, { baseline: true }).catch((error) => logger.warn('Release check failed:', error.message));
  const timer = setInterval(
    () => checkReleases(client).catch((error) => logger.warn('Release check failed:', error.message)),
    minutes * 60_000,
  );
  if (typeof timer.unref === 'function') timer.unref();
  logger.info(`Release watcher polling ${config.announce.repo} every ${minutes} minute(s).`);
  return timer;
}

module.exports = { checkReleases, startReleaseWatcher, fetchLatestRelease, releaseEmbed };
