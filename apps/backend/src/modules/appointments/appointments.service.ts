// Ajoutez ceci dans la classe AppointmentsService

import { PrismaService } from '../../../prisma/prisma.service'; // ajuster le chemin si nécessaire
import { Injectable, ConflictException, Logger } from '@nestjs/common';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ... autres méthodes existantes

  async createPublicAppointment(payload: any) {
    // Normalisations / protections minimales
    payload.publicOrigin = true;
    payload.status = 'PENDING';
    // s'assurer que scheduled_at est en Date ou string ISO
    if (payload.scheduled_at && typeof payload.scheduled_at !== 'string') {
      payload.scheduled_at = new Date(payload.scheduled_at).toISOString();
    }

    // Vérification basique de conflit : même vehicle_id et même créneau
    if (payload.vehicle_id) {
      const conflicting = await this.prisma.appointment.findFirst({
        where: {
          vehicle_id: payload.vehicle_id,
          scheduled_at: payload.scheduled_at,
          NOT: { status: 'CANCELLED' },
        },
      });
      if (conflicting) {
        throw new ConflictException('Un rendez-vous existe déjà pour ce véhicule à ce créneau.');
      }
    }

    // Persist
    const created = await this.prisma.appointment.create({
      data: payload,
    });

    this.logger.debug(`Created public appointment ${created.id}`);

    return created;
  }
}
