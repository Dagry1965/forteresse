import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('interventions')
export class InterventionController {
  constructor(private prisma: PrismaService) {}

  @Post('from-appointment/:appointmentId')
  async createFromAppointment(@Param('appointmentId') appointmentId: string) {
    return this.prisma.intervention.create({
      data: {
        appointment_id: appointmentId,
        status: 'diagnosing',
      },
    });
  }

  @Patch(':id/diagnosis')
  async updateDiagnosis(@Param('id') id: string, @Body() data: { diagnosis_text: string }) {
    return this.prisma.intervention.update({
      where: { id },
      data: { 
        diagnosis_text: data.diagnosis_text,
        status: 'awaiting_approval'
      },
    });
  }
}
