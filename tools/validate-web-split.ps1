$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repo "backend"
$frontendRoot = Join-Path $repo "frontend"

$frontendDirs = @("css", "img", "js", "l10n", "src", "templates", "fonts")
$backendRootRequired = @("README.txt", "BOUNDARY-MAP.json", "apps", "core", "config", "lib", "ocs", "ocs-provider", "resources")
$frontendRootRequired = @("README.txt", "BOUNDARY-MAP.json", "apps", "core")
$backendCoreForbidden = $frontendDirs
$frontendCoreRequired = $frontendDirs

$violations = New-Object System.Collections.Generic.List[string]

function Assert-Exists {
    param([string]$Path, [string]$Label)
    if (-not (Test-Path -LiteralPath $Path)) {
        $violations.Add("Missing ${Label}: $Path")
    }
}

Assert-Exists -Path $backendRoot -Label "backend root"
Assert-Exists -Path $frontendRoot -Label "frontend root"

foreach ($item in $backendRootRequired) {
    Assert-Exists -Path (Join-Path $backendRoot $item) -Label "backend item"
}

foreach ($item in $frontendRootRequired) {
    Assert-Exists -Path (Join-Path $frontendRoot $item) -Label "frontend item"
}

$backendCore = Join-Path $backendRoot "core"
$frontendCore = Join-Path $frontendRoot "core"

if (Test-Path -LiteralPath $backendCore) {
    foreach ($dir in $backendCoreForbidden) {
        if (Test-Path -LiteralPath (Join-Path $backendCore $dir)) {
            $violations.Add("backend/core leak: frontend dir '$dir' exists in backend/core")
        }
    }
}

if (Test-Path -LiteralPath $frontendCore) {
    foreach ($dir in $frontendCoreRequired) {
        if (-not (Test-Path -LiteralPath (Join-Path $frontendCore $dir))) {
            $violations.Add("frontend/core missing required dir '$dir'")
        }
    }
}

$appsSource = Join-Path $repo "apps"
$backendApps = Join-Path $backendRoot "apps"
$frontendApps = Join-Path $frontendRoot "apps"

if (Test-Path -LiteralPath $appsSource) {
    Get-ChildItem -LiteralPath $appsSource -Directory | ForEach-Object {
        $appName = $_.Name
        $appBack = Join-Path $backendApps $appName
        $appFront = Join-Path $frontendApps $appName

        Assert-Exists -Path $appBack -Label "backend app folder '$appName'"
        Assert-Exists -Path $appFront -Label "frontend app folder '$appName'"

        if (Test-Path -LiteralPath $appBack) {
            foreach ($fdir in $frontendDirs) {
                if (Test-Path -LiteralPath (Join-Path $appBack $fdir)) {
                    $violations.Add("backend/apps/$appName leak: frontend dir '$fdir' exists")
                }
            }
        }

        if (Test-Path -LiteralPath $appFront) {
            Get-ChildItem -LiteralPath $appFront -File -ErrorAction SilentlyContinue | ForEach-Object {
                $violations.Add("frontend/apps/$appName contains file '$($_.Name)' (expected dirs only)")
            }
            Get-ChildItem -LiteralPath $appFront -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                if ($frontendDirs -notcontains $_.Name) {
                    $violations.Add("frontend/apps/$appName contains non-frontend dir '$($_.Name)'")
                }
            }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Host "Web split validation FAILED with $($violations.Count) issue(s):" -ForegroundColor Red
    $violations | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "Web split validation PASSED." -ForegroundColor Green
Write-Host "Checked backend/frontend roots, core boundaries, and apps split integrity."
