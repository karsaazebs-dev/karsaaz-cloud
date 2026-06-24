#!/bin/sh
# Rocket.Chat first-boot bootstrap.
# Creates the admin user via RC REST API if it does not already exist.
# Called from docker-compose healthcheck or a one-shot init container.
# NOT run by Nextcloud entrypoint hooks — this script targets the RC container.
set -e

RC_URL="${RC_URL:-http://rocketchat:3000}"
RC_ADMIN_USER="${RC_ADMIN_USER:-karsaaz-admin}"
RC_ADMIN_PASS="${RC_ADMIN_PASS:-}"
RC_ADMIN_EMAIL="${RC_ADMIN_EMAIL:-admin@karsaaz.local}"

if [ -z "$RC_ADMIN_PASS" ]; then
    echo "[rc-init] RC_ADMIN_PASS not set — skipping bootstrap"
    exit 0
fi

# Wait for RC to be ready (max 60s)
i=0
until curl -sf "${RC_URL}/api/v1/info" >/dev/null 2>&1; do
    i=$((i+1))
    if [ $i -ge 30 ]; then
        echo "[rc-init] RC not ready after 60s — giving up"
        exit 1
    fi
    sleep 2
done

# Check if admin user already exists (idempotency)
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "{\"user\":\"${RC_ADMIN_USER}\",\"password\":\"${RC_ADMIN_PASS}\"}" \
    "${RC_URL}/api/v1/login" 2>/dev/null || echo "000")

if [ "$STATUS" = "200" ]; then
    echo "[rc-init] Admin user already exists — skipping creation"
    exit 0
fi

# Bootstrap admin user via setup-wizard endpoint (RC 6.x)
curl -sf -X POST "${RC_URL}/api/v1/users.register" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"${RC_ADMIN_USER}\",
        \"email\": \"${RC_ADMIN_EMAIL}\",
        \"pass\": \"${RC_ADMIN_PASS}\",
        \"name\": \"Karsaaz Admin\"
    }" >/dev/null 2>&1 || true

echo "[rc-init] Rocket.Chat bootstrap complete"
