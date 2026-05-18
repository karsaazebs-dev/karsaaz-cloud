[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repo "backend"
$frontendRoot = Join-Path $repo "frontend"

$frontendDirs = @("css", "img", "js", "l10n", "src", "templates", "fonts")
$backendEntryFiles = @("index.php", "remote.php", "public.php", "cron.php", "status.php", "occ", "console.php", "version.php")
$backendRootDirs = @("config", "lib", "ocs", "ocs-provider", "resources")
$frontendRootDirs = @("dist")
$requiredRoots = @("apps", "core", "lib")

$stats = @{
    CopiedFiles = 0
    LinkedDirs = 0
    CreatedDirs = 0
}

function Invoke-Op {
    param(
        [string]$Description,
        [scriptblock]$Action
    )
    if ($DryRun) {
        Write-Host "[DRY-RUN] $Description"
        return
    }
    & $Action
}

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        Invoke-Op "Create directory $Path" { New-Item -ItemType Directory -Path $Path | Out-Null }
        $script:stats.CreatedDirs++
    }
}

function Reset-Dir {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        Invoke-Op "Remove directory $Path" { Remove-Item -LiteralPath $Path -Recurse -Force }
    }
    Invoke-Op "Create directory $Path" { New-Item -ItemType Directory -Path $Path | Out-Null }
    $script:stats.CreatedDirs++
}

function New-Junction {
    param(
        [string]$LinkPath,
        [string]$TargetPath
    )
    if (Test-Path -LiteralPath $LinkPath) {
        Invoke-Op "Remove existing path $LinkPath" { Remove-Item -LiteralPath $LinkPath -Recurse -Force }
    }
    Invoke-Op "Create junction $LinkPath -> $TargetPath" {
        New-Item -ItemType Junction -Path $LinkPath -Target $TargetPath | Out-Null
    }
    $script:stats.LinkedDirs++
}

function Copy-FileSafe {
    param(
        [string]$Source,
        [string]$Destination
    )
    Invoke-Op "Copy file $Source -> $Destination" {
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
    $script:stats.CopiedFiles++
}

if (-not (Test-Path -LiteralPath (Join-Path $repo "version.php"))) {
    throw "Unexpected repo root '$repo'. version.php not found."
}

foreach ($rootName in $requiredRoots) {
    $requiredPath = Join-Path $repo $rootName
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Required root missing: $requiredPath"
    }
}

Reset-Dir -Path $backendRoot
Reset-Dir -Path $frontendRoot

foreach ($file in $backendEntryFiles) {
    $src = Join-Path $repo $file
    if (Test-Path -LiteralPath $src) {
        Copy-FileSafe -Source $src -Destination (Join-Path $backendRoot $file)
    }
}

foreach ($dir in $backendRootDirs) {
    $src = Join-Path $repo $dir
    if (Test-Path -LiteralPath $src) {
        New-Junction -LinkPath (Join-Path $backendRoot $dir) -TargetPath $src
    }
}

foreach ($dir in $frontendRootDirs) {
    $src = Join-Path $repo $dir
    if (Test-Path -LiteralPath $src) {
        New-Junction -LinkPath (Join-Path $frontendRoot $dir) -TargetPath $src
    }
}

$coreSrc = Join-Path $repo "core"
$backendCore = Join-Path $backendRoot "core"
$frontendCore = Join-Path $frontendRoot "core"
Ensure-Dir -Path $backendCore
Ensure-Dir -Path $frontendCore

Get-ChildItem -LiteralPath $coreSrc -Directory | ForEach-Object {
    if ($frontendDirs -contains $_.Name) {
        New-Junction -LinkPath (Join-Path $frontendCore $_.Name) -TargetPath $_.FullName
    } else {
        New-Junction -LinkPath (Join-Path $backendCore $_.Name) -TargetPath $_.FullName
    }
}

Get-ChildItem -LiteralPath $coreSrc -File | ForEach-Object {
    Copy-FileSafe -Source $_.FullName -Destination (Join-Path $backendCore $_.Name)
}

$appsSrc = Join-Path $repo "apps"
$backendApps = Join-Path $backendRoot "apps"
$frontendApps = Join-Path $frontendRoot "apps"
Ensure-Dir -Path $backendApps
Ensure-Dir -Path $frontendApps

Get-ChildItem -LiteralPath $appsSrc -Directory | ForEach-Object {
    $appSrc = $_.FullName
    $appBack = Join-Path $backendApps $_.Name
    $appFront = Join-Path $frontendApps $_.Name
    Ensure-Dir -Path $appBack
    Ensure-Dir -Path $appFront

    Get-ChildItem -LiteralPath $appSrc -Directory | ForEach-Object {
        if ($frontendDirs -contains $_.Name) {
            New-Junction -LinkPath (Join-Path $appFront $_.Name) -TargetPath $_.FullName
        } else {
            New-Junction -LinkPath (Join-Path $appBack $_.Name) -TargetPath $_.FullName
        }
    }

    Get-ChildItem -LiteralPath $appSrc -File | ForEach-Object {
        Copy-FileSafe -Source $_.FullName -Destination (Join-Path $appBack $_.Name)
    }
}

$backendBoundaryMap = @{
    root = "backend"
    generatedBy = "tools/create-web-split-folders.ps1"
    include = @{
        rootFiles = $backendEntryFiles
        rootDirs = $backendRootDirs
        coreFrontendDirExcludes = $frontendDirs
    }
    notes = @(
        "Generated view only. Edit source files in repository root.",
        "Frontend directories are excluded from backend/core and backend/apps/* views."
    )
}

$frontendBoundaryMap = @{
    root = "frontend"
    generatedBy = "tools/create-web-split-folders.ps1"
    include = @{
        rootDirs = $frontendRootDirs
        coreDirs = $frontendDirs
        appDirs = $frontendDirs
    }
    notes = @(
        "Generated view only. Edit source files in repository root.",
        "Only UI/frontend directories are included."
    )
}

Invoke-Op "Write backend boundary map" {
    $backendBoundaryMap | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $backendRoot "BOUNDARY-MAP.json")
}

Invoke-Op "Write frontend boundary map" {
    $frontendBoundaryMap | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $frontendRoot "BOUNDARY-MAP.json")
}

Invoke-Op "Write backend readme" {
    @(
        "Generated split view for web backend.",
        "This folder is generated by tools\create-web-split-folders.ps1.",
        "Do not edit files here directly; edit source files in repository root."
    ) | Set-Content -LiteralPath (Join-Path $backendRoot "README.txt")
}

Invoke-Op "Write frontend readme" {
    @(
        "Generated split view for web frontend.",
        "This folder is generated by tools\create-web-split-folders.ps1.",
        "Do not edit files here directly; edit source files in repository root."
    ) | Set-Content -LiteralPath (Join-Path $frontendRoot "README.txt")
}

Write-Host "Split generation completed for:"
Write-Host " - $backendRoot"
Write-Host " - $frontendRoot"
Write-Host "Summary:"
Write-Host " - Created directories: $($stats.CreatedDirs)"
Write-Host " - Linked directories:  $($stats.LinkedDirs)"
Write-Host " - Copied files:        $($stats.CopiedFiles)"
if ($DryRun) {
    Write-Host "Dry-run mode: no filesystem changes were applied."
}
