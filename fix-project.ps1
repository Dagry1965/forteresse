# ================================================
# fix-project.ps1 (Version sans emojis)
# ================================================

Write-Host "--- Lancement de la reparation Forteresse ERP ---" -ForegroundColor Cyan

# 1. Nettoyage
Write-Host "1. Nettoyage des modules et des verrous..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\backend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\backend\dist -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue

# Suppression du dossier conflictuel
Write-Host "2. Nettoyage du dossier src/appointment (conflit DTO)..." -ForegroundColor Yellow
Remove-Item -Recurse -Force apps\backend\src\appointment -ErrorAction SilentlyContinue

# 2. Installation
Write-Host "3. Installation des dependances (Force TS 5.4.5)..." -ForegroundColor Yellow
pnpm install

# 3. Verification
cd apps\backend
$tsVersion = npx tsc --version
Write-Host "Resultat : Version TypeScript actuelle : $tsVersion" -ForegroundColor Green

# 4. Build
Write-Host "4. Tentative de build du backend..." -ForegroundColor Cyan
pnpm run build

Write-Host "--- Fin du script ---" -ForegroundColor Green
