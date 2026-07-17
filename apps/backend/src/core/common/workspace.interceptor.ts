import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler, 
  UnauthorizedException 
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 1. On laisse passer les routes publiques ou d'authentification
    if (request.url.includes('/auth/') || request.url.includes('/public/')) {
      return next.handle();
    }

    // 2. RÉCUPÉRATION FLEXIBLE : Header OU URL (query) OU Body
    const workspaceId = 
      request.headers['x-workspace-id'] || 
      request.query.workspaceId || 
      request.body?.workspaceId;

    // 3. VÉRIFICATION
    const isInvalid = !workspaceId || 
                      workspaceId === 'undefined' || 
                      workspaceId === 'null' || 
                      workspaceId === '';

    if (isInvalid) {
      // J'ai laissé le ".2" pour que tu puisses vérifier que c'est bien ce fichier qui répond
      throw new UnauthorizedException('Acces refuse : Aucun garage identifie.2');
    }

    // 4. On injecte l'ID dans la requête pour que les contrôleurs puissent l'utiliser
    request.workspaceId = workspaceId;

    return next.handle();
  }
}
