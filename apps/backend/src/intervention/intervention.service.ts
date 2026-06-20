import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InterventionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  // 1. Créer une intervention à partir d'un rendez-vous (La bascule)
  async createFromAppointment(appointmentId: string, dto: CreateInterventionDto) {
    // Vérification de l'existence du RDV
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { intervention: true }
    });

    if (!appointment) {
      throw new NotFoundException("Rendez-vous introuvable.");
    }

    // Sécurité : Empêcher de démarrer deux fois les travaux pour le même RDV
    if (appointment.intervention) {
      throw new BadRequestException("Une intervention est déjà en cours pour ce rendez-vous.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Création de l'intervention
      const intervention = await tx.intervention.create({
        data: {
          appointment_id: appointmentId,
          status: dto.status || 'diagnosing',
          diagnosis_text: dto.diagnosis_text
        }
      });

      // On marque le RDV comme "complété" (honoré)
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'completed' }
      });

      // Audit Log
      await this.audit.log({
        workspaceId: dto.workspaceId,
        entity: 'intervention',
        entityId: intervention.id,
        action: 'create_from_appointment',
        message: `Véhicule pris en charge à l'atelier. Intervention démarrée depuis le RDV #${appointmentId.substring(0,8)}`,
        metadata: { appointment_id: appointmentId }
      });

      return intervention;
    });
  }

  // 2. Lister les interventions en cours (Atelier)
  async findAll(workspaceId: string) {
    return this.prisma.intervention.findMany({
      where: {
        appointment: {
          vehicle: { workspaceId }
        }
      },
      include: {
        appointment: {
          include: {
            vehicle: { include: { client: true } }
          }
        },
        proforma: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 3. Récupérer le détail d'une intervention
  async findOne(id: string) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            vehicle: { include: { client: true } }
          }
        },
        proforma: {
          include: { lines: true }
        }
      }
    });

    if (!intervention) throw new NotFoundException("Intervention introuvable.");
    return intervention;
  }
}
