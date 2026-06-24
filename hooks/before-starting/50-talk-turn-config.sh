#!/bin/sh
# Wire Nextcloud Talk (spreed) to use the internal Coturn STUN/TURN server.
# Runs on every container start — idempotent (occ config:app:set overwrites).
set -e

CONFIG=/var/www/html/config/config.php
if [ ! -f "$CONFIG" ]; then
    echo "[talk-turn] NC not yet installed — skipping"
    exit 0
fi

# Skip if spreed (Talk) app is not enabled
if ! php /var/www/html/occ app:list 2>/dev/null | grep -q 'spreed'; then
    echo "[talk-turn] spreed not enabled — skipping STUN/TURN config"
    exit 0
fi

_run_occ() {
    if command -v runuser >/dev/null 2>&1; then
        runuser -u www-data -- php /var/www/html/occ "$@"
    else
        sudo -u www-data php /var/www/html/occ "$@"
    fi
}

COTURN_HOST="${COTURN_HOST:-coturn}"
COTURN_PORT="${COTURN_PORT:-3478}"
COTURN_SECRET="${COTURN_SECRET:-}"

# STUN — only used for ICE candidate discovery, no auth needed
_run_occ config:app:set spreed stun_servers \
    --value="[\"${COTURN_HOST}:${COTURN_PORT}\"]" --type=json

# TURN — relays media; requires the shared secret from Coturn
if [ -n "$COTURN_SECRET" ]; then
    _run_occ config:app:set spreed turn_servers \
        --value="[{\"server\":\"turn:${COTURN_HOST}:${COTURN_PORT}\",\"secret\":\"${COTURN_SECRET}\",\"protocols\":\"udp,tcp\"}]" \
        --type=json
    echo "[talk-turn] STUN=${COTURN_HOST}:${COTURN_PORT} TURN configured"
else
    echo "[talk-turn] COTURN_SECRET not set — TURN skipped (STUN only)"
fi
