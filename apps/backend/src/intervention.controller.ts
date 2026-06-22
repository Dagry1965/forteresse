import { Controller, Post, Body, Get, Param, Patch, Query, Put, Delete, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateInterventionDto } from './intervention/dto/create-intervention.dto';

@Controller('api/interventions')
export class InterventionController {
  constructor(private prisma: PrismaService) {}

  // 1. Lister toutes les interventions (avec relations)
  @Get()
  async list() {
    return this.prisma.intervention.findMany({
      include: {
        appointment: {
          include: {
            vehicle: { include: { client: true } },
          },
        },
        proforma: true,
      },
      orderBy: { id: 'desc' } // ✅ Correction minimale : champ garanti existant
    });
  }

  // 2. Créer une intervention depuis un rendez-vous (Sécurisé par DTO)
  @Post('from-appointment/:appointmentId')
  async createFromAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() data: Partial<CreateInterventionDto>
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new BadRequestException('RDV introuvable');

    return this.prisma.intervention.create({
      data: {
        appointment_id: appointmentId,
        status: data.status || 'diagnosing',
        diagnosis_text: data.diagnosis_text,
      },
    });
  }

  // 3. Créer une intervention (générique)
  @Post()
  async create(@Body() data: CreateInterventionDto) {
    return this.prisma.intervention.create({ data });
  }

  // 4. Récupérer une intervention spécifique
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.intervention.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            vehicle: { include: { client: true } },
          },
        },
        proforma: true,
      },
    });
  }

  // 5. Mettre à jour une intervention
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<CreateInterventionDto>) {
    return this.prisma.intervention.update({
      where: { id },
      data,
    });
  }

  // 6. Mettre à jour le diagnostic
  @Patch(':id/diagnosis')
  async updateDiagnosis(@Param('id') id: string, @Body() data: { diagnosis_text: string }) {
    return this.prisma.intervention.update({
      where: { id },
      data: {
        diagnosis_text: data.diagnosis_text,
        status: 'awaiting_approval',
      },
    });
  }

  // 7. Supprimer une intervention
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.intervention.delete({
      where: { id }
    });
  }
}
