import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Put,
  Delete,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreatePublicAppointmentDto } from './appointments/dto/create-appointment.dto';

@Controller('api/appointments')
export class AppointmentController {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un rendez-vous
  @Post()
  async create(@Body() data: CreatePublicAppointmentDto) {
    if (!data.user_id) {
      throw new BadRequestException('user_id est obligatoire');
    }

    if (!data.vehicle_id) {
      throw new BadRequestException('vehicle_id est obligatoire');
    }

    return this.prisma.appointment.create({
      data: {
        user_id: data.user_id,
        vehicle_id: data.vehicle_id,
        scheduled_at: new Date(data.scheduled_at),
        initial_description: data.initial_description ?? '',
        status: data.status ?? 'requested',
        publicOrigin: false,
      },
    });
  }

  // 2. Lister les rendez-vous avec véhicule et client
  @Get()
  async list(@Query('workspaceId') workspaceId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        ...(workspaceId ? { vehicle: { workspaceId } } : {}),
      },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        scheduled_at: 'desc',
      },
    });
  }

  // 3. Récupérer un rendez-vous spécifique
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  // 4. Modifier un rendez-vous
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CreatePublicAppointmentDto>,
  ) {
    const { scheduled_at, vehicle_id, user_id, ...rest } = data;

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...rest,
        ...(user_id ? { user_id } : {}),
        ...(vehicle_id ? { vehicle_id } : {}),
        ...(scheduled_at ? { scheduled_at: new Date(scheduled_at) } : {}),
      },
    });
  }

  // 5. Supprimer un rendez-vous
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  // 6. Confirmer un rendez-vous
  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'confirmed',
      },
    });
  }
}