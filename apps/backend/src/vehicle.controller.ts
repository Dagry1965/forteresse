import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() data: {
    workspaceId: string;
    clientId: string;
    vin?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
  }) {
    if (!data.workspaceId || !data.clientId) throw new BadRequestException('workspaceId et clientId requis');
    return this.prisma.vehicle.create({ data });
  }

  @Get()
  async list(@Query('clientId') clientId?: string, @Query('workspaceId') workspaceId?: string) {
    return this.prisma.vehicle.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(workspaceId ? { workspaceId } : {}),
      },
    });
  }
}
