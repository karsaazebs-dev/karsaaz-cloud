# Register-ScheduledTask.ps1 — wires backup-to-localpg.ps1 into Windows Task Scheduler.
# Runs daily at 02:00 under the current user account.
# Re-running this script updates the existing task in place.

[CmdletBinding()]
param(
    [string]$TaskName = 'KarsaazCloud-DailyLocalPgBackup',
    [string]$TimeOfDay = '02:00',
    [int]$KeepDays = 14
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $scriptDir 'backup-to-localpg.ps1'

if (-not (Test-Path $backupScript)) {
    Write-Error "backup script not found: $backupScript"
    exit 1
}

# ── existing task? remove it so we register a fresh one ──
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task '$TaskName'..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -KeepDays $KeepDays" `
    -WorkingDirectory $scriptDir

$trigger = New-ScheduledTaskTrigger -Daily -At $TimeOfDay

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

$principal = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName `
    -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
    -Description "Karsaaz Cloud: pg_dump from Docker DB and restore into local PG18 'karsaaz_cloud_backup' daily." | Out-Null

Write-Host ""
Write-Host "Registered task: $TaskName"
Write-Host "  Runs daily at:  $TimeOfDay"
Write-Host "  Script:         $backupScript"
Write-Host "  Retention:      $KeepDays days"
Write-Host ""
Write-Host "Manage with:"
Write-Host "  Get-ScheduledTask  -TaskName $TaskName"
Write-Host "  Start-ScheduledTask -TaskName $TaskName     # run now"
Write-Host "  Unregister-ScheduledTask -TaskName $TaskName -Confirm:`$false   # remove"
