# Local-PG backup pipeline

Mirrors the Karsaaz Cloud Postgres database (running inside the `karsaaz-cloud-db-1` container) into a database called **`karsaaz_cloud_backup`** on the **native PG18** instance installed on this Windows host. Runs once daily via Windows Task Scheduler.

This sits alongside the file-based `backup.sh` in the parent folder — it is **additive**, not a replacement. Use the `.sql` dumps in `dumps/` for cold recovery; use the `karsaaz_cloud_backup` database for warm queries / reporting / forensics.

---

## Pieces

| File | Purpose |
|---|---|
| `Setup-Pgpass.ps1` | One-time helper: writes `%APPDATA%\postgresql\pgpass.conf` with the local PG18 superuser password (prompts via secure input — password never appears in the terminal or transcript). Run **once** before the first backup. |
| `backup-to-localpg.ps1` | The actual backup pipeline. Idempotent — safe to run any number of times. |
| `Register-ScheduledTask.ps1` | Registers (or refreshes) a Task Scheduler entry `KarsaazCloud-DailyLocalPgBackup` that runs the backup daily at 02:00. |
| `Unregister-ScheduledTask.ps1` | Removes the Task Scheduler entry. |
| `dumps/` | Generated `.sql` files, one per run, named `nextcloud-YYYY-MM-DD_HHMMSS.sql`. Pruned after 14 days. |
| `logs/` | One log file per run. Pruned after 14 days. |

---

## First-time setup

```powershell
cd "C:\Dev\Karsaaz Cloud\karsaaz-cloud-main\karsaaz-cloud-main\local-pg-backup"

# 1. Tell the scripts how to authenticate to local PG18.
#    You'll be prompted for the 'postgres' superuser password (hidden input).
.\Setup-Pgpass.ps1

# 2. Smoke-test the pipeline once before scheduling it.
.\backup-to-localpg.ps1

# 3. If step 2 succeeded, wire it into Task Scheduler.
.\Register-ScheduledTask.ps1
```

Verify the warm copy:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d karsaaz_cloud_backup `
  -c "SELECT count(*) AS users FROM oc_users; SELECT pg_size_pretty(pg_database_size('karsaaz_cloud_backup'));"
```

---

## What the pipeline does (one run)

1. Reads `POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD` from `..\.env`.
2. Confirms `karsaaz-cloud-db-1` is running.
3. `docker exec` runs `pg_dump --clean --if-exists --no-owner --no-privileges` **inside** the container, writing to `/tmp/karsaaz-backup-<timestamp>.sql` (UTF-8 clean).
4. `docker cp` pulls that file out to `dumps/nextcloud-<timestamp>.sql` and removes the in-container copy.
5. Connects to local PG18 as `postgres` (via pgpass), then:
   - `DROP DATABASE IF EXISTS karsaaz_cloud_backup`
   - `CREATE DATABASE karsaaz_cloud_backup`
6. Pipes the dump into `psql -d karsaaz_cloud_backup -v ON_ERROR_STOP=1 -f <dump>`.
7. Runs a verification query (counts `oc_users`, `oc_filecache`, prints DB size).
8. Prunes `dumps/*.sql` and `logs/*.log` older than `-KeepDays` (default 14).

The pipeline is **non-blocking** for the live server — `pg_dump` takes a consistent snapshot via MVCC; no maintenance-mode toggle is needed for this backup. (The file-based `backup.sh` in the parent dir still does toggle maintenance mode because it also tars the app-data volume; this script only touches the DB.)

---

## Operating notes

| Q | A |
|---|---|
| What if Docker isn't running when the task fires? | The script exits non-zero, Task Scheduler logs a failure; next day's run will succeed. No retry storm. |
| What if local PG18 is down? | Same — non-zero exit, dump file is still written to `dumps/` so the cold backup survives. |
| Can I run it ad hoc? | Yes: `Start-ScheduledTask -TaskName KarsaazCloud-DailyLocalPgBackup` or just `.\backup-to-localpg.ps1`. |
| Where do logs go? | `logs\YYYY-MM-DD_HHMMSS.log`, full transcript of every step. |
| How do I change retention? | Edit `Register-ScheduledTask.ps1` and re-run it, or pass `-KeepDays N` to `backup-to-localpg.ps1` directly. |
| How do I rotate the local PG password? | `ALTER USER postgres WITH PASSWORD '…'` in PG18, then re-run `.\Setup-Pgpass.ps1`. |
| What if the source DB credentials change? | The script reads them from `..\.env` on every run — just edit the .env, no script change needed. |
| Does this work if the Docker DB upgrades from PG16 to PG17/18? | Yes — `psql 18` can read `pg_dump 16/17` output. The opposite direction (newer dump → older restore) is **not** supported. |

---

## Restore from a dump file (recovery path)

If the live Docker DB is corrupted or lost:

```powershell
$latest = Get-ChildItem dumps\*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1
docker cp $latest.FullName karsaaz-cloud-db-1:/tmp/restore.sql
docker exec -e PGPASSWORD=nextcloud karsaaz-cloud-db-1 sh -c `
    "psql -U nextcloud -d nextcloud -f /tmp/restore.sql"
docker exec karsaaz-cloud-db-1 rm /tmp/restore.sql
```

(Substitute the actual DB password from `.env`. Stop the `app` container first if you want a clean state: `docker compose stop app`.)
