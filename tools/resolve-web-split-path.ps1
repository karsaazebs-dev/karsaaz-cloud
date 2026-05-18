[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SplitPath
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$fullSplitPath = [System.IO.Path]::GetFullPath($SplitPath)
$backendRoot = [System.IO.Path]::GetFullPath((Join-Path $repo "backend"))
$frontendRoot = [System.IO.Path]::GetFullPath((Join-Path $repo "frontend"))

function Get-RelativePathSafe {
    param(
        [string]$BasePath,
        [string]$ChildPath
    )
    if ($ChildPath.StartsWith($BasePath, [System.StringComparison]::OrdinalIgnoreCase)) {
        $rel = $ChildPath.Substring($BasePath.Length).TrimStart('\')
        return $rel
    }
    return $null
}

$relative = Get-RelativePathSafe -BasePath $backendRoot -ChildPath $fullSplitPath
$view = "backend"

if ($null -eq $relative) {
    $relative = Get-RelativePathSafe -BasePath $frontendRoot -ChildPath $fullSplitPath
    $view = "frontend"
}

if ($null -eq $relative) {
    throw "Path is not under backend/ or frontend/: $fullSplitPath"
}

if ([string]::IsNullOrWhiteSpace($relative)) {
    throw "Path points to split root. Provide a child path."
}

$sourcePath = Join-Path $repo $relative
$exists = Test-Path -LiteralPath $sourcePath

[pscustomobject]@{
    View       = $view
    SplitPath  = $fullSplitPath
    SourcePath = $sourcePath
    Exists     = $exists
} | ConvertTo-Json -Depth 4
