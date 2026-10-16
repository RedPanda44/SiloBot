# Silo Community Bot

An all-in-one Discord bot for running a community server: **moderation, welcome
messages, autoroles, leveling, mod-logs and utility commands**. Written in
JavaScript with [discord.js v14](https://discord.js.org/).

> Everything is data-driven from a single JSON store, so there is no database to
> set up. Swap in SQLite/Postgres later if you outgrow it.

---

## Features

| Area | Commands / behaviour |
| --- | --- |
| Utility | `/ping` `/help` `/serverinfo` `/userinfo` `/avatar` `/poll` `/8ball` |
| Moderation | `/kick` `/ban` `/timeout` `/purge` `/warn` `/warnings` `/clearwarnings` |
| Leveling | XP per message with cooldown, level-up announcements, `/rank` `/leaderboard` |
| Community | Welcome messages on join, autorole, leave logs |
| Support | `/support` plus a shortcut per topic — `/itunes` `/drivers` `/not-detected` `/wifi` `/boldtext` `/walletskin` `/passcode` `/requirements` `/build` `/source` |
| Tickets | `/ticket open|close|panel|setup` — private channel with a Close button |
| Announcements | Auto-announces new GitHub releases + `/announce release|message` |
| Automod | Deletes Discord invite links (and optionally all links) from non-mods |
| Config | `/config welcome|autorole|logs|announce|show` |
| Rules | `/rules show|post` — welcome + rules panel, plus the pinned copy in #rules |
| Self roles | `/roles panel|list` — opt-in ping roles (Releases, Announcements, Events, Polls) |
| Setup | `/setup server` — creates the roles, categories, channels, rules and role panel |

---

## 1. Prerequisites

- **Node.js 18.17 or newer** — check with `node -v`.
- A Discord account with permission to add a bot to your server
  (Manage Server permission, or be the owner).

---

## 2. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   and click **New Application**. Give it a name (e.g. *Silo Bot*).
2. Open the **Bot** tab and click **Add Bot** / **Reset Token**.
3. Click **Reset Token**, then **Copy** it. This is your `DISCORD_TOKEN`.
   **Never share or commit it** — anyone with it controls your bot.
4. On the **General Information** tab, copy the **Application ID**. This is your
   `CLIENT_ID`.

### Enable the required intents

Still on the **Bot** tab, under **Privileged Gateway Intents**, enable:

- **Server Members Intent** (welcome / autorole / leave logs)
- **Message Content Intent** (leveling + automod)

Leave *Presence Intent* off unless you extend the bot to use it.

---

## 3. Invite the bot to your server

1. Open the **OAuth2 → URL Generator** tab.
2. Scopes: check **`bot`** and **`applications.commands`**.
3. Bot Permissions — check at least:
   `Manage Roles`, `Manage Channels`, `Kick Members`, `Ban Members`,
   `Moderate Members`, `Manage Messages`, `Send Messages`, `Embed Links`,
   `Attach Files`, `Read Message History`, `View Channels`.
4. Copy the generated URL, open it in your browser, pick your server and
   **Authorize**.

> The bot's highest role must sit **above** any role it manages (autorole, kick,
> ban, timeout). Drag it up in **Server Settings → Roles** if needed.

---

## 4. Configure and run

```bash
# 1. Install dependencies
npm install

# 2. Create your .env from the template and fill it in
cp .env.example .env      # Windows: copy .env.example .env

# 3. Register the slash commands
npm run deploy

# 4. Start the bot
npm start
```

Your `.env` should look like:

```env
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-test-server-id
```

- Set `GUILD_ID` while testing — commands appear **instantly** in that one server.
- Leave `GUILD_ID` empty for a production bot; global commands can take up to an
  hour to propagate.

---

## 5. First-time server setup

Run these in your server (as an admin):

```
/config welcome set channel:#welcome
/config autorole role:@Members
/config logs channel:#mod-logs
/config show
```

Then try `/help` to see everything.

### Quick start with `/setup`

Instead of configuring everything by hand, run **`/setup server`**. It creates the
roles and ranks them (highest first):

