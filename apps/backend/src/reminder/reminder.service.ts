import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule'; // Pour planifier la tâche

// Définition du type de tâche pour une meilleure clarté
export interface SendReminderJob {
  invoiceId: string;
  recipientEmail: string;
  reminderCount: number;
}

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectQueue('invoice-reminders') private readonly reminderQueue: Queue<SendReminderJob>,
    private readonly prisma: PrismaService,
  ) {}

  // Cette méthode s'exécutera tous les jours à minuit pour vérifier les factures
 // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    this.logger.log('Vérification des factures en retard pour envoi de rappels...');
    const now = new Date();

    // Trouver les factures impayées dont la date d'échéance est passée
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: 'unpaid',
        due_date: { lt: now }, // date d'échéance inférieure à maintenant
        OR: [
            { lastReminderSentAt: null }, // Jamais de rappel envoyé
            // Ou le dernier rappel a été envoyé il y a plus de 24h (exemple)
            { lastReminderSentAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } 
        ]
      },
      include: {
        proforma: {
          include: {
            intervention: {
              include: {
                appointment: {
                  include: {
                    vehicle: {
                      include: { client: true } // Pour récupérer l'email du client
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    for (const invoice of overdueInvoices) {
      const recipientEmail = invoice.proforma.intervention.appointment.vehicle.client.email;
      
      if (!recipientEmail) {
        this.logger.warn(`Pas d'email pour la facture ${invoice.id}. Rappel non envoyé.`);
        continue;
      }

      const jobData: SendReminderJob = {
        invoiceId: invoice.id,
        recipientEmail: recipientEmail,
        reminderCount: invoice.reminderCount + 1,
      };

      await this.reminderQueue.add('send-reminder', jobData, {
        attempts: 3, // Réessayer 3 fois en cas d'échec
        backoff: { type: 'exponential', delay: 1000 }, // Délai exponentiel entre les tentatives
      });
      this.logger.log(`Tâche de rappel ajoutée pour la facture ${invoice.id} (${recipientEmail}).`);
    }
  }

  // Cette méthode sera appelée par le processeur pour marquer le rappel envoyé
  async markReminderSent(invoiceId: string, reminderCount: number) {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        lastReminderSentAt: new Date(),
        reminderCount: reminderCount,
        // Optionnel: changer le statut en 'overdue-reminded' ou similaire
      },
    });
    this.logger.log(`Rappel marqué comme envoyé pour la facture ${invoiceId}.`);
  }
}
