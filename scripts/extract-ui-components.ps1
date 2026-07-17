# =====================================================
# Script : Extraire les composants UI (version stable)
# =====================================================

$sourceFolder = "C:\Users\Admin\forteresse\apps\web\components\"
$outputFile   = "C:\Users\Admin\forteresse\apps\web\components\ui-all-components.md"

if (Test-Path $outputFile) { Remove-Item $outputFile -Force }

Add-Content -Path $outputFile -Value "## Tous les composants UI" -Encoding UTF8
Add-Content -Path $outputFile -Value "" -Encoding UTF8
Add-Content -Path $outputFile -Value "**Dossier source :** $sourceFolder" -Encoding UTF8
Add-Content -Path $outputFile -Value "**Date :** $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -Encoding UTF8
Add-Content -Path $outputFile -Value "" -Encoding UTF8
Add-Content -Path $outputFile -Value "---" -Encoding UTF8
Add-Content -Path $outputFile -Value "" -Encoding UTF8

$files = Get-ChildItem -Path $sourceFolder -Recurse -File | Sort-Object FullName

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($sourceFolder, "components\ui").TrimStart('\')

    Add-Content -Path $outputFile -Value "### $relativePath" -Encoding UTF8
    Add-Content -Path $outputFile -Value "" -Encoding UTF8

    # Ajoute le bloc de code
    Add-Content -Path $outputFile -Value '```' -Encoding UTF8
    Get-Content $file.FullName | Add-Content -Path $outputFile -Encoding UTF8
    Add-Content -Path $outputFile -Value '```' -Encoding UTF8
    Add-Content -Path $outputFile -Value "" -Encoding UTF8
    Add-Content -Path $outputFile -Value "---" -Encoding UTF8
    Add-Content -Path $outputFile -Value "" -Encoding UTF8
}

Write-Host ""
Write-Host "Fichier genere avec succes !" -ForegroundColor Green
Write-Host "Emplacement : $outputFile" -ForegroundColor Cyan
Write-Host "Nombre de fichiers extraits : $($files.Count)" -ForegroundColor Yellow