#!/data/data/com.termux/files/usr/bin/sh
# Run the Silo bot 24/7 on Android via Termux.
#
#   sh scripts/termux-start.sh
#
# Keeps a wake lock (so Android doesn't freeze the process) and auto-restarts
# the bot if it ever crashes. Logs are written to bot.log.

set -eu

cd "$(dirname "$0")/.."

# Keep the CPU awake while this script runs.
termux-wake-lock 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it first:  pkg install nodejs-lts git" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "No .env found. Create it first:  cp .env.example .env && nano .env" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Silo (logs -> bot.log). Press Ctrl+C to stop."
while true; do
  node src/index.js >>bot.log 2>&1 || true
  echo "[$(date)] bot exited, restarting in 5s..." >>bot.log
  sleep 5
done
