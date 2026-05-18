# Compact-DockerVHDX.ps1
# Reclaims unused space in the Docker Desktop WSL2 backing VHDX.
# Requires admin (Optimize-VHD is privileged). Self-elevates on first run.

[CmdletBinding()]
param(
    [string]$VHDX = "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx",
    [string]$LogFile = "$env:USERPROFILE\Compact-DockerVHDX.log"
)

# ── self-elevation ──
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Not running as admin - re-launching elevated (UAC prompt will appear)..." -ForegroundColor Yellow
    $arglist = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -VHDX `"$VHDX`" -LogFile `"$LogFile`""
    Start-Process powershell.exe -ArgumentList $arglist -Verb RunAs
    exit 0
}

# ── from here on, we are elevated ──
$ErrorActionPreference = 'Continue'

function Log {
    param([string]$Msg, [string]$Color = 'White')
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $Msg"
    Write-Host $line -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $line
}

# Wipe previous log
Set-Content -Path $LogFile -Value "===== Compact-DockerVHDX run $(Get-Date) ====="

Log "VHDX path:    $VHDX" 'Cyan'
Log "Log file:     $LogFile" 'Cyan'

if (-not (Test-Path $VHDX)) {
    Log "ERROR: VHDX not found at $VHDX" 'Red'
    Read-Host "press Enter to close"; exit 1
}
$beforeBytes = (Get-Item $VHDX).Length
Log "VHDX size before:  $([math]::Round($beforeBytes/1GB,2)) GB" 'Yellow'

$beforeFreeC = (Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace
Log "C: free before:    $([math]::Round($beforeFreeC/1GB,2)) GB" 'Yellow'

# ── snapshot running containers so we can verify everything comes back ──
Log "" 'White'
Log "===== STEP 1: snapshot running containers =====" 'Green'
$snapshotFile = "$env:USERPROFILE\docker-running-snapshot.txt"
docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}' | Set-Content $snapshotFile
$wasRunning = Get-Content $snapshotFile
Log "Snapshot saved to $snapshotFile" 'White'
Log "Containers that were running (will be brought back):" 'White'
$wasRunning | ForEach-Object { Log "  $_" 'Gray' }
$runningCount = ($wasRunning | Measure-Object).Count
Log "Total: $runningCount running containers" 'White'

# ── stop Docker Desktop ──
Log "" 'White'
Log "===== STEP 2: stop Docker Desktop =====" 'Green'
$dd = Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue
if ($dd) {
    Log "Stopping Docker Desktop (PID $($dd.Id))..." 'White'
    Stop-Process -Name 'Docker Desktop' -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}
Get-Process | Where-Object { $_.Name -match '^(com\.docker|dockerd|docker$)' } |
    ForEach-Object { Log "  killing $($_.Name) (PID $($_.Id))" 'Gray'; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

# ── wsl --shutdown ──
Log "" 'White'
Log "===== STEP 3: wsl --shutdown =====" 'Green'
& wsl.exe --shutdown 2>&1 | ForEach-Object { Log "  wsl: $_" 'Gray' }
Start-Sleep -Seconds 8
Log "WSL shut down (slept 8s to let file handles release)" 'White'

# ── compact ──
Log "" 'White'
Log "===== STEP 4: Optimize-VHD -Mode Full =====" 'Green'
Log "(this is the slow step - typically 2-8 minutes depending on disk speed)" 'Yellow'
$swc = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Optimize-VHD -Path $VHDX -Mode Full -ErrorAction Stop
    Log "Optimize-VHD completed in $([math]::Round($swc.Elapsed.TotalSeconds,1))s" 'Green'
} catch {
    Log "Optimize-VHD FAILED: $_" 'Red'
    Log "Falling back to diskpart compact vdisk..." 'Yellow'
    $dpScript = @"
select vdisk file=$VHDX
attach vdisk readonly
compact vdisk
detach vdisk
exit
"@
    $dpFile = "$env:TEMP\compact-vhdx-$PID.txt"
    Set-Content -Path $dpFile -Value $dpScript -Encoding ASCII
    & diskpart /s $dpFile 2>&1 | ForEach-Object { Log "  diskpart: $_" 'Gray' }
    Remove-Item $dpFile -Force
    Log "diskpart fallback finished" 'White'
}

$afterBytes = (Get-Item $VHDX).Length
$reclaimed = ($beforeBytes - $afterBytes)
Log "" 'White'
Log "VHDX size before:  $([math]::Round($beforeBytes/1GB,2)) GB" 'Yellow'
Log "VHDX size after:   $([math]::Round($afterBytes/1GB,2)) GB" 'Green'
Log "Reclaimed:         $([math]::Round($reclaimed/1GB,2)) GB" 'Green'

# ── restart Docker Desktop ──
Log "" 'White'
Log "===== STEP 5: restart Docker Desktop =====" 'Green'
$ddExe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
if (-not (Test-Path $ddExe)) {
    Log "WARN: Docker Desktop.exe not at expected path $ddExe" 'Red'
    Log "      Start it manually, then run: docker compose -f `"C:\Dev\Karsaaz Cloud\karsaaz-cloud-main\karsaaz-cloud-main\docker-compose.yml`" up -d" 'Yellow'
} else {
    Log "Launching: $ddExe" 'White'
    Start-Process $ddExe
    Log "Waiting for Docker daemon to be ready (polling docker ps every 5s, up to 3 min)..." 'White'
    $dockerReady = $false
    for ($i = 0; $i -lt 36; $i++) {
        Start-Sleep -Seconds 5
        $probe = docker ps 2>&1
        if ($LASTEXITCODE -eq 0 -and $probe -notmatch 'error') {
            $dockerReady = $true
            Log "Docker daemon is up after $(($i+1)*5)s" 'Green'
            break
        }
        Log "  ... not yet ($([math]::Round(($i+1)*5))s elapsed)" 'Gray'
    }
    if (-not $dockerReady) {
        Log "WARN: Docker daemon didn't come back within 3 min. You may need to start it manually." 'Red'
    }
}

