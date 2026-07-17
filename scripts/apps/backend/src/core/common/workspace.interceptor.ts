import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Routes publiques exemptées
    if (request.url.includes('/auth/') || request.url.includes('/public/')) {
      return next.handle();
    }

    const workspaceId = request.headers['x-workspace-id'] || request.query.workspaceId;

    if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
      throw new UnauthorizedException('Accès refusé : Identifiant de garage manquant.');
    }

    // On injecte l'ID propre dans la requête
    request.workspaceId = workspaceId;

    return next.handle();
  }
}
