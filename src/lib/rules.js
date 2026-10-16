'use strict';

const embeds = require('./embeds');
const { brand } = require('../config');

/** Server rules. Shown in #rules and by `/rules`. */
const RULES = [
  '**Be respectful.** No harassment, hate speech, discrimination, or personal attacks.',
  '**Stay on-topic.** Use the right channel — bugs and questions belong in a ticket or #support.',
  '**No NSFW or illegal content** anywhere in the server.',
  '**No piracy.** Do not share, request, or sell paid tweaks, cracked software, or cracked accounts.',
  '**No scams or shady links.** No URL shorteners, fake builds, or giveaways you did not start.',
  '**No advertising.** Do not post invites or promote other communities, including via DMs.',
  '**English only** in the main channels so everyone can follow along.',
  '**No leaking.** Private builds, test accounts, source code, and staff DMs are confidential.',
  '**Search first.** Read the pins and try `/support`, `/requirements`, `/build` and `/source` before asking.',
  '**Follow staff.** Moderators have the final say. Appeal any decision privately by opening a ticket.',
];

const STAFF_RANKS = [
  ['Owner', 'Runs the server and the Silo project.'],
  ['Head of Staff', 'Leads the team and handles escalations.'],
  ['Administrator', 'Manages the server, roles and configuration.'],
  ['Moderator', 'Enforces the rules, handles reports and timeouts.'],
  ['Junior Staff', 'Front-line moderation and member support.'],
  ['Trial Staff', 'Staff in training — help us out, still learning.'],
  ['Support', 'Answers tickets and common questions.'],
];

const DEPARTMENTS = [
  ['Support Lead', 'Runs the support team and ticket triage.'],
  ['Release Manager', 'Cuts and announces new Silo builds.'],
  ['Silo Developer', 'Builds and maintains Silo itself.'],
  ['Community Manager', 'Keeps the community healthy and engaged.'],
  ['Events Team', 'Runs giveaways, events and game nights.'],
  ['Content Creator', 'Guides, videos and other community content.'],
  ['Designer', 'Icons, banners and visual assets.'],
  ['Translator', 'Localises Silo and the docs.'],
  ['Tester', 'Hunts bugs in pre-release builds.'],
  ['Contributor', 'Community members who chipped in.'],
];

/** "Start here" embed shown above the rules. */
function welcomeEmbed(generalChannelId) {
  const general = generalChannelId ? `<#${generalChannelId}>` : '#general';
  return embeds
    .info(
      `👋 Welcome to ${brand.name}`,
      `**${brand.name}** is an all-in-one iOS toolkit — jailbreak, tweaks and utilities in one place.\n\nFollow the rules below, then say hi in ${general} and grab your pings in #roles.`,
    )
    .addFields(
      { name: '🚀 Get started', value: 'Read the rules · watch #announcements for new builds · pick pings in #roles' },
      { name: '🛠️ Before you install', value: '`/requirements` · `/build` · `/source` · `/itunes`' },
      { name: '🆘 Need help?', value: 'Open a ticket in #support or run `/support` for the usual fixes' },
      { name: '🧑‍💼 Who does what', value: STAFF_RANKS.map(([r, d]) => `**${r}** — ${d}`).join('\n') },
      { name: '🧩 Responsibility roles', value: DEPARTMENTS.map(([r, d]) => `**${r}** — ${d}`).join('\n') },
    );
}

/** The numbered rules embed. */
function rulesEmbed() {
  const description = RULES.map((rule, i) => `**${i + 1}.** ${rule}`).join('\n\n');
  return embeds.info('📜 Server Rules', description);
}

/** Full payload posted in #rules: welcome + rules. */
function rulesPayload(generalChannelId) {
  return { embeds: [welcomeEmbed(generalChannelId), rulesEmbed()] };
}

module.exports = { RULES, STAFF_RANKS, DEPARTMENTS, welcomeEmbed, rulesEmbed, rulesPayload };
