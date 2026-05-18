# Setup-Pgpass.ps1 — one-time helper: writes %APPDATA%\postgresql\pgpass.conf
# with the local PG18 superuser password.
# Reads the password via secure prompt so it never appears in the transcript.

[CmdletBinding()]
param(
    [string]$Host_ = 'localhost',
    [int]$Port = 5432,
    [string]$User = 'postgres'
)

$pgpassDir  = Join-Path $env:APPDATA 'postgresql'
$pgpassFile = Join-Path $pgpassDir 'pgpass.conf'

if (-not (Test-Path $pgpassDir)) {
    New-Item -ItemType Directory -Path $pgpassDir -Force | Out-Null
}

$secure = Read-Host -AsSecureString "Local PG18 password for user '$User' (input hidden)"
$bstr   = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain  = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null

# pgpass.conf line format: hostname:port:database:username:password
$line = "${Host_}:${Port}:*:${User}:${plain}"

# Read existing lines, drop any matching the same host:port:user, append new one
$existing = if (Test-Path $pgpassFile) { Get-Content $pgpassFile } else { @() }
$kept = $existing | Where-Object { $_ -notmatch "^${Host_}:${Port}:[^:]*:${User}:" }
$kept + $line | Set-Content -Path $pgpassFile -Encoding ASCII

# Lock down ACL: current user only (mirrors Unix chmod 600)
$acl = Get-Acl $pgpassFile
$acl.SetAccessRuleProtection($true, $false)
$acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) | Out-Null }
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $me, 'FullControl', 'Allow')
$acl.AddAccessRule($rule)
Set-Acl -Path $pgpassFile -AclObject $acl

Write-Host "pgpass.conf written:  $pgpassFile"
Write-Host "ACL locked to:        $me"
Write-Host ""
Write-Host "Verifying connection..."
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h $Host_ -p $Port -U $User -d postgres -c "SELECT version();" 2>&1
