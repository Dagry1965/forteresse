import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE USER
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email déjà utilisé.');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        workspace: { connect: { id: dto.workspace_id } },
      },
    });
  }

  // FIND ALL
  async findAll(workspaceId?: string) {
    return this.prisma.user.findMany({
      where: workspaceId ? { workspace_id: workspaceId } : undefined,
    });
  }

  // FIND ONE
  async findOne(id: string, workspaceId: string) {
    return this.prisma.user.findFirst({
      where: { id, workspace_id: workspaceId },
    });
  }

  // UPDATE
  async update(id: string, dto: UpdateUserDto) {
    const data: any = { ...dto };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // DELETE
  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
