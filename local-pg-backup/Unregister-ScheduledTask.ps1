[CmdletBinding()]
param([string]$TaskName = 'KarsaazCloud-DailyLocalPgBackup')

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed task: $TaskName"
} else {
    Write-Host "No task named '$TaskName' to remove."
}
