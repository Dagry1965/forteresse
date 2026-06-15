import { Controller, Post, Body, Get, Query, Param, Patch, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() data: {
    user_id: string;
    vehicle_id: string;
    scheduled_at: string;
    initial_description?: string;
    status?: string;
  }) {
    if (!data.user_id || !data.vehicle_id || !data.scheduled_at) throw new BadRequestException('Données manquantes');
    return this.prisma.appointment.create({
      data: {
        user_id: data.user_id,
        vehicle_id: data.vehicle_id,
        scheduled_at: new Date(data.scheduled_at),
        initial_description: data.initial_description ?? '',
        status: data.status ?? 'requested',
      },
    });
  }

  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'confirmed' },
    });
  }

  @Get()
  async list(@Query('workspaceId') workspaceId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        ...(workspaceId ? { vehicle: { workspaceId } } : {}),
      },
      include: {
        vehicle: { include: { client: true } },
      },
    });
  }
}
