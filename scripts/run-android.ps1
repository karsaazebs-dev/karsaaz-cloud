# Build + install Karsaaz Sync on a connected Android device.
# IMPORTANT: builds from C:\m (junction) — do NOT run `npx expo run:android` from the long path.
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExpoArgs
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "android-env.ps1")

$info = Initialize-KarsaazAndroidEnv

$argsList = @("run:android", "--port", "8082")
if ($ExpoArgs.Count -gt 0) {
    $argsList += $ExpoArgs
}

Push-Location $info.MobileShort
try {
    & npx expo @argsList
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
