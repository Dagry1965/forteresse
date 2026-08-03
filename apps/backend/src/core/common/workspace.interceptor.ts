import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';

type WorkspaceRequest = Request & {
  workspaceId?: string;
};

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();

    if (
      request.url.includes('/auth/')
      || request.url.includes('/public/')
    ) {
      return next.handle();
    }

    const workspaceHeader = request.headers['x-workspace-id'];
    const workspaceId =
      typeof workspaceHeader === 'string'
        ? workspaceHeader
        : undefined;

    const isInvalid =
      !workspaceId
      || workspaceId === 'undefined'
      || workspaceId === 'null';

    if (isInvalid) {
      throw new UnauthorizedException(
        'Accès refusé : aucun garage identifié.',
      );
    }

    request.workspaceId = workspaceId;

    return next.handle();
  }
}
