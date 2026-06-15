import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ReminderService, SendReminderJob } from './reminder.service'; // Importer le service
import { PrismaService } from '../prisma/prisma.service'; // Importer PrismaService

@Processor('invoice-reminders') // Associer à la file 'invoice-reminders'
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly reminderService: ReminderService,
    private readonly prisma: PrismaService, // Injecter PrismaService ici
  ) {
    super();
  }

  async process(job: Job<SendReminderJob>): Promise<any> {
    this.logger.log(`Traitement de la tâche de rappel ${job.id} pour la facture ${job.data.invoiceId}`);
    const { invoiceId, recipientEmail, reminderCount } = job.data;

    // --- SIMULATION D'ENVOI D'EMAIL/SMS ---
    this.logger.log(`Envoi du rappel n°${reminderCount} à ${recipientEmail} pour la facture ${invoiceId}...`);
    // Ici, tu intégrerais un service d'envoi d'email (SendGrid, Mailgun) ou SMS (Twilio)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simule un délai d'envoi
    this.logger.log(`Rappel n°${reminderCount} envoyé à ${recipientEmail} pour la facture ${invoiceId}.`);
    // --- FIN SIMULATION ---

    // Marquer le rappel comme envoyé dans la base de données
    await this.reminderService.markReminderSent(invoiceId, reminderCount);

    return { status: 'success', message: `Rappel envoyé pour ${invoiceId}` };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<SendReminderJob>) {
    this.logger.log(`Tâche de rappel ${job.id} terminée.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SendReminderJob>, err: Error) {
    this.logger.error(`Tâche de rappel ${job.id} échouée : ${err.message}`);
  }
}
