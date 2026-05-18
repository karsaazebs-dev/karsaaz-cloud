# backup-to-localpg.ps1 — daily backup pipeline
#
# Flow:
#   1. pg_dump the Karsaaz Cloud database inside the karsaaz-cloud-db-1 container
#   2. docker-cp the dump out to dumps/<db>-<timestamp>.sql
#   3. Drop & recreate karsaaz_cloud_backup on local PG18
#   4. Restore the dump into karsaaz_cloud_backup
#   5. Quick row-count verification
#   6. Prune dump files older than $KeepDays
#
# Auth:
#   - Source (Docker PG):  uses POSTGRES_PASSWORD from karsaaz-cloud-main\.env
#                          (passed to pg_dump via $env:PGPASSWORD inside the container)
#   - Target (local PG18): uses %APPDATA%\postgresql\pgpass.conf
#                          (run Setup-Pgpass.ps1 once before first execution)
#
# Exit codes: 0 = success, non-zero = failure. Designed for Task Scheduler.

[CmdletBinding()]
param(
    [string]$TargetDB = 'karsaaz_cloud_backup',
    [string]$SourceContainer = 'karsaaz-cloud-db-1',
    [int]$KeepDays = 14
)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$stackDir  = Split-Path -Parent $scriptDir
$dumpsDir  = Join-Path $scriptDir 'dumps'
$logsDir   = Join-Path $scriptDir 'logs'
$envFile   = Join-Path $stackDir '.env'

New-Item -ItemType Directory -Path $dumpsDir, $logsDir -Force | Out-Null

$stamp    = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$logFile  = Join-Path $logsDir "$stamp.log"
$pg18Bin  = 'C:\Program Files\PostgreSQL\18\bin'
$psql     = Join-Path $pg18Bin 'psql.exe'

# ── log helper ──
function Log {
    param([string]$Msg, [string]$Level = 'INFO')
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Level $Msg"
    Add-Content -Path $logFile -Value $line
    Write-Host $line
}

# ── trap so failures still leave a tidy log + recoverable state ──
trap {
    Log "FAILED: $_" 'ERROR'
    Log $_.ScriptStackTrace 'ERROR'
    exit 1
}

Log "===== backup start ====="
Log "stack dir:        $stackDir"
Log "target DB:        $TargetDB on localhost:5432 (PG18)"
Log "source container: $SourceContainer"
Log "log:              $logFile"

# ── parse .env for source DB credentials ──
if (-not (Test-Path $envFile)) {
    throw ".env not found at $envFile (run docker compose from karsaaz-cloud-main first)"
}
$envMap = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Z_]+\s*=' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    $envMap[$k.Trim()] = $v.Trim()
}
$srcDB   = $envMap['POSTGRES_DB']
$srcUser = $envMap['POSTGRES_USER']
$srcPass = $envMap['POSTGRES_PASSWORD']
if (-not $srcDB -or -not $srcUser -or -not $srcPass) {
    throw "POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD missing from .env"
}
Log "source: db=$srcDB user=$srcUser (password length: $($srcPass.Length))"

# ── confirm container is up ──
$running = (docker ps --filter "name=^/${SourceContainer}$" --format '{{.Names}}') 2>&1
if ($running -ne $SourceContainer) {
    throw "container '$SourceContainer' is not running (got: '$running')"
}
Log "container check OK"

# ── Step 1+2: pg_dump inside container, docker cp the file out ──
$dumpFile     = Join-Path $dumpsDir "$srcDB-$stamp.sql"
$dumpInside   = "/tmp/karsaaz-backup-$stamp.sql"

Log "step 1: pg_dump inside $SourceContainer -> $dumpInside"
$cmd = "PGPASSWORD='$srcPass' pg_dump -U '$srcUser' --clean --if-exists --no-owner --no-privileges '$srcDB' > '$dumpInside'"
docker exec $SourceContainer sh -c $cmd 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed (exit $LASTEXITCODE)" }

Log "step 2: docker cp ${SourceContainer}:${dumpInside} -> $dumpFile"
docker cp "${SourceContainer}:${dumpInside}" $dumpFile 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
if ($LASTEXITCODE -ne 0) { throw "docker cp failed (exit $LASTEXITCODE)" }
docker exec $SourceContainer rm $dumpInside | Out-Null

$dumpSize = (Get-Item $dumpFile).Length
Log "dump size:        $([math]::Round($dumpSize / 1MB, 2)) MB"

# ── Step 3: drop & recreate target DB on local PG18 ──
Log "step 3: DROP DATABASE IF EXISTS $TargetDB; CREATE DATABASE $TargetDB"
& $psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 `
    -c "DROP DATABASE IF EXISTS $TargetDB" 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
if ($LASTEXITCODE -ne 0) { throw "DROP DATABASE failed (exit $LASTEXITCODE) — check pgpass.conf" }

& $psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 `
    -c "CREATE DATABASE $TargetDB" 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
if ($LASTEXITCODE -ne 0) { throw "CREATE DATABASE failed (exit $LASTEXITCODE)" }

# ── Step 4: restore ──
Log "step 4: restore $dumpFile into $TargetDB"
& $psql -h localhost -p 5432 -U postgres -d $TargetDB -v ON_ERROR_STOP=1 `
    -f $dumpFile 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
if ($LASTEXITCODE -ne 0) { throw "restore failed (exit $LASTEXITCODE) — see $logFile" }

# ── Step 5: verify row counts on the restored copy ──
Log "step 5: verify"
$verify = & $psql -h localhost -p 5432 -U postgres -d $TargetDB -At -F '|' -c @"
SELECT
  (SELECT count(*) FROM oc_users) AS users,
  (SELECT count(*) FROM oc_filecache) AS files,
  pg_size_pretty(pg_database_size('$TargetDB')) AS db_size;
"@
Log "verify: users|files|size = $verify"
if ($LASTEXITCODE -ne 0) { throw "verification query failed" }

# ── Step 6: prune ──
Log "step 6: prune dumps older than $KeepDays days"
$pruned = Get-ChildItem $dumpsDir -Filter '*.sql' |
          Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) }
$pruned | ForEach-Object {
    Log "  pruning $($_.Name) (age $([int]((Get-Date) - $_.LastWriteTime).TotalDays) days)"
    Remove-Item $_.FullName -Force
}
Log "kept $((Get-ChildItem $dumpsDir -Filter '*.sql' | Measure-Object).Count) dump files"

# ── also prune logs > KeepDays ──
Get-ChildItem $logsDir -Filter '*.log' |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
    Remove-Item -Force

Log "===== backup done ====="
exit 0
