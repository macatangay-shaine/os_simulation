param(
    [Parameter(Mandatory = $true)]
    [string]$ForkUrl
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

# Ensure upstream exists for syncing with original project.
$hasUpstream = git remote | Select-String -Pattern '^upstream$' -Quiet
if (-not $hasUpstream) {
    git remote add upstream https://github.com/somarjez/os_simulation.git
}

# Configure or update origin to the user's fork.
$hasOrigin = git remote | Select-String -Pattern '^origin$' -Quiet
if ($hasOrigin) {
    git remote set-url origin $ForkUrl
} else {
    git remote add origin $ForkUrl
}

# Push all workflow branches.
git push -u origin main
git push -u origin develop
git push -u origin feature/initial-setup

Write-Host "Done: origin/upstream configured and branches pushed." -ForegroundColor Green
