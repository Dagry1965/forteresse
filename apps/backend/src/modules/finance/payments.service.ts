import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * GÃ©nÃ¨re un Ã©chÃ©ancier pour une facture.
   * Fonctionne pour un particulier (3 fois sans frais) 
   * ou une flotte (1 Ã©chÃ©ance Ã  30 jours).
   */
  async createPaymentSchedule(workspaceId: string, dto: any) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoice_id, workspace_id: workspaceId }
    });

    if (!invoice) throw new NotFoundException("Facture non trouvÃ©e");

    const amountPerInstallment = invoice.total / dto.installments;
    const schedules = [];

    for (let i = 0; i < dto.installments; i++) {
      const dueDate = new Date();
      // On dÃ©cale la date : i=0 (aujourd'hui), i=1 (+30 jours), etc.
      dueDate.setDate(dueDate.getDate() + (i * dto.interval_days));

      schedules.push({
        invoice_id: dto.invoice_id,
        workspace_id: workspaceId,
        amount: Number(amountPerInstallment.toFixed(2)),
        due_date: dueDate,
        status: 'PENDING'
      });
    }

    return this.prisma.paymentSchedule.createMany({
      data: schedules
    });
  }

  /**
   * RÃ‰CUPÃ‰RATION DES RAPPELS (Le coeur du rÃ©acteur)
   * Liste toutes les Ã©chÃ©ances dÃ©passÃ©es non payÃ©es.
   */
// apps/backend/src/modules/finance/payments.service.ts

async getOverdueSchedules(workspaceId: string) {
  const today = new Date();

  return this.prisma.paymentSchedule.findMany({
    where: {
      workspace_id: workspaceId,
      // â¬‡ï¸ CETTE LIGNE EST CRUCIALE : On ne veut QUE ce qui n'est pas payÃ©
      status: { in: ['pending', 'PENDING'] }, 
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
    // Liste des statuts considÃ©rÃ©s comme "En attente" pour la flexibilitÃ©
    const pendingStatuses = ['pending', 'PENDING'];

    return this.prisma.$transaction(async (tx) => {
      // 1. RÃ©cupÃ©rer l'Ã©chÃ©ance (PaymentSchedule)
      const schedule = await tx.paymentSchedule.findUnique({
        where: { id: dto.schedule_id },
        include: { invoice: true }
      });

      if (!schedule) throw new NotFoundException("Ã‰chÃ©ance introuvable");

      // 2. SÃ‰CURITÃ‰ UTILISATEUR (Ã‰viter l'erreur 500)
      let finalUserId = dto.user_id;
      const userExists = await tx.user.findFirst({ where: { id: finalUserId } });

      if (!userExists) {
        // Si l'utilisateur envoyÃ© n'existe pas, on prend le premier du workspace
        const fallbackUser = await tx.user.findFirst({ where: { workspace_id: workspaceId } });
        if (!fallbackUser) throw new BadRequestException("Aucun utilisateur valide pour l'encaissement.");
        finalUserId = fallbackUser.id;
      }

      // 3. CRÃ‰ER LE PAIEMENT (InvoicePayment)
      const payment = await tx.invoicePayment.create({
        data: {
          invoice_id: schedule.invoice_id,
          amount: schedule.amount,
          method: dto.method || 'CASH',
          user_id: finalUserId,
          paid_at: new Date()
        }
      });

      // 4. MARQUER L'Ã‰CHÃ‰ANCE COMME PAYÃ‰E
      // On utilise le format majuscule par convention, mais le code est prÃªt pour tout
      await tx.paymentSchedule.update({
        where: { id: dto.schedule_id },
        data: { status: 'PAID' }
      });

      // 5. VÃ‰RIFICATION DU SOLDE DE LA FACTURE
      // On compte combien il reste d'Ã©chÃ©ances en attente (Maj ou Min)
      const remainingSchedules = await tx.paymentSchedule.count({
        where: { 
          invoice_id: schedule.invoice_id, 
          status: { in: pendingStatuses } // GÃ¨re 'pending' ET 'PENDING'
        }
      });

      // 6. SI TOUT EST PAYÃ‰, ON SOLDE LA FACTURE
      if (remainingSchedules === 0) {
        await tx.invoice.update({
          where: { id: schedule.invoice_id },
          data: { status: 'PAID' }
        });
      }

      console.log(`[PAYMENT SUCCESS] Ã‰chÃ©ance ${dto.schedule_id} soldÃ©e par l'user ${finalUserId}`);
      return payment;
    });
  }
}


