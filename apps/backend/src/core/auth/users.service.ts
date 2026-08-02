import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    workspaceId: string,
    dto: CreateUserDto,
    actorUserId: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email déjà utilisé.');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BadRequestException('Garage introuvable.');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          name: dto.name,
          workspace_id: workspaceId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          user_id: user.id,
          workspace_id: workspaceId,
          role: dto.role,
        },
      });

      await this.auditService.log(
        {
          action: 'USER_CREATED',
          entity: 'User',
          entityId: user.id,
          workspaceId,
          userId: actorUserId,
          newData: {
            email: user.email,
            name: user.name,
            role: dto.role,
          },
        },
        tx,
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace_id: user.workspace_id,
        role: dto.role,
        created_at: user.created_at,
      };
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.user.findMany({
      where: {
        workspace_id: workspaceId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        workspace_id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        workspaceMembers: {
          select: {
            id: true,
            role: true,
            workspace_id: true,
          },
        },
      },
    });
  }

  async findOne(id: string, workspaceId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        workspace_id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        workspaceMembers: {
          select: {
            id: true,
            role: true,
            workspace_id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateUserDto,
    actorUserId: string,
  ) {
    const data: Record<string, unknown> = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.password) {
      data.password = await argon2.hash(dto.password);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.workspaceMember.findFirst({
        where: {
          user_id: id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (!membership) {
        throw new NotFoundException(
          'Utilisateur introuvable dans ce workspace.',
        );
      }

      if (Object.keys(data).length > 0) {
        await tx.user.update({
          where: { id },
          data,
        });
      }

      if (dto.role !== undefined) {
        await tx.workspaceMember.update({
          where: { id: membership.id },
          data: { role: dto.role },
        });
      }

      const updatedUser = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          workspace_id: true,
          updated_at: true,
          workspaceMembers: {
            where: {
              workspace_id: workspaceId,
              deleted_at: null,
            },
            select: {
              id: true,
              role: true,
              workspace_id: true,
            },
          },
        },
      });

      await this.auditService.log(
        {
          action: dto.role !== undefined
            ? 'USER_ROLE_UPDATED'
            : 'USER_UPDATED',
          entity: 'User',
          entityId: id,
          workspaceId,
          userId: actorUserId,
          oldData: {
            email: membership.user.email,
            name: membership.user.name,
            role: membership.role,
          },
          newData: {
            email: updatedUser?.email,
            name: updatedUser?.name,
            role: updatedUser?.workspaceMembers[0]?.role,
            passwordChanged: Boolean(dto.password),
          },
        },
        tx,
      );

      return updatedUser;
    });

    if (!result) {
      throw new NotFoundException(
        'Utilisateur introuvable dans ce workspace.',
      );
    }

    return result;
  }

  async restore(
    workspaceId: string,
    id: string,
    actorUserId: string,
  ) {
    const result = await this.prisma.user.updateMany({
      where: {
        id,
        workspace_id: workspaceId,
      },
      data: {
        deleted_at: null,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Utilisateur introuvable dans ce workspace.',
      );
    }

    const restoredUser = await this.findOne(id, workspaceId);

    await this.auditService.log({
      action: 'USER_RESTORED',
      entity: 'User',
      entityId: id,
      workspaceId,
      userId: actorUserId,
      newData: {
        email: restoredUser.email,
        name: restoredUser.name,
        deletedAt: restoredUser.deleted_at,
      },
    });

    return restoredUser;
  }

  async remove(
    workspaceId: string,
    id: string,
    actorUserId: string,
  ) {
    const result = await this.prisma.user.updateMany({
      where: {
        id,
        workspace_id: workspaceId,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Utilisateur introuvable dans ce workspace.',
      );
    }

    const removedUser = await this.findOne(id, workspaceId);

    await this.auditService.log({
      action: 'USER_REMOVED',
      entity: 'User',
      entityId: id,
      workspaceId,
      userId: actorUserId,
      newData: {
        email: removedUser.email,
        name: removedUser.name,
        deletedAt: removedUser.deleted_at,
      },
    });

    return removedUser;
  }
}
