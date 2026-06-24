#!/bin/sh
# Ensure Nextcloud Office (richdocuments) points at the Collabora container.
# Must not fail container start — before-starting hooks run as www-data.

if [ ! -d /var/www/html/custom_apps/richdocuments ]; then
    echo "[richdocuments] app not installed — skipping"
    exit 0
fi

_run_occ() {
    if [ "$(id -un)" = "www-data" ]; then
        php /var/www/html/occ "$@"
    elif command -v sudo >/dev/null 2>&1; then
        sudo -u www-data php /var/www/html/occ "$@"
    else
        php /var/www/html/occ "$@"
    fi
}

WOPI_INTERNAL="${COLLABORA_INTERNAL_URL:-http://collabora:9980}"
WOPI_PUBLIC="${COLLABORA_PUBLIC_URL:-http://localhost:9980}"

_run_occ app:enable richdocuments 2>/dev/null || true
_run_occ config:app:set richdocuments wopi_url --value "$WOPI_INTERNAL" 2>/dev/null || true
_run_occ config:app:set richdocuments public_wopi_url --value "$WOPI_PUBLIC" 2>/dev/null || true
_run_occ config:system:set allow_local_remote_servers --value=true --type=bool 2>/dev/null || true

echo "[richdocuments] WOPI internal=$WOPI_INTERNAL public=$WOPI_PUBLIC"
exit 0
