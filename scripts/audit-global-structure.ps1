# audit-global-structure.ps1

Write-Host "=== AUDIT GLOBAL DE LA STRUCTURE ===" -ForegroundColor Cyan
Write-Host ""

$srcPath = ".\apps\backend\src"

# 1. Controleurs a la racine
Write-Host "1. CONTROLEURS A LA RACINE :" -ForegroundColor Yellow
$rootControllers = Get-ChildItem -Path $srcPath -Filter "*.controller.ts" -ErrorAction SilentlyContinue
if ($rootControllers) {
    $rootControllers | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Red }
} else {
    Write-Host "   Aucun" -ForegroundColor Green
}

Write-Host ""

# 2. Modules existants
Write-Host "2. MODULES DANS src/modules :" -ForegroundColor Yellow
$modulesPath = "$srcPath\modules"
if (Test-Path $modulesPath) {
    Get-ChildItem -Path $modulesPath -Directory | ForEach-Object { Write-Host "   - $($_.Name)" }
} else {
    Write-Host "   Aucun module trouve" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIN DE L'AUDIT ===" -ForegroundColor Cyan
