#!/bin/sh
# Airgap configuration audit — run inside the Nextcloud app container.
# Usage: docker compose exec app sh /var/www/html/config/../../../scripts/airgap-audit.sh
# Or:    docker compose exec app sh -c "$(cat scripts/airgap-audit.sh)"
set -e

_run_occ() {
    if command -v runuser >/dev/null 2>&1; then
        runuser -u www-data -- php /var/www/html/occ "$@"
    else
        sudo -u www-data php /var/www/html/occ "$@"
    fi
}

echo "======================================================================"
echo " Karsaaz Cloud — Airgap Audit"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "======================================================================"

echo ""
echo "── 1. System config: external-connection flags ──────────────────────"
_run_occ config:system:get has_internet_connection 2>/dev/null \
    && echo "  has_internet_connection: $(_run_occ config:system:get has_internet_connection)"
_run_occ config:system:get updatechecker 2>/dev/null || true

echo ""
echo "── 2. Enabled apps (check for phone-home apps) ──────────────────────"
_run_occ app:list --enabled

echo ""
echo "── 3. oc_appconfig rows with external URLs ──────────────────────────"
# Runs via occ's built-in db access; requires psql available or occ db access
_run_occ db:query "SELECT appid, configkey, configvalue FROM oc_appconfig WHERE configvalue LIKE '%http%' OR configvalue LIKE '%smtp%' OR configvalue LIKE '%google%' OR configvalue LIKE '%amazonaws%' OR configvalue LIKE '%push.nextcloud%' OR configvalue LIKE '%telemetry%' OR configvalue LIKE '%analytics%'" 2>/dev/null || \
    echo "  (occ db:query not available — run manually: SELECT appid, configkey, configvalue FROM oc_appconfig WHERE configvalue LIKE '%http%')"

echo ""
echo "── 4. Mail config ────────────────────────────────────────────────────"
_run_occ config:system:get mail_smtphost 2>/dev/null && echo "  mail_smtphost: $(_run_occ config:system:get mail_smtphost)" || true
_run_occ config:system:get mail_smtpport 2>/dev/null && echo "  mail_smtpport: $(_run_occ config:system:get mail_smtpport)" || true
_run_occ config:system:get mail_smtpauth 2>/dev/null && echo "  mail_smtpauth: $(_run_occ config:system:get mail_smtpauth)" || true

echo ""
echo "── 5. Talk STUN/TURN servers ─────────────────────────────────────────"
_run_occ config:app:get spreed stun_servers 2>/dev/null && echo "  stun_servers: $(_run_occ config:app:get spreed stun_servers)" || echo "  stun_servers: (not set)"
_run_occ config:app:get spreed turn_servers 2>/dev/null && echo "  turn_servers: $(_run_occ config:app:get spreed turn_servers)" || echo "  turn_servers: (not set)"

echo ""
echo "── 6. Full system config (passwords redacted) ───────────────────────"
_run_occ config:list --private 2>/dev/null | \
    sed 's/\(password\|secret\|key\|pass\|token\|credential\)["\s]*:["\s]*"[^"]*"/\1: "***"/gi'

echo ""
echo "======================================================================"
echo " Audit complete. Review output above for any external references."
echo "======================================================================"
