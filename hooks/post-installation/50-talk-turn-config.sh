#!/bin/sh
# Wire Nextcloud Talk STUN/TURN after first install. Same logic as before-starting/50.
set -e

CONFIG=/var/www/html/config/config.php
if [ ! -f "$CONFIG" ]; then
    exit 0
fi

if ! php /var/www/html/occ app:list 2>/dev/null | grep -q 'spreed'; then
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

_run_occ config:app:set spreed stun_servers \
    --value="[\"${COTURN_HOST}:${COTURN_PORT}\"]" --type=json

if [ -n "$COTURN_SECRET" ]; then
    _run_occ config:app:set spreed turn_servers \
        --value="[{\"server\":\"turn:${COTURN_HOST}:${COTURN_PORT}\",\"secret\":\"${COTURN_SECRET}\",\"protocols\":\"udp,tcp\"}]" \
        --type=json
    echo "[talk-turn] STUN/TURN configured (post-install)"
fi
