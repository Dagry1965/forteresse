import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.headers['x-workspace-id'];

    if (!user) {
      throw new UnauthorizedException(
        'Utilisateur non authentifié.',
      );
    }

    if (
      !workspaceId
      || workspaceId === 'null'
      || workspaceId === 'undefined'
      || workspaceId === ''
    ) {
      throw new UnauthorizedException(
        'Aucun garage identifié.',
      );
    }

    if (
      !user.workspaceId
      || String(workspaceId) !== String(user.workspaceId)
    ) {
      throw new UnauthorizedException(
        'Accès refusé : ce garage ne vous appartient pas.',
      );
    }

    request.workspaceId = workspaceId;

    return true;
  }
}
