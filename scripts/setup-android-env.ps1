# One-time setup: persist ANDROID_HOME + adb on PATH for all new terminals.
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "android-env.ps1")

$info = Initialize-KarsaazAndroidEnv -PersistUserEnv

Write-Host "Android SDK configured."
Write-Host "  ANDROID_HOME = $($info.SdkShort)"
Write-Host "  Project link   = $($info.MobileShort) -> $($info.MobileRoot)"
Write-Host ""
Write-Host "Close and reopen PowerShell, then run:"
Write-Host "  cd `"$($info.MobileRoot)`""
Write-Host "  npm run android"
Write-Host ""
Write-Host "Or use the short path (recommended for native builds):"
Write-Host "  cd C:\m && npm run android"
