import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
 const req = ctx.switchToHttp().getRequest();
 const user = req.user;
 const headerWs = req.headers['x-workspace-id'] || req.body?.workspaceId || req.query?.workspaceId;
 if (!user) return false;
 if (!headerWs) return true;
 return String(headerWs) === String(user.workspace);
  }
}