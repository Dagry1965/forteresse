import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() data: { 
    userId: string, 
    vehicleId: string, 
    scheduled_at: string, 
    initial_description: string 
  }) {
    return this.prisma.appointment.create({
      data: {
        user_id: data.userId,
        vehicle_id: data.vehicleId,
        scheduled_at: new Date(data.scheduled_at),
        initial_description: data.initial_description,
        status: 'requested',
      },
    });
  }

  @Get()
  findAll() {
    return this.prisma.appointment.findMany({
      include: { vehicle: true, user: true }
    });
  }
}
