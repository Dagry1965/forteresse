import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (
      request.url.includes('/auth/')
      || request.url.includes('/public/')
    ) {
      return next.handle();
    }

    const workspaceId = request.headers['x-workspace-id'];

    const isInvalid =
      !workspaceId
      || workspaceId === 'undefined'
      || workspaceId === 'null'
      || workspaceId === '';

    if (isInvalid) {
      throw new UnauthorizedException(
        'Accès refusé : aucun garage identifié.',
      );
    }

    request.workspaceId = workspaceId;

    return next.handle();
  }
}
