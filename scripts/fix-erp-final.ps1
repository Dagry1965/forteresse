Write-Host "--- Stabilisation ERP ---" -ForegroundColor Cyan

# 1. Backend Fix
$main = ".\apps\backend\src\main.ts"
if (Test-Path $main) {
    $c = Get-Content $main -Raw
    if ($c -notmatch "setGlobalPrefix") {
        $c = $c -replace "async function bootstrap\(\) \{", "async function bootstrap() {`n  app.setGlobalPrefix('api');"
        $c | Set-Content $main -Encoding utf8
        Write-Host "OK: Backend prefix"
    }
}

# 2. Dashboard Fix
$dash = ".\apps\web\pages\dashboard.tsx"
if (Test-Path $dash) {
    $c = Get-Content $dash -Raw
    $c = $c -replace "/api/reports/", "/reports/"
    $c = $c -replace "/api/finance/", "/finance/"
    $c | Set-Content $dash -Encoding utf8
    Write-Host "OK: Dashboard URLs"
}

# 3. CSS Cleanup
Write-Host "Nettoyage CSS..."
$pages = Get-ChildItem -Path ".\apps\web\pages" -Filter "*.tsx" -Recurse
foreach ($p in $pages) {
    $c = Get-Content $p.FullName -Raw
    $new = $c -replace '<link rel="stylesheet".*?/>', ''
    if ($c -ne $new) {
        $new | Set-Content $p.FullName -Encoding utf8
        Write-Host "Nettoye: $($p.Name)"
    }
}

# 4. Global CSS
$app = ".\apps\web\pages\_app.tsx"
if (Test-Path $app) {
    $c = Get-Content $app -Raw
    if ($c -notmatch "theme.css") {
        $c = "import '../styles/theme.css';`n" + $c
        $c | Set-Content $app -Encoding utf8
        Write-Host "OK: CSS Global"
    }
}
Write-Host "--- Termine ---" -ForegroundColor Green