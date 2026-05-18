#!/bin/sh
# Re-sync airgap/branding overlay on EVERY container start.
# This makes edits to ./airgap.config.php take effect after a simple
# `docker compose restart app` — no manual cp needed.
set -e

SRC=/airgap.config.php
DST=/var/www/html/config/airgap.config.php

if [ -f "$SRC" ]; then
    cp "$SRC" "$DST"
    chown www-data:www-data "$DST"
    chmod 640 "$DST"
    echo "[airgap] synced $DST on startup"
fi
