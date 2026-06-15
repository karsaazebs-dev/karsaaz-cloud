# Shared Android SDK env for Karsaaz Sync (Windows).
# SDK lives in the workspace at tools/android-sdk — not in %LOCALAPPDATA%\Android\Sdk.
$ErrorActionPreference = "Stop"

function Initialize-KarsaazAndroidEnv {
    param(
        [switch]$PersistUserEnv
    )

    $MobileRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
    $WorkspaceRoot = Resolve-Path (Join-Path $MobileRoot "..")
    $SdkLong = Join-Path $WorkspaceRoot "tools\android-sdk"

    if (-not (Test-Path $SdkLong)) {
        throw "Android SDK not found at: $SdkLong"
    }

    # Short junction paths avoid NDK linker failures (spaces) and MAX_PATH (260) errors.
    $SdkShort = "C:\sdk"
    $MobileShort = "C:\m"

    if (-not (Test-Path $SdkShort)) {
        cmd /c mklink /J "$SdkShort" "$SdkLong" | Out-Null
    }
    if (-not (Test-Path $MobileShort)) {
        cmd /c mklink /J "$MobileShort" "$MobileRoot" | Out-Null
    }

    $env:ANDROID_HOME = $SdkShort
    $env:ANDROID_SDK_ROOT = $SdkShort
    $env:Path = "$SdkShort\platform-tools;$SdkShort\emulator;$SdkShort\cmdline-tools\latest\bin;$env:Path"

    $localProps = Join-Path $MobileRoot "android\local.properties"
    if (Test-Path (Join-Path $MobileRoot "android")) {
        $sdkDir = $SdkShort -replace '\\', '/'
        @("sdk.dir=$sdkDir") | Set-Content -Path $localProps -Encoding ascii
    }

    if ($PersistUserEnv) {
        [Environment]::SetEnvironmentVariable("ANDROID_HOME", $SdkShort, "User")
        [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $SdkShort, "User")

        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        $entries = @(
            "$SdkShort\platform-tools",
            "$SdkShort\emulator",
            "$SdkShort\cmdline-tools\latest\bin"
        )
        foreach ($entry in $entries) {
            if ($userPath -notlike "*$entry*") {
                $userPath = "$entry;$userPath"
            }
        }
        [Environment]::SetEnvironmentVariable("Path", $userPath.TrimEnd(';'), "User")
    }

    return @{
        MobileRoot = $MobileRoot
        MobileShort = $MobileShort
        SdkShort = $SdkShort
    }
}
