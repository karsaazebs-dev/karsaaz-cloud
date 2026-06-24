#!/bin/sh
# Disable NC apps that make outbound calls to external services.
# Runs on EVERY container start so re-installs (app:install) don't re-enable them.
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

# weather_status calls api.met.no + Nominatim (OpenStreetMap geocoder)
_disable_if_enabled weather_status

# updatenotification polls https://updates.nextcloud.com
_disable_if_enabled updatenotification

# support sends telemetry to Nextcloud GmbH servers
_disable_if_enabled support

# user_status may ping external presence services depending on NC version
_disable_if_enabled user_status

# Ensure has_internet_connection remains false so NC skips all connectivity probes
_run_occ config:system:set has_internet_connection --value=false --type=bool 2>/dev/null || true

# Remove push notification proxy URL if it was ever set
_run_occ config:app:delete admin push_proxy_url 2>/dev/null || true

echo "[airgap-apps] external-app lockdown complete"
