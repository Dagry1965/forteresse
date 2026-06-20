import { Controller, Post, Body, Get, Query, Param, Put, Delete, Patch } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateAppointmentDto } from './appointment/dto/create-appointment.dto';

@Controller('api/appointments')
export class AppointmentController {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un rendez-vous (Sécurisé par DTO)
  @Post()
  async create(@Body() data: CreateAppointmentDto) {
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

  // 2. Lister les rendez-vous (avec véhicule et client)
  @Get()
  async list(@Query('workspaceId') workspaceId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        ...(workspaceId ? { vehicle: { workspaceId } } : {}),
      },
      include: {
        vehicle: { include: { client: true } },
      },
      orderBy: { scheduled_at: 'desc' },
    });
  }

  // 3. Récupérer un rendez-vous spécifique
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        vehicle: { include: { client: true } },
      },
    });
  }

  // 4. Modifier un rendez-vous
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<CreateAppointmentDto>) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...data,
        // Si scheduled_at est fourni, on le convertit en Date
        ...(data.scheduled_at && { scheduled_at: new Date(data.scheduled_at) }),
      },
    });
  }

  // 5. Supprimer un rendez-vous
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.appointment.delete({
      where: { id }
    });
  }

  // 6. Confirmer un rendez-vous (Patch)
  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'confirmed' },
    });
  }
}
