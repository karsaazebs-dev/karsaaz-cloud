#!/bin/sh
# Install and enable Karsaaz Storage Allocation after first-time Nextcloud setup.
set -e

APP_DIR=/var/www/html/custom_apps/karsaaz_quota

if [ ! -d "$APP_DIR" ]; then
    echo "[karsaaz_quota] app directory not mounted — skipping"
    exit 0
fi

sudo -u www-data php /var/www/html/occ app:enable karsaaz_quota
echo "[karsaaz_quota] installed and enabled"
