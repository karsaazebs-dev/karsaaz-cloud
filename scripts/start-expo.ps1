# Start Metro from the short junction path (avoids Windows MAX_PATH issues on native rebuilds).
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ExpoArgs
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "android-env.ps1")

$info = Initialize-KarsaazAndroidEnv

Push-Location $info.MobileShort
try {
    if ($ExpoArgs.Count -gt 0) {
        & npx expo @ExpoArgs
    } else {
        & npx expo start
    }
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
