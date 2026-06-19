#!/bin/sh
# Install Nextcloud Office (richdocuments) for NC 31 on first-time setup.
set -e

APP_DIR=/var/www/html/custom_apps/richdocuments
VERSION=8.7.7
URL="https://github.com/nextcloud-releases/richdocuments/releases/download/v${VERSION}/richdocuments-v${VERSION}.tar.gz"

if [ -d "$APP_DIR" ]; then
    echo "[richdocuments] already present"
else
    echo "[richdocuments] downloading v${VERSION}"
    mkdir -p /var/www/html/custom_apps
    curl -fsSL -o /tmp/richdocuments.tar.gz "$URL"
    tar xzf /tmp/richdocuments.tar.gz -C /var/www/html/custom_apps
    rm /tmp/richdocuments.tar.gz
fi

_enable() {
  if command -v runuser >/dev/null 2>&1; then
    runuser -u www-data -- php /var/www/html/occ app:enable richdocuments
  else
    sudo -u www-data php /var/www/html/occ app:enable richdocuments
  fi
}

_enable
echo "[richdocuments] enabled"
