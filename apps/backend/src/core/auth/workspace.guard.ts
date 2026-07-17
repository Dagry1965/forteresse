import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    
    // On récupère le garage partout où il peut être
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;

    // 1. Si aucun garage n'est fourni, on bloque toujours (Sécurité de base)
    if (!workspaceId || workspaceId === 'null' || workspaceId === 'undefined') {
      throw new UnauthorizedException("Aucun garage identifié.");
    }

    // 2. Si l'utilisateur est connecté (JWT valide), on vérifie qu'il est dans son garage
    if (user) {
      const userWsId = user.workspace_id || user.workspaceId;
      if (String(workspaceId) !== String(userWsId)) {
        throw new UnauthorizedException("Accès refusé : Ce garage ne vous appartient pas.");
      }
    }

    // 3. Si pas de user (mode dev ou test), on laisse passer car le workspaceId est valide
    return true;
  }
}
