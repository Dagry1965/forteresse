import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('clients')
export class ClientController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() data: { workspaceId: string; name: string; email?: string; phone?: string }) {
    if (!data.workspaceId || !data.name) throw new BadRequestException('workspaceId et name requis');
    return this.prisma.client.create({ data });
  }

  @Get()
  async list() {
    return this.prisma.client.findMany();
  }

  @Get('by-workspace/:workspaceId')
  async byWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.prisma.client.findMany({ where: { workspaceId } });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.prisma.client.findUnique({ where: { id } });
  }
}
