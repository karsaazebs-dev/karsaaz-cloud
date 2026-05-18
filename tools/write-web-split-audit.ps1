[CmdletBinding()]
param(
    [ValidateSet("status", "cached")]
    [string]$Mode = "status",
    [string]$OutputPath = "C:\Dev\Karsaaz Cloud\Plans\05-PHASE-5-REBRANDING\PHASE-5-WEB-SPLIT-AUDIT.md"
)

$ErrorActionPreference = "Stop"

$toolsRoot = $PSScriptRoot
$reportScript = Join-Path $toolsRoot "report-web-split-changes.ps1"

if (-not (Test-Path -LiteralPath $reportScript)) {
    throw "Missing script: $reportScript"
}

$json = powershell -ExecutionPolicy Bypass -File $reportScript -Mode $Mode
$report = $json | ConvertFrom-Json

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
$lines = @()
$lines += "# PHASE 5A - WEB SPLIT AUDIT"
$lines += ""
$lines += "- Timestamp: $timestamp"
$lines += "- Mode: $($report.Mode)"
$lines += "- Repository: $($report.Repository)"
$lines += ""
$lines += "## Summary"
$lines += ""
$lines += "| Bucket | Count |"
$lines += "|---|---:|"
$lines += "| Frontend | $($report.FrontendCount) |"
$lines += "| Backend | $($report.BackendCount) |"
$lines += "| Ignored | $($report.IgnoredCount) |"
$lines += ""

$lines += "## Frontend paths"
$lines += ""
if ($report.FrontendCount -eq 0) {
    $lines += "_None_"
} else {
    foreach ($p in $report.FrontendPaths) {
        $lines += "- ``$p``"
    }
}
$lines += ""

$lines += "## Backend paths"
$lines += ""
if ($report.BackendCount -eq 0) {
    $lines += "_None_"
} else {
    foreach ($p in $report.BackendPaths) {
        $lines += "- ``$p``"
    }
}
$lines += ""

$lines += "## Ignored paths"
$lines += ""
if ($report.IgnoredCount -eq 0) {
    $lines += "_None_"
} else {
    foreach ($p in $report.IgnoredPaths) {
        $lines += "- ``$p``"
    }
}
$lines += ""

$parent = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
}

$lines | Set-Content -LiteralPath $OutputPath
Write-Host "Wrote web split audit to: $OutputPath"
