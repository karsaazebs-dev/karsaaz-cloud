#!/bin/sh
# Copy the airgap overlay into Karsaaz Cloud's config dir AFTER first-run install.
# The server auto-merges any *.config.php in /var/www/html/config/.
set -e

SRC=/airgap.config.php
DST=/var/www/html/config/airgap.config.php

if [ -f "$SRC" ]; then
    cp "$SRC" "$DST"
    chown www-data:www-data "$DST"
    chmod 640 "$DST"
    echo "[airgap] installed $DST"
fi
