import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class WorkshopService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(data: any) {
    return this.prisma.appointment.create({ data });
  }

  async findAllAppointments(workspaceId: string) {
    return this.prisma.appointment.findMany({
      where: { vehicle: { workspaceId } },
      include: { vehicle: { include: { client: true } }, intervention: true },
      orderBy: { scheduled_at: 'desc' }
    });
  }

  async startIntervention(appointmentId: string) {
    return this.prisma.intervention.create({
      data: {
        appointment_id: appointmentId,
        status: 'IN_PROGRESS'
      }
    });
  }

  async updateDiagnosis(id: string, diagnosis: string) {
    return this.prisma.intervention.update({
      where: { id },
      data: { diagnosis_text: diagnosis, status: 'DIAGNOSIS_DONE' }
    });
  }
}
