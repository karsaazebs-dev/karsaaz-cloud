#!/bin/sh
# Install Nextcloud Office (richdocuments) for NC 31 on first-time setup.
set -e

APP_DIR=/var/www/html/custom_apps/richdocuments
VERSION=8.7.7
URL="https://github.com/nextcloud-releases/richdocuments/releases/download/v${VERSION}/richdocuments-v${VERSION}.tar.gz"

_run_occ() {
    if [ "$(id -un)" = "www-data" ]; then
        php /var/www/html/occ "$@"
    elif command -v sudo >/dev/null 2>&1; then
        sudo -u www-data php /var/www/html/occ "$@"
    else
        php /var/www/html/occ "$@"
    fi
}

if [ ! -d "$APP_DIR" ]; then
    echo "[richdocuments] downloading v${VERSION}"
    mkdir -p /var/www/html/custom_apps
    curl -fsSL -o /tmp/richdocuments.tar.gz "$URL"
    tar xzf /tmp/richdocuments.tar.gz -C /var/www/html/custom_apps
    rm /tmp/richdocuments.tar.gz
fi

_run_occ app:enable richdocuments
echo "[richdocuments] enabled"
