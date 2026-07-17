# ============================================
#   FONCTION UNIVERSELLE DE CORRECTION
# ============================================
function Fix-Encoding {
    param([string]$text)

    if (-not $text) { return $text }

    # Étape 1 : tentative de décodage automatique
    $encodings = @(
        [System.Text.Encoding]::UTF8,
        [System.Text.Encoding]::GetEncoding(1252),
        [System.Text.Encoding]::GetEncoding("iso-8859-1")
    )

    foreach ($enc in $encodings) {
        try {
            $bytes = $enc.GetBytes($text)
            $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        } catch {}
    }

    # Étape 2 : corrections génériques (sans caractères spéciaux dans le script)
    $patterns = @(
        @{ from = ([char]0xC3 + [char]0xA9); to = "é" }
        @{ from = ([char]0xC3 + [char]0xA8); to = "è" }
        @{ from = ([char]0xC3 + [char]0xAA); to = "ê" }
        @{ from = ([char]0xC3 + [char]0xAB); to = "ë" }
        @{ from = ([char]0xC3 + [char]0xA0); to = "à" }
        @{ from = ([char]0xC3 + [char]0xA2); to = "â" }
        @{ from = ([char]0xC3 + [char]0xA4); to = "ä" }
        @{ from = ([char]0xC3 + [char]0xB9); to = "ù" }
        @{ from = ([char]0xC3 + [char]0xBB); to = "û" }
        @{ from = ([char]0xC3 + [char]0xBC); to = "ü" }
        @{ from = ([char]0xC3 + [char]0xB4); to = "ô" }
        @{ from = ([char]0xC3 + [char]0xB6); to = "ö" }
        @{ from = ([char]0xC3 + [char]0xA7); to = "ç" }
    )

    foreach ($p in $patterns) {
        $text = $text -replace [regex]::Escape($p.from), $p.to
    }

    return $text
}

# ============================================
#   CONFIGURATION DES DOSSIERS
# ============================================
$webPages = "C:\Users\Admin\forteresse\apps\web\pages"
$backendModules = "C:\Users\Admin\forteresse\apps\backend\src\modules"
$outputFile = "C:\Users\Admin\forteresse\code_complet_corrige.txt"

$extensions = "*.ts","*.tsx","*.js","*.jsx","*.json","*.md","*.html","*.css","*.scss"

"" | Out-File $outputFile -Encoding UTF8

# ============================================
#   EXTRACTION + CORRECTION
# ============================================
function Extract-And-Fix {
    param($path)

    Get-ChildItem -Path $path -Recurse -File -Include $extensions -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch "\\node_modules\\" -and
            $_.FullName -notmatch "\\\.pnpm\\" -and
            $_.FullName -notmatch "\\\.next\\" -and
            $_.FullName -notmatch "\\dist\\" -and
            $_.FullName -notmatch "\\build\\"
        } |
        ForEach-Object {
            try {
                Add-Content -Path $outputFile -Value "`n`n===== FICHIER : $($_.FullName) =====`n"

                $content = [System.IO.File]::ReadAllText($_.FullName)
                $fixed = Fix-Encoding $content

                Add-Content -Path $outputFile -Value $fixed
            } catch {
                Write-Host "Impossible de lire :" $_.FullName
            }
        }
}

Extract-And-Fix $webPages
Extract-And-Fix $backendModules

Write-Host "Extraction + correction terminée. Fichier généré : $outputFile"
