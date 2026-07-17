# ============================================
#   AUDIT COMPLET AGRINOVA (Next.js + NestJS)
# ============================================

$root = "C:\Users\Admin\forteresse"
$web = "$root\apps\web"
$backend = "$root\apps\backend"
$report = "$root\audit_agrinova.txt"

"" | Out-File $report -Encoding UTF8

function Write-Section($title) {
    Add-Content $report "`n===================="
    Add-Content $report " $title"
    Add-Content $report "====================`n"
}

# ============================================
#   1) Vérification des dossiers critiques
# ============================================
Write-Section "1) Vérification des dossiers"

$paths = @(
    "$web\pages",
    "$web\src",
    "$backend\src\modules",
    "$backend\src\main.ts"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Add-Content $report "[OK] $p"
    } else {
        Add-Content $report "[MANQUANT] $p"
    }
}

# ============================================
#   2) Analyse des modules NestJS
# ============================================
Write-Section "2) Analyse des modules NestJS"

$modules = Get-ChildItem "$backend\src\modules" -Directory -ErrorAction SilentlyContinue

foreach ($m in $modules) {
    Add-Content $report "`nModule : $($m.Name)"

    $files = Get-ChildItem $m.FullName -File -ErrorAction SilentlyContinue

    $hasController = $files.Name -match "controller"
    $hasService = $files.Name -match "service"
    $hasModule = $files.Name -match "module"

    if (-not $hasModule) { Add-Content $report "  [ERREUR] Pas de fichier module.ts" }
    if (-not $hasController) { Add-Content $report "  [AVERTISSEMENT] Pas de controller" }
    if (-not $hasService) { Add-Content $report "  [AVERTISSEMENT] Pas de service" }

    foreach ($f in $files) {
        try {
            if ((Get-Content $f.FullName -ErrorAction Stop).Length -lt 3) {
                Add-Content $report "  [VIDE] $($f.Name)"
            }
        } catch {
            Add-Content $report "  [ERREUR LECTURE] $($f.FullName)"
        }
    }
}

# ============================================
#   3) Analyse des pages Next.js
# ============================================
Write-Section "3) Analyse des pages Next.js"

$pages = Get-ChildItem "$web\pages" -Recurse -File -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue

foreach ($p in $pages) {
    try {
        $content = Get-Content $p.FullName -Raw -ErrorAction Stop

        if ($content -notmatch "export default") {
            Add-Content $report "[PAGE SANS EXPORT] $($p.FullName)"
        }

        if ($content -match "TODO|FIXME") {
            Add-Content $report "[TODO] $($p.FullName)"
        }
    } catch {
        Add-Content $report "[ERREUR LECTURE] $($p.FullName)"
    }
}

# ============================================
#   4) Détection des imports cassés
# ============================================
Write-Section "4) Imports cassés"

# IMPORTANT : on exclut node_modules et .pnpm
$tsFiles = Get-ChildItem $root -Recurse -File -Include *.ts,*.tsx -ErrorAction SilentlyContinue |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\\.pnpm\\"
    }

foreach ($f in $tsFiles) {
    try {
        $content = Get-Content $f.FullName -Raw -ErrorAction Stop
    } catch {
        Add-Content $report "[ERREUR LECTURE] $($f.FullName)"
        continue
    }

    $imports = Select-String -InputObject $content -Pattern "from\s+['""](.+)['""]"

    foreach ($i in $imports) {
        $path = $i.Matches.Groups[1].Value

        if ($path.StartsWith(".")) {
            $resolved = Resolve-Path -Path (Join-Path $f.DirectoryName "$path.ts") -ErrorAction SilentlyContinue
            if (-not $resolved) {
                Add-Content $report "[IMPORT CASSÉ] $($f.FullName) → $path"
            }
        }
    }
}

# ============================================
#   5) Détection des fichiers trop lourds
# ============================================
Write-Section "5) Fichiers trop lourds"

$bigFiles = Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 200KB }

foreach ($b in $bigFiles) {
    Add-Content $report "[GROS FICHIER] $($b.FullName) - $([math]::Round($b.Length/1KB)) KB"
}

# ============================================
#   6) Résumé final
# ============================================
Write-Section "6) Résumé"

Add-Content $report "Audit terminé."
Add-Content $report "Rapport généré : $report"

Write-Host "Audit terminé. Rapport généré : $report"
