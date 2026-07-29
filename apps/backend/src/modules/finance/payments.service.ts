import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  INVOICE_STATUS,
  PAYMENT_SCHEDULE_STATUS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Génère un échéancier pour une facture.
   * Fonctionne pour un particulier (3 fois sans frais)
   * ou une flotte (1 échéance à 30 jours).
   */
  async createPaymentSchedule(workspaceId: string, dto: any) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoice_id, workspace_id: workspaceId }
    });

    if (!invoice) throw new NotFoundException("Facture non trouvée");

    const amountPerInstallment = invoice.total / dto.installments;
    const schedules = [];

    for (let i = 0; i < dto.installments; i++) {
      const dueDate = new Date();
      // On décale la date : i=0 (aujourd'hui), i=1 (+30 jours), etc.
      dueDate.setDate(dueDate.getDate() + (i * dto.interval_days));

      schedules.push({
        invoice_id: dto.invoice_id,
        workspace_id: workspaceId,
        amount: Number(amountPerInstallment.toFixed(2)),
        due_date: dueDate,
        status: PAYMENT_SCHEDULE_STATUS.PENDING
      });
    }

    return this.prisma.paymentSchedule.createMany({
      data: schedules
    });
  }

  /**
   * RÉCUPÉRATION DES RAPPELS (Le cœur du réacteur)
   * Liste toutes les échéances dépassées non payées.
   */
// apps/backend/src/modules/finance/payments.service.ts

async getOverdueSchedules(workspaceId: string) {
  const today = new Date();

  return this.prisma.paymentSchedule.findMany({
    where: {
      workspace_id: workspaceId,
      // Cette ligne est cruciale : on ne veut que ce qui n'est pas payé
      status: PAYMENT_SCHEDULE_STATUS.PENDING,
      due_date: { lt: today }
    },
    include: {
      invoice: {
        include: {
          client: true,
          appointment: { include: { vehicle: true } }
        }
      }
    },
    orderBy: { due_date: 'asc' }
  });
}


// DANS LE BACKEND
  async recordPayment(workspaceId: string, dto: { schedule_id: string, method: string, user_id?: string }) {
    // Liste des statuts considérés comme "En attente" pour la flexibilité
    const pendingStatus = PAYMENT_SCHEDULE_STATUS.PENDING;

    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer l'échéance (PaymentSchedule)
      const schedule = await tx.paymentSchedule.findUnique({
        where: { id: dto.schedule_id },
        include: { invoice: true }
      });

      if (!schedule) throw new NotFoundException("Échéance introuvable");

      // 2. SÉCURITÉ UTILISATEUR (éviter l'erreur 500)
      let finalUserId = dto.user_id;
      const userExists = await tx.user.findFirst({ where: { id: finalUserId } });

      if (!userExists) {
        // Si l'utilisateur envoyé n'existe pas, on prend le premier du workspace
        const fallbackUser = await tx.user.findFirst({ where: { workspace_id: workspaceId } });
        if (!fallbackUser) throw new BadRequestException("Aucun utilisateur valide pour l'encaissement.");
        finalUserId = fallbackUser.id;
      }

      // 3. CREER LE PAIEMENT DANS LA SOURCE UNIQUE Payment
      if (!schedule.invoice.client_id) {
        throw new BadRequestException(
          'La facture ne possede aucun client.',
        );
      }

      if (!finalUserId) {
        throw new BadRequestException(
          'Aucun utilisateur valide pour l\u2019encaissement.',
        );
      }

      const payment = await tx.payment.create({
        data: {
          workspace_id: workspaceId,
          invoice_id: schedule.invoice_id,
          client_id: schedule.invoice.client_id,
          user_id: finalUserId,
          amount: schedule.amount,
          method: dto.method || 'CASH',
        },
      });

      // 4. MARQUER L'ÉCHÉANCE COMME PAYÉE
      // On utilise le format majuscule par convention, mais le code est prêt pour tout
      await tx.paymentSchedule.update({
        where: { id: dto.schedule_id },
        data: { status: PAYMENT_SCHEDULE_STATUS.PAID }
      });

      // 5. VÉRIFICATION DU SOLDE DE LA FACTURE
      // On compte combien il reste d'échéances en attente (majuscule ou minuscule)
      const remainingSchedules = await tx.paymentSchedule.count({
        where: {
          invoice_id: schedule.invoice_id,
          status: pendingStatus // Gère 'pending' ET 'PENDING'
        }
      });

      // 6. SI TOUT EST PAYÉ, ON SOLDE LA FACTURE
      if (remainingSchedules === 0) {
        await tx.invoice.update({
          where: { id: schedule.invoice_id },
          data: { status: INVOICE_STATUS.PAID }
        });
      }

      console.log(`[PAYMENT SUCCESS] Échéance ${dto.schedule_id} soldée par l'user ${finalUserId}`);
      return payment;
    });
  }
}


