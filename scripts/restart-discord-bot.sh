#!/usr/bin/env bash
# Restart PortFuel Discord bot on the droplet (pull latest + rebuild).
# Usage (from repo root):  bash scripts/restart-discord-bot.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.discord-bot.yml)
if ! docker compose version &>/dev/null; then
  COMPOSE=(docker-compose -f docker-compose.discord-bot.yml)
fi

echo "[pf-bot] pulling latest from git..."
git pull --ff-only

echo "[pf-bot] rebuilding and starting..."
"${COMPOSE[@]}" up -d --build

echo "[pf-bot] status:"
"${COMPOSE[@]}" ps

echo ""
echo "Done. Tail logs with:"
echo "  ${COMPOSE[*]} logs -f --tail=50"
