[CmdletBinding()]
param(
    [string]$OutputPath = "C:\Dev\Karsaaz Cloud\Plans\05-PHASE-5-REBRANDING\PHASE-5-WEB-BRAND-LEAK-SCAN.md"
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$scanRoots = @(
    (Join-Path $repo "frontend"),
    (Join-Path $repo "backend")
)

$patterns = @(
    "Nextcloud",
    "nextcloud.com",
    "nextcloud.org",
    "updates.nextcloud.com",
    "apps.nextcloud.com",
    "lookup.nextcloud.com"
)

$excludePathRegex = '\\(LICENSES|tests|__tests__|3rdparty|vendor|node_modules|build|dist|\.git)\\'
$allowedRegex = 'SPDX-FileCopyrightText|AGPL|GPL|COPYING|LICENSE|openapi\.json\.license'

$candidates = New-Object System.Collections.Generic.List[object]
$allowed = New-Object System.Collections.Generic.List[object]

function Get-LeakClass {
    param(
        [string]$Path,
        [string]$Text
    )

    $trimmed = $Text.Trim()

    if ($trimmed.StartsWith('//')) {
        return "metadata-or-api"
    }

    if ($Path -match '\\frontend\\') {
        return "frontend-ui"
    }
    if ($Path -match '\\backend\\version\.php$') {
        return "metadata-or-api"
    }
    if ($Path -match '\\backend\\console\.php$') {
        return "backend-runtime"
    }
    if ($Path -match '\\backend\\core\\templates\\' -or
        $Path -match '\\backend\\apps\\[^\\]+\\templates\\' -or
        $Path -match '\\backend\\core\\strings\.php$' -or
        $Path -match '\\backend\\(index|public|remote|status|cron|console|version)\.php$') {
        return "backend-runtime"
    }
    return "metadata-or-api"
}

foreach ($root in $scanRoots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }
    $files = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch $excludePathRegex
    }

    foreach ($file in $files) {
        foreach ($pattern in $patterns) {
            $matches = Select-String -Path $file.FullName -Pattern $pattern -SimpleMatch -CaseSensitive:$false -ErrorAction SilentlyContinue
            foreach ($m in $matches) {
                $entry = [pscustomobject]@{
                    Path = $m.Path
                    Line = $m.LineNumber
                    Pattern = $pattern
                    Text = $m.Line.Trim()
                    Class = Get-LeakClass -Path $m.Path -Text $m.Line
                }
                if ($entry.Text -match $allowedRegex) {
                    $allowed.Add($entry)
                } else {
                    $candidates.Add($entry)
                }
            }
        }
    }
}

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
$actionable = $candidates | Where-Object { $_.Class -ne "metadata-or-api" }
$metadata = $candidates | Where-Object { $_.Class -eq "metadata-or-api" }
$lines = @()
$lines += "# PHASE 5B - WEB BRAND LEAK SCAN"
$lines += ""
$lines += "- Timestamp: $ts"
$lines += "- Repository: $repo"
$lines += ""
$lines += "## Summary"
$lines += ""
$lines += "| Category | Count |"
$lines += "|---|---:|"
$lines += "| Potential leaks (total) | $($candidates.Count) |"
$lines += "| Actionable UI/runtime leaks | $($actionable.Count) |"
$lines += "| Metadata/API leaks | $($metadata.Count) |"
$lines += "| Allowed references | $($allowed.Count) |"
$lines += ""

$lines += "## Actionable UI/runtime leaks"
$lines += ""
if ($actionable.Count -eq 0) {
    $lines += "_None found_"
} else {
    foreach ($c in $actionable | Sort-Object Path, Line) {
        $pathLine = "$($c.Path):$($c.Line)"
        $lines += ('- `{0}` [{1}] - {2}' -f $pathLine, $c.Pattern, $c.Text)
    }
}
$lines += ""

$lines += "## Metadata/API leaks (non-UI)"
$lines += ""
if ($metadata.Count -eq 0) {
    $lines += "_None_"
} else {
    foreach ($m in $metadata | Sort-Object Path, Line) {
        $pathLine = "$($m.Path):$($m.Line)"
        $lines += ('- `{0}` [{1}] - {2}' -f $pathLine, $m.Pattern, $m.Text)
    }
}
$lines += ""

$lines += "## Allowed references (license/attribution)"
$lines += ""
if ($allowed.Count -eq 0) {
    $lines += "_None_"
} else {
    foreach ($a in $allowed | Sort-Object Path, Line | Select-Object -First 200) {
        $pathLine = "$($a.Path):$($a.Line)"
        $lines += ('- `{0}` [{1}] - {2}' -f $pathLine, $a.Pattern, $a.Text)
    }
    if ($allowed.Count -gt 200) {
        $lines += "- _Truncated: showing first 200 of $($allowed.Count)_"
    }
}
$lines += ""

$parent = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
}
$lines | Set-Content -LiteralPath $OutputPath
Write-Host "Wrote brand leak scan report: $OutputPath"
Write-Host "Potential leaks: $($candidates.Count); Allowed refs: $($allowed.Count)"
