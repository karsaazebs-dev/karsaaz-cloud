#!/bin/sh
# Enable Karsaaz Storage Allocation app on every container start (idempotent).
set -e

APP_DIR=/var/www/html/custom_apps/karsaaz_quota
CONFIG=/var/www/html/config/config.php

if [ ! -f "$CONFIG" ] || [ ! -d "$APP_DIR" ]; then
    exit 0
fi

if ! sudo -u www-data php /var/www/html/occ app:list 2>/dev/null | grep -q 'karsaaz_quota.*enabled'; then
    sudo -u www-data php /var/www/html/occ app:enable karsaaz_quota
    echo "[karsaaz_quota] app enabled"
fi
