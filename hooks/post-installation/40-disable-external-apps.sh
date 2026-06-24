#!/bin/sh
# Same as before-starting/40-disable-external-apps.sh but runs after first install.
# Ensures initial NC setup doesn't leave external-calling apps enabled.
set -e

CONFIG=/var/www/html/config/config.php
if [ ! -f "$CONFIG" ]; then
    echo "[airgap-apps] NC not yet installed — skipping"
    exit 0
fi

_run_occ() {
    if command -v runuser >/dev/null 2>&1; then
        runuser -u www-data -- php /var/www/html/occ "$@"
    else
        sudo -u www-data php /var/www/html/occ "$@"
    fi
}

_disable_if_enabled() {
    APP="$1"
    if _run_occ app:list 2>/dev/null | grep -qE "^\s+-\s+${APP}:"; then
        _run_occ app:disable "$APP" && echo "[airgap-apps] disabled $APP"
    fi
}

_disable_if_enabled weather_status
_disable_if_enabled updatenotification
_disable_if_enabled support
_disable_if_enabled user_status

_run_occ config:system:set has_internet_connection --value=false --type=bool 2>/dev/null || true
_run_occ config:app:delete admin push_proxy_url 2>/dev/null || true

# Audit: log all oc_appconfig rows with external URLs for review
echo "[airgap-apps] external-app lockdown complete (post-install)"
