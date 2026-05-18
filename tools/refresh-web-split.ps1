$ErrorActionPreference = "Stop"

$toolsRoot = $PSScriptRoot
$createScript = Join-Path $toolsRoot "create-web-split-folders.ps1"
$validateScript = Join-Path $toolsRoot "validate-web-split.ps1"

if (-not (Test-Path -LiteralPath $createScript)) {
    throw "Missing script: $createScript"
}

if (-not (Test-Path -LiteralPath $validateScript)) {
    throw "Missing script: $validateScript"
}

Write-Host "Refreshing web split views..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File $createScript
if ($LASTEXITCODE -ne 0) {
    throw "Split generation failed with exit code $LASTEXITCODE"
}

Write-Host "Validating web split views..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File $validateScript
if ($LASTEXITCODE -ne 0) {
    throw "Split validation failed with exit code $LASTEXITCODE"
}

Write-Host "Web split refresh + validation complete." -ForegroundColor Green
