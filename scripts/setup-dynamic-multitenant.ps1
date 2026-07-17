# ================================================
# setup-dynamic-multitenant.ps1 (Version Robuste)
# ================================================

Write-Host "--- Lancement du mode SaaS Dynamique ---" -ForegroundColor Cyan

# 1. BACKEND : Intercepteur
$dir = ".\apps\backend\src\core\common"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir }

$interceptorCode = @'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.url.includes('/auth/') || request.url.includes('/public/')) return next.handle();
    const workspaceId = request.headers['x-workspace-id'];
    if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
      throw new UnauthorizedException('Acces refuse : Aucun garage identifie.');
    }
    return next.handle();
  }
}
'@
$interceptorCode | Out-File -FilePath "$dir\workspace.interceptor.ts" -Encoding utf8

# 2. FRONTEND : API Utility (Version simple sans backticks pour eviter erreur PS)
$apiCode = @'
const API_BASE = "http://localhost:4000";
export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("current_workspace_id") : null;
  const headers = {
    "Content-Type": "application/json",
    "x-workspace-id": workspaceId || "",
    ...(token ? { "Authorization": "Bearer " + token } : {}),
    ...options.headers,
  };
  const url = API_BASE + (endpoint.startsWith("/") ? endpoint : "/" + endpoint);
  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return res;
  } catch (err) {
    console.error("Erreur reseau:", err);
    throw err;
  }
}
'@
$apiCode | Out-File -FilePath ".\apps\web\utils\api.ts" -Encoding utf8

# 3. FRONTEND : Nettoyage des Pages
Write-Host "Nettoyage des pages..." -ForegroundColor Yellow
$pages = Get-ChildItem -Path ".\apps\web\pages" -Filter "*.tsx" -Recurse
foreach ($page in $pages) {
    $content = Get-Content $page.FullName
    $newContent = $content | Where-Object { $_ -notmatch "const WORKSPACE_ID =" }
    $newContent | Set-Content $page.FullName -Encoding utf8
    Write-Host "  Nettoye : $($page.Name)"
}

Write-Host "--- Operation Terminee avec succes ---" -ForegroundColor Green
