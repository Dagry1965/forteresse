import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() data: { vin: string, plateNumber: string, make: string, model: string, clientId: string, workspaceId: string }) {
    return this.prisma.vehicle.create({ data });
  }

  @Get()
  findByClient(@Query('clientId') clientId: string) {
    return this.prisma.vehicle.findMany({ where: { clientId } });
  }
}
