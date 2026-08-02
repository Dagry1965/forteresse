import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceHeader = request.headers['x-workspace-id'];

    if (!user?.userId && !user?.id) {
      throw new UnauthorizedException(
        'Utilisateur non authentifi\u00e9.',
      );
    }

    const workspaceId = Array.isArray(workspaceHeader)
      ? workspaceHeader[0]
      : workspaceHeader;

    if (
      !workspaceId
      || workspaceId === 'null'
      || workspaceId === 'undefined'
    ) {
      throw new UnauthorizedException(
        'Aucun garage identifi\u00e9.',
      );
    }

    const userId = String(user.userId ?? user.id);

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        user_id: userId,
        workspace_id: String(workspaceId),
        deleted_at: null,
        user: {
          deleted_at: null,
        },
      },
      select: {
        id: true,
        role: true,
        workspace_id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Acc\u00e8s refus\u00e9 : vous ne faites pas partie de ce garage.',
      );
    }

    request.workspaceId = membership.workspace_id;
    request.membership = membership;
    request.user = {
      ...user,
      id: userId,
      userId,
      workspaceId: membership.workspace_id,
      role: membership.role,
      membershipId: membership.id,
    };

    return true;
  }
}