# ── bring Karsaaz Cloud stack back up ──
Log "" 'White'
Log "===== STEP 6: bring up Karsaaz Cloud stack =====" 'Green'
$stackDir = 'C:\Dev\Karsaaz Cloud\karsaaz-cloud-main\karsaaz-cloud-main'
if (Test-Path "$stackDir\docker-compose.yml") {
    Push-Location $stackDir
    docker compose up -d 2>&1 | ForEach-Object { Log "  compose: $_" 'Gray' }
    Pop-Location
} else {
    Log "WARN: $stackDir\docker-compose.yml missing" 'Red'
}

Start-Sleep -Seconds 5
Log "" 'White'
Log "===== STEP 7: verify =====" 'Green'

$afterFreeC = (Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace
$gained = $afterFreeC - $beforeFreeC
Log "C: free after:    $([math]::Round($afterFreeC/1GB,2)) GB" 'Cyan'
Log "C: gained:        $([math]::Round($gained/1GB,2)) GB" 'Green'

Log "Running containers after restart:" 'White'
docker ps --format '{{.Names}}|{{.Status}}' | ForEach-Object { Log "  $_" 'Gray' }

# Compare against snapshot
$newRunning = (docker ps --format '{{.Names}}') -split "`r?`n"
$expected = $wasRunning | ForEach-Object { ($_ -split '\|')[0] }
$missing = $expected | Where-Object { $_ -and ($newRunning -notcontains $_) }
if ($missing) {
    Log "" 'White'
    Log "Containers that did NOT come back (probably no restart policy):" 'Yellow'
    $missing | ForEach-Object { Log "  $_  - bring back with: docker start $_" 'Yellow' }
} else {
    Log "All $runningCount previously-running containers are back up." 'Green'
}

Log "" 'White'
Log "===== DONE =====" 'Green'
Log "Full log:  $LogFile" 'Cyan'
Read-Host "Press Enter to close this window"
