#!/usr/bin/env bash
# Karsaaz Cloud — daily backup script
# Backs up: PostgreSQL database + Karsaaz Cloud app data (files, config, apps)
# Keeps the last 14 daily backups; older ones are pruned.

set -euo pipefail
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

STACK_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${STACK_DIR}/backups"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
TARGET="${BACKUP_DIR}/${STAMP}"
LOG="${BACKUP_DIR}/backup.log"
KEEP_DAYS=14

DB_CONTAINER="karsaaz-cloud-db-1"
APP_CONTAINER="karsaaz-cloud-app-1"
DB_NAME="karsaazcloud"
DB_USER="karsaazcloud"

mkdir -p "${TARGET}"

log() { echo "[$(date '+%F %T')] $*" | tee -a "${LOG}"; }

trap 'log "FAILED at line $LINENO"; docker exec -u www-data "${APP_CONTAINER}" php occ maintenance:mode --off 2>/dev/null || true; exit 1' ERR

log "===== backup start: ${STAMP} ====="

if ! docker ps --format '{{.Names}}' | grep -q "^${APP_CONTAINER}$"; then
    log "ERROR: ${APP_CONTAINER} not running. Start the stack first."
    exit 1
fi

log "enabling maintenance mode (read-only during backup)"
docker exec -u www-data "${APP_CONTAINER}" php occ maintenance:mode --on >/dev/null

log "dumping PostgreSQL database"
docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists \
    > "${TARGET}/database.sql"

log "archiving Karsaaz Cloud app data (files, config, apps)"
TMP_CONTAINER="nc-backup-tmp-$$"
docker run -d --name "${TMP_CONTAINER}" \
    -v karsaaz-cloud_app_data:/source:ro \
    alpine:3.19 sleep 300 >/dev/null
docker exec "${TMP_CONTAINER}" tar czf /tmp/app_data.tar.gz -C /source .
TARGET_WIN="$(cygpath -w "${TARGET}" 2>/dev/null || echo "${TARGET}")"
docker cp "${TMP_CONTAINER}:/tmp/app_data.tar.gz" "${TARGET_WIN}\\app_data.tar.gz"
docker rm -f "${TMP_CONTAINER}" >/dev/null

log "copying stack config (compose file, .env, airgap.config.php)"
cp "${STACK_DIR}/docker-compose.yml" "${TARGET}/"
cp "${STACK_DIR}/.env" "${TARGET}/"
cp "${STACK_DIR}/airgap.config.php" "${TARGET}/"

log "disabling maintenance mode"
docker exec -u www-data "${APP_CONTAINER}" php occ maintenance:mode --off >/dev/null

DB_SIZE=$(du -h "${TARGET}/database.sql" | cut -f1)
APP_SIZE=$(du -h "${TARGET}/app_data.tar.gz" | cut -f1)
log "backup complete: db=${DB_SIZE} app=${APP_SIZE} location=${TARGET}"

log "pruning backups older than ${KEEP_DAYS} days"
find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime "+${KEEP_DAYS}" -print -exec rm -rf {} +

log "===== backup done ====="