| Rank | Role | Purpose |
| --- | --- | --- |
| — | `Silo` | the bot's own managed role; always kept on top |
| 1 | `Owner` | granted to the server owner |
| 2 | `Head of Staff` | leads the team, handles escalations (admin) |
| 3 | `Administrator` | manages the server and config (admin) |
| 4 | `Moderator` | kick/ban/timeout, manage messages & channels |
| 5 | `Junior Staff` | kick/timeout, manage messages |
| 6 | `Trial Staff` | manage messages (staff in training) |
| 7 | `Support` | sees and answers tickets |
| 8 | `Support Lead` | runs the support team and ticket triage |
| 9 | `Release Manager` | cuts and announces new Silo builds |
| 10 | `Silo Developer` | builds and maintains Silo |
| 11 | `Community Manager` | keeps the community healthy |
| 12 | `Events Team` | runs giveaways, events and game nights |
| 13 | `Content Creator` | guides, videos and community content |
| 14 | `Designer` | icons, banners and visual assets |
| 15 | `Translator` | localises Silo and the docs |
| 16 | `Tester` | hunts bugs in pre-release builds |
| 17 | `Contributor` | community members who chipped in |
| 18 | `Member` | auto-granted to new members |
| — | `Releases` `Announcements` `Events` `Polls` | opt-in ping roles (self-assigned in #roles) |

It also creates the categories (Information, Community, Support, Staff) with
sensible permissions, wires the bot's config (welcome, logs, announcements,
tickets, autorole) to them, posts the **welcome + rules** in #rules and the
**role picker** in #roles. It is idempotent — existing roles/channels are reused
and renamed, ranks are re-applied, and panels are only re-posted if deleted.

### Rules & self-assign roles

- **#rules** holds the pinned welcome + numbered rules (`/rules show` to read them
  anywhere, `/rules post` to re-post as staff).
- **#roles** holds a button panel. Members click to toggle the opt-in ping roles
  (`Releases`, `Announcements`, `Events`, `Polls`). `/roles list` lists them and
  `/roles panel` re-posts the panel (staff).

### Support shortcuts

Every topic in `src/lib/knowledge.js` becomes its own command. Admins answer the
usual questions with a single word: `/itunes`, `/drivers`, `/not-detected`,
`/wifi`, `/boldtext`. `/support` lists them all. Add a new topic by appending an
entry to the array there.

### Tickets

- `/ticket setup category:<category> support_role:@Support` — configure once (or
  let `/setup server` do it).
- `/ticket panel` — posts the 🎫 **Open a ticket** panel in the current channel.
- Clicking the button (or `/ticket open`) creates a private channel visible only to
  the user and the support role, with a **Close** button.

### Release announcements

New GitHub releases are announced automatically to the channel set with
`/config announce channel:#announcements`. Configure the source repo with the
`ANNOUNCE_REPO` env var (default `RedPanda44/Silo`) and the poll interval with
`ANNOUNCE_POLL_MINUTES` (default `15`). You can also post by hand with
`/announce release version:1.5.4 notes:"..."` or `/announce message text:"..."`.

---

## 6. Hosting the bot 24/7

The bot must keep running to stay online. Options, easiest first:

### PM2 (any VPS or your own PC)

```bash
npm install -g pm2
pm2 start src/index.js --name silo-bot
pm2 save
pm2 startup        # follow the printed command to auto-start on boot
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/index.js"]
```

```bash
docker build -t silo-bot .
docker run -d --name silo-bot --env-file .env -v "$PWD/data:/app/data" silo-bot
```

> Mount `data/` as a volume so leveling/warnings survive container rebuilds.

### Free / cheap hosts

Railway, Render, Fly.io and similar all run a Node process fine. Remember to set
the environment variables (`DISCORD_TOKEN`, `CLIENT_ID`) in the host dashboard
instead of uploading `.env`.

---

## 7. Project structure

```
discord-bot/
├─ package.json
├─ .env.example          # copy to .env
├─ src/
│  ├─ index.js           # entry point: loads commands + events, logs in
│  ├─ config.js          # env + tunables (colors, xp, automod)
│  ├─ deploy-commands.js # registers slash commands with Discord
│  ├─ commands/          # each file exports a command or an array of commands
│  │  ├─ utility.js
│  │  ├─ moderation.js
│  │  ├─ config.js
│  │  ├─ levels.js
│  │  ├─ support.js      # generates one command per knowledge-base topic
│  │  ├─ tickets.js
│  │  ├─ announce.js
│  │  └─ setup.js
│  ├─ events/
│  │  └─ index.js        # ready, interactions (commands + buttons), member add/remove, messages
│  └─ lib/
│     ├─ embeds.js       # branded embed helpers
│     ├─ leveling.js     # XP curve
│     ├─ knowledge.js    # support troubleshooting knowledge base
│     ├─ tickets.js      # ticket channel create/close + button routing
│     ├─ releases.js     # GitHub release watcher + announcement embeds
│     ├─ storage.js      # JSON persistence
│     ├─ permissions.js  # permission guards
│     └─ logger.js
└─ data/                 # created at runtime (store.json) — gitignored
```

---

## 8. Adding your own command

Create `src/commands/myfeature.js`:

```js
const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../lib/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Say hi'),
  async execute(interaction) {
    await interaction.reply({ embeds: [embeds.success('Hi!', `Hello ${interaction.user}!`)] });
  },
};
```

Run `npm run deploy` again, restart the bot, and `/hello` is live. To ship
several at once, export an **array** of command objects instead.

---

## 9. Tuning behaviour

Edit `src/config.js`:

- `colors` — embed colours.
- `xp` — XP per message range and the per-user cooldown.
- `automod` — toggle invite/link blocking, add exempt role IDs.

---

## 10. Security notes

- Keep `.env` private; it is already gitignored.
- Never paste your token into chat, screenshots, or issues. If it leaks, hit
  **Reset Token** immediately.
- Give the bot only the permissions it needs.
- Back up `data/store.json` occasionally if you care about levels/warnings.

---

## 11. Run 24/7 on Koyeb (free)

A Discord bot is a long-running **worker** (it never listens on a port), which is
exactly what Koyeb's free tier runs. The included `Dockerfile` is all Koyeb needs.
Set the bot's environment variables (see `.env.example`):

| Variable | Value |
| --- | --- |
| `DISCORD_TOKEN` | your bot token (add as a **secret**) |
| `CLIENT_ID` | your application id |
| `GUILD_ID` | your test server id |
| `ANNOUNCE_REPO` | `RedPanda44/Silo` (optional) |
| `ANNOUNCE_POLL_MINUTES` | `15` (optional) |

1. **Push the code to GitHub** (from this folder):

   ```powershell
   git init
   git add .
   git commit -m "Silo community bot"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

   `.env` is gitignored, so your token is never pushed.

2. **Create the service on Koyeb**: [app.koyeb.com](https://app.koyeb.com) →
   **Create Service** → **GitHub** → pick the repo.
3. **Builder**: Dockerfile (auto-detected). **Service type**: **Worker**.
   **Instance**: the free **Nano**.
4. **Environment variables**: add the table above (`DISCORD_TOKEN` flagged as a
   secret). Deploy.
5. Once it's running, run **`/setup server`** in Discord to create the roles,
   channels, rules and panels.

> Koyeb's filesystem is **ephemeral**: `data/store.json` (levels, warnings, ticket
> mappings) resets on every redeploy. The server structure and config survive —
> just run `/setup server` again. For durable data, attach a Koyeb volume mounted
> at `/app/data` (paid) or move `src/lib/storage.js` to SQLite/a hosted DB later.

To update the bot, just push to GitHub — Koyeb redeploys automatically.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `DISCORD_TOKEN is missing` | You forgot to create `.env` (copy the template). |
| Slash commands don't show | Run `npm run deploy`; set `GUILD_ID` for instant testing. |
| Bot is offline | The process stopped — run it under PM2/Docker, or deploy to Koyeb (see section 11). |
| Welcome/autorole not firing | Enable the **Server Members Intent** in the portal. |
| Leveling not working | Enable the **Message Content Intent** in the portal. |
| "I am missing permissions" | Move the bot's role higher, or grant the listed permission. |
