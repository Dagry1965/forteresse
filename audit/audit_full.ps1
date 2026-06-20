# audit_full.ps1
# Usage: Open PowerShell at repo root (C:\Users\Admin\forteresse) and run:
#   .\audit_full.ps1
# Produces: ./audit-output/ (detailed) and ./audit_result.txt (summary)

$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$outDir = Join-Path $root 'audit-output'
if (-Not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$summaryPath = Join-Path $root 'audit_result.txt'
Remove-Item -Force -ErrorAction SilentlyContinue $summaryPath
"Forteresse ERP - Automated Audit" | Out-File $summaryPath

function log {
  param($title, $content)
  "`n=== $title ===`n" | Out-File $summaryPath -Append
  $content | Out-File $summaryPath -Append
}

function runAndSave {
  param($name, $scriptBlock)
  $file = Join-Path $outDir ("$name.txt")
  "& $name -> $file" | Out-File $summaryPath -Append
  try {
    & $scriptBlock *>&1 | Tee-Object -FilePath $file
  } catch {
    $_ | Out-File -FilePath $file -Append
  }
}

# 1) Ports / basic HTTP
log "System Info" ("OS: " + (Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty Caption) + " | PSVersion: " + $PSVersionTable.PSVersion.ToString())
runAndSave "netstat_4000" { netstat -ano | Select-String ":4000" }
runAndSave "netstat_3000" { netstat -ano | Select-String ":3000" }
runAndSave "netstat_6379" { netstat -ano | Select-String ":6379" }

# HTTP checks
function httpCheck($url) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5 -ErrorAction Stop
    return "$($r.StatusCode) $($r.StatusDescription)"
  } catch {
    return $_.Exception.Message
  }
}
log "HTTP Checks" ("backend 4000: " + (httpCheck "http://localhost:4000/"))
log "HTTP Checks" ("frontend 3000: " + (httpCheck "http://localhost:3000/"))

# 2) Env files
$envPaths = @(".\apps\backend\.env", ".\.env", ".env.local", ".\apps\web\.env.local")
foreach ($p in $envPaths) {
  if (Test-Path $p) { runAndSave ("env_" + ($p -replace '[\\:\.]','_')) { Get-Content $p -ErrorAction SilentlyContinue } } else { ("Missing: $p") | Out-File $summaryPath -Append }
}

# 3) Prisma schema & migrations
runAndSave "find_schema" { Get-ChildItem -Recurse -Filter schema.prisma | Select-Object FullName }
# show top of backend schema if exists
$backendSchema = Join-Path $root 'apps\backend\prisma\schema.prisma'
if (Test-Path $backendSchema) {
  runAndSave "backend_schema_head" { Get-Content $backendSchema -TotalCount 60 }
} else {
  "No apps/backend schema.prisma found at $backendSchema" | Out-File $summaryPath -Append
}
# prisma status and db pull (may error)
runAndSave "prisma_migrate_status" { npx prisma migrate status --schema="./apps/backend/prisma/schema.prisma" }
runAndSave "prisma_db_pull_print" { npx prisma db pull --schema="./apps/backend/prisma/schema.prisma" --print }

# 4) List sqlite tables via node raw and via sqlite3 if present
runAndSave "sqlite_master" { node -e "try{const {PrismaClient}=require('./node_modules/.prisma/client');const p=new PrismaClient();p.$queryRaw\`SELECT name FROM sqlite_master WHERE type='table';\`.then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error('ERR',e.message);process.exit(1)} )}catch(e){console.error('NODE_ERR',e.message)}" }
if (Get-Command sqlite3 -ErrorAction SilentlyContinue) { runAndSave "sqlite3_tables" { sqlite3 .\apps\backend\prisma\dev.db ".tables" } } else { "sqlite3 CLI not found" | Out-File $summaryPath -Append }

