#cd C:\Users\Admin\forteresse\apps\backend
cd C:\Users\Admin\forteresse
function Get-Tree {
    param (
        [string]$Path = "src",
        [int]$Level = 0
    )

    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | 
             Where-Object { 
                 $_.Name -ne 'node_modules' -and 
                 $_.Name -ne 'dist' -and 
                 $_.Name -ne '.git' 
             } | 
             Sort-Object -Property @{Expression='PSIsContainer'; Descending=$true}, Name

    foreach ($item in $items) {
        $indent = "  " * $Level
        if ($item.PSIsContainer) {
            "$indent- **$($item.Name)**/"
            Get-Tree -Path $item.FullName -Level ($Level + 1)
        } else {
            "$indent- ``$($item.Name)``"
        }
    }
}

# Exécution
Get-Tree | Out-File -FilePath "repo-structure.md" -Encoding UTF8

Write-Host ""
Write-Host "✅ Fichier créé avec succès !" -ForegroundColor Green
Write-Host "Emplacement : $(Get-Location)\repo-structure.md" -ForegroundColor Cyan