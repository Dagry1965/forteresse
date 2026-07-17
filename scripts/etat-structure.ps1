# =====================================================
# Script : État de la structure de l'application (version stable)
# =====================================================

$srcPath = "C:\Users\Admin\forteresse\apps\backend\src"

Write-Host ""
Write-Host "=== ETAT DE LA STRUCTURE DE L'APPLICATION ===" -ForegroundColor Cyan
Write-Host ""

# === Modules ===
Write-Host "MODULES dans src/modules/ :" -ForegroundColor Green

$modules = Get-ChildItem "$srcPath\modules" -Directory | Sort-Object Name
$totalModules = $modules.Count
$totalFiles = 0

foreach ($module in $modules) {
    $count = (Get-ChildItem $module.FullName -Recurse -File).Count
    $totalFiles += $count
    Write-Host ("  - {0,-20} : {1} fichiers" -f $module.Name, $count)
}

Write-Host ""
Write-Host "Total : $totalModules modules | $totalFiles fichiers dans modules/" -ForegroundColor Green
Write-Host ""

# === Fichiers à la racine ===
Write-Host "FICHIERS à la racine de src/ :" -ForegroundColor Yellow

$rootFiles = Get-ChildItem $srcPath -File | Sort-Object Name

if ($rootFiles) {
    foreach ($file in $rootFiles) {
        Write-Host "  - $($file.Name)" -ForegroundColor Red
    }
} else {
    Write-Host "  Aucun fichier à la racine." -ForegroundColor Green
}

Write-Host ""

# === Dossiers à la racine (hors modules et prisma) ===
Write-Host "DOSSIERS à la racine de src/ :" -ForegroundColor Yellow

$rootFolders = Get-ChildItem $srcPath -Directory | 
               Where-Object { $_.Name -ne "modules" -and $_.Name -ne "prisma" } |
               Sort-Object Name

if ($rootFolders) {
    foreach ($folder in $rootFolders) {
        Write-Host "  - $($folder.Name)/" -ForegroundColor Red
    }
} else {
    Write-Host "  Aucun dossier résiduel à la racine." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Fin du rapport ===" -ForegroundColor Cyan
Write-Host ""