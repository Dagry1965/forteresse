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

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email déjà utilisé.');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: dto.workspace_id },
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
          workspace_id: dto.workspace_id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          user_id: user.id,
          workspace_id: dto.workspace_id,
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

  async findAll(workspaceId?: string) {
    return this.prisma.user.findMany({
      where: workspaceId ? { workspace_id: workspaceId } : undefined,
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

  async update(id: string, dto: UpdateUserDto) {
    const data: Record<string, unknown> = { ...dto };

    if (dto.password) {
      data.password = await argon2.hash(dto.password);
    }

    delete data.role;

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      workspace_id: user.workspace_id,
      updated_at: user.updated_at,
    };
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.deleteMany({
        where: { user_id: id },
      });

      return tx.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });
  }
}
