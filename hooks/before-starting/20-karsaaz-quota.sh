#!/bin/sh
# Enable Karsaaz Storage Allocation app on every container start (idempotent).

APP_DIR=/var/www/html/custom_apps/karsaaz_quota
CONFIG=/var/www/html/config/config.php

if [ ! -f "$CONFIG" ] || [ ! -d "$APP_DIR" ]; then
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

if ! _run_occ app:list 2>/dev/null | grep -q 'karsaaz_quota.*enabled'; then
    _run_occ app:enable karsaaz_quota
    echo "[karsaaz_quota] app enabled"
fi

exit 0
