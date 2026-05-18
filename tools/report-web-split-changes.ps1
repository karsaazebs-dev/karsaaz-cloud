[CmdletBinding()]
param(
    [ValidateSet("status", "cached")]
    [string]$Mode = "status"
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$frontendDirs = @("css", "img", "js", "l10n", "src", "templates", "fonts")
$excludedRoots = @("backend", "frontend", "tools")

function Is-FrontendPath {
    param([string]$Path)

    if ($Path -match '^core\\([^\\]+)\\') {
        return $frontendDirs -contains $Matches[1]
    }

    if ($Path -match '^apps\\[^\\]+\\([^\\]+)\\') {
        return $frontendDirs -contains $Matches[1]
    }

    if ($Path -like "dist\*") {
        return $true
    }

    return $false
}

function Is-Excluded {
    param([string]$Path)
    foreach ($root in $excludedRoots) {
        if ($Path -eq $root -or $Path.StartsWith("$root\")) {
            return $true
        }
    }
    return $false
}

$raw = @()
if ($Mode -eq "cached") {
    $raw = git diff --cached --name-only
} else {
    $raw = git status --porcelain
}

$paths = New-Object System.Collections.Generic.List[string]

if ($Mode -eq "cached") {
    $raw | ForEach-Object {
        $p = $_.Trim()
        if (-not [string]::IsNullOrWhiteSpace($p)) {
            $paths.Add($p.Replace("/", "\"))
        }
    }
} else {
    $raw | ForEach-Object {
        if ($_.Length -ge 4) {
            $p = $_.Substring(3).Trim().Replace("/", "\")
            if (-not [string]::IsNullOrWhiteSpace($p)) {
                $paths.Add($p)
            }
        }
    }
}

$frontend = New-Object System.Collections.Generic.List[string]
$backend = New-Object System.Collections.Generic.List[string]
$ignored = New-Object System.Collections.Generic.List[string]

$paths | Sort-Object -Unique | ForEach-Object {
    $path = $_
    if (Is-Excluded -Path $path) {
        $ignored.Add($path)
    } elseif (Is-FrontendPath -Path $path) {
        $frontend.Add($path)
    } else {
        $backend.Add($path)
    }
}

$result = [pscustomobject]@{
    Mode = $Mode
    Repository = $repo
    FrontendCount = $frontend.Count
    BackendCount = $backend.Count
    IgnoredCount = $ignored.Count
    FrontendPaths = $frontend
    BackendPaths = $backend
    IgnoredPaths = $ignored
}

$result | ConvertTo-Json -Depth 6
