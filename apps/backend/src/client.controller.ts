import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('clients')
export class ClientController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() data: { name: string, email: string, phone: string, workspaceId: string }) {
    return this.prisma.client.create({ data });
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.prisma.client.findMany({ where: { workspaceId }, include: { vehicles: true } });
  }
}