# 5) Prisma Studio hint
log "Prisma Studio" ("Run: npx prisma studio --schema=""./apps/backend/prisma/schema.prisma"" (interactive)")

# 6) Redis & bullmq
runAndSave "test_redis_6379" { Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 }
# check package.json for bullmq
$pkgPath = Join-Path $root "package.json"
if (Test-Path $pkgPath) {
  $pkg = Get-Content $pkgPath -Raw
  if ($pkg -match '"bullmq"') { "bullmq present in root package.json" | Out-File $summaryPath -Append } else { "bullmq not found in root package.json (check app-specific package.json files)" | Out-File $summaryPath -Append }
  runAndSave "root_package_head" { Get-Content $pkgPath -TotalCount 200 }
} else {
  "No root package.json" | Out-File $summaryPath -Append
}

# 7) Search backend for key services (PurchaseOrder etc.)
$backendTs = Join-Path $root 'apps\backend'
if (Test-Path $backendTs) {
  runAndSave "search_backend_services" { Select-String -Path "$backendTs\**\*.ts" -Pattern "PurchaseOrder|PurchaseReceipt|StockMovement|Inventory|supplier" -List | Select-Object Path,LineNumber -First 200 }
  runAndSave "search_backend_auth" { Select-String -Path "$backendTs\**\*.ts" -Pattern "auth|login|refresh|JwtAuthGuard|RolesGuard|WorkspaceGuard" -List | Select-Object Path,LineNumber -First 200 }
} else {
  "apps/backend not found" | Out-File $summaryPath -Append
}

# 8) Test key API endpoints (adjust prefix /api if needed)
$ws = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971"
function tryApi($path) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $path -Method GET -Headers @{'x-workspace-id'=$ws} -TimeoutSec 5 -ErrorAction Stop
    return "$($r.StatusCode)"
  } catch {
    return $_.Exception.Message
  }
}
log "API Tests" ("GET /api/purchase-orders : " + (tryApi "http://localhost:4000/api/purchase-orders"))
log "API Tests" ("GET /api/purchase-receipts: " + (tryApi "http://localhost:4000/api/purchase-receipts"))
log "API Tests" ("GET /api/suppliers: " + (tryApi "http://localhost:4000/api/suppliers"))
log "API Tests" ("GET /api/inventory: " + (tryApi "http://localhost:4000/api/inventory"))
log "API Tests" ("OPTIONS /auth/login: " + (tryApi "http://localhost:4000/auth/login"))

# 9) Front pages existence
$webRoot = Join-Path $root 'apps\web'
$pathsToCheck = @(
  '.\apps\web\pages\cashier.tsx',
  '.\apps\web\pages\suppliers\index.tsx',
  '.\apps\web\pages\purchase-orders\index.tsx',
  '.\apps\web\pages\purchase-receipts\index.tsx'
)
foreach ($p in $pathsToCheck) {
  $exists = Test-Path (Join-Path $root $p)
  ("File: $p exists: $exists") | Out-File $summaryPath -Append
}

# 10) Seeds & tests
foreach ($candidate in @('.\prisma\seed.ts', '.\apps\backend\prisma\seed.ts', '.\prisma\seed.js', '.\apps\backend\prisma\seed.js')) {
  ("Seed candidate: $candidate exists: " + (Test-Path (Join-Path $root $candidate))) | Out-File $summaryPath -Append
}
runAndSave "find_tests" { Get-ChildItem -Recurse -Include "*spec.ts","*e2e*.ts" | Select-Object FullName -First 200 }

# 11) Lint / Typecheck
runAndSave "eslint_check" { npx eslint . --ext .ts,.tsx --no-error-on-unmatched-pattern } 
runAndSave "tsc_check" { npx tsc --noEmit }

# Final note & summary path
"`nAudit finished. Detailed output files in: $outDir`nSummary: $summaryPath" | Out-File $summaryPath -Append
Write-Host "Audit finished. See $summaryPath and $outDir for details."
