'use strict';

/**
 * Support knowledge base. Every entry becomes its own slash command — the entry
 * with `command: 'itunes'` is exposed as `/itunes` — so adding a new
 * troubleshooting shortcut is a one-line change here. Entries are kept short and
 * actionable: a title, optional intro, numbered steps, an optional note/footer
 * and optional links.
 */
const entries = [
  {
    command: 'itunes',
    summary: "PC doesn't see your iPhone — install Apple Mobile Device Support",
    title: 'PC does not recognise your iPhone',
    intro: 'Windows needs Apple Mobile Device Support to talk to an iPhone. Without it, Silo cannot see the device at all.',
    steps: [
      'Install **Apple Mobile Device Support** — the easy way is the **Apple Devices** app (Microsoft Store) or 64-bit **iTunes**.',
      'Reconnect the iPhone, unlock it and tap **Trust this Computer**.',
      'If it still shows nothing, use `/not-detected` for the deeper checklist.',
    ],
    footer: 'Still failing? Run /drivers to repair the Apple USB drivers.',
  },
  {
    command: 'drivers',
    summary: 'Repair corrupted Apple USB drivers with 3uTools',
    title: 'Repair the Apple USB drivers',
    intro: 'Corrupted or conflicting Apple USB drivers on Windows are the number-one cause of "device not found".',
    steps: [
      'Download and install **3uTools**.',
      'Disconnect your iPhone from the PC.',
      'In 3uTools open **Toolbox → Repair Driver** and click **Repair Now**.',
      'Wait for the reinstall to finish, reconnect the unlocked iPhone, tap **Trust**, then relaunch Silo.',
    ],
    links: [{ label: '3uTools', url: 'https://www.3u.com/' }],
  },
  {
    command: 'not-detected',
    summary: 'iPhone not detected: cable, port and service checks',
    title: 'iPhone not detected',
    intro: 'Work through these in order — the first two fix most cases.',
    steps: [
      'Try a **different cable** and a **different USB port** (avoid unpowered hubs).',
      'Close **iTunes / Apple Devices / iMazing** so nothing else is holding the device.',
      'Restart the **Apple Mobile Device Service** (services.msc → right-click → Restart).',
      'If it persists, install Apple Mobile Device Support (`/itunes`) and repair the drivers (`/drivers`).',
    ],
  },
  {
    command: 'wifi',
    summary: 'Connect over Wi-Fi (no cable) after one USB pairing',
    title: 'Wi-Fi connection setup',
    intro: 'You must pair once over USB before Wi-Fi will work.',
    steps: [
      'Connect the iPhone by USB for the initial pairing.',
      'In **Apple Devices** or iTunes enable *Show this iPhone when on Wi-Fi* / *Sync with this iPhone over Wi-Fi*.',
      'Apply, then keep the PC and iPhone on the same local network.',
      'In Silo click **Refresh** and confirm the device shows a **WiFi** transport.',
      'Disconnect the cable, click **Refresh** again, then choose **WiFi only**.',
    ],
    note: 'Apple\'s AirTraffic API selects its route by UDID instead of accepting a transport parameter, so a guaranteed Wi-Fi route needs the cable unplugged.',
  },
  {
    command: 'boldtext',
    summary: 'Passcode theme not showing — turn off Bold Text',
    title: 'My passcode theme does not show up',
    intro: 'This is almost always **Bold Text** being enabled on the iPhone.',
    steps: [
      'On the iPhone open **Settings → Display & Brightness**.',
      'Turn **Bold Text OFF**.',
      'Lock the screen (or open the Phone dialer) — the themed keypad will now render.',
    ],
    note: 'With Bold Text on, iOS ignores cached dialer button graphics and draws its own vector font instead.',
  },
  {
    command: 'walletskin',
    summary: 'How to apply a custom Apple Wallet card skin',
    title: 'Customise an Apple Wallet card',
    steps: [
      'Connect the iPhone (USB or paired Wi-Fi) and unlock it.',
      'In Silo stay on the **Wallet** tab and click **Scan**.',
      'On the iPhone open **Wallet** and tap the card you want — Silo captures its hash. Click **Stop**.',
      'Click **Choose Image…**, pick PNG/JPG/WebP, drag to position the crop (it scales to `1536 × 969`).',
      'Click **Apply Card Skin**, then force-close and reopen Wallet on the iPhone.',
    ],
    note: 'The first apply stores a local backup; **Restore Original** writes it back any time.',
  },
  {
    command: 'passcode',
    summary: 'How to apply a .passthm lock-screen passcode theme',
    title: 'Apply a lock-screen passcode theme (.passthm)',
    steps: [
      'Switch to the **Passcode** tab in Silo.',
      'Click **Choose .passthm…** and pick a Cowabunga or Nugget package.',
      'Choose your target: **Auto (TelephonyUI-10)** for iOS 18+, **TelephonyUI-9** for iOS 16–17, **TelephonyUI-8** for legacy.',
      'Click **Apply Passcode Theme**, then lock the screen to see it.',
    ],
    footer: 'Remember to turn Bold Text off — see /boldtext.',
  },
  {
    command: 'requirements',
    summary: 'Windows & iPhone requirements for Silo',
    title: 'System requirements',
    steps: [
      '**PC:** Windows 10 / 11, 64-bit, ~10 MB free disk. No .NET, Python or WebView runtimes.',
      '**iPhone:** iOS 18 or newer (16–17 via the legacy cache), unlocked during every session.',
      '**Software:** Apple Mobile Device Support (64-bit iTunes); optional 3uTools for driver repair.',
      'A Lightning or USB-C cable for the first pairing.',
    ],
  },
  {
    command: 'build',
    summary: 'Build Silo from source (Rust)',
    title: 'Build from source',
    steps: [
      'Install the **Rust toolchain** (`stable-x86_64-pc-windows-msvc`).',
      'Clone the repository: `git clone https://github.com/Lumid-Off/AirCard-Windows`',
      'Run `cargo test` then `cargo build --release`.',
      'The binary lands in `target\\release`.',
    ],
    links: [{ label: 'Source repository', url: 'https://github.com/Lumid-Off/AirCard-Windows' }],
  },
  {
    command: 'source',
    summary: 'Where to find the source code and releases',
    title: 'Source code & releases',
    intro: 'Silo is open source under the MIT license.',
    steps: [
      'Application source: the **AirCard** repository.',
      'Downloads and release notes: the project website / GitHub releases.',
    ],
    links: [
      { label: 'App source (AirCard)', url: 'https://github.com/Lumid-Off/AirCard-Windows' },
      { label: 'Project repository', url: 'https://github.com/RedPanda44/Silo' },
    ],
  },
];

/** Look up an entry by its command name (or any alias). */
function get(name) {
  const key = String(name || '').toLowerCase();
  return entries.find((e) => e.command === key || (e.aliases || []).includes(key)) || null;
}

module.exports = { entries, get };
