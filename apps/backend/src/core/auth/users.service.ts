import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, dto: CreateUserDto) {
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

      return tx.user.findUnique({
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
    });

    if (!result) {
      throw new NotFoundException(
        'Utilisateur introuvable dans ce workspace.',
      );
    }

    return result;
  }

  async restore(workspaceId: string, id: string) {
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

    return this.findOne(id, workspaceId);
  }

  async remove(workspaceId: string, id: string) {
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

    return this.findOne(id, workspaceId);
  }
}
