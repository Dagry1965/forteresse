import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class BackupAlertService {
  private readonly logger = new Logger(BackupAlertService.name);

  async sendFailureAlert(error: unknown): Promise<void> {
    const user = process.env.GMAIL_USER;
    const password = process.env.GMAIL_APP_PASSWORD;
    const recipient = process.env.BACKUP_ALERT_EMAIL;

    if (!user || !password || !recipient) {
      this.logger.warn(
        'Configuration e-mail incomplète : alerte de sauvegarde ignorée.',
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: password,
      },
    });

    const message =
      error instanceof Error
        ? error.stack ?? error.message
        : String(error);

    await transporter.sendMail({
      from: `"AMARKHYS Backups" <${user}>`,
      to: recipient,
      subject: 'Échec de la sauvegarde AMARKHYS',
      text: [
        'La sauvegarde automatique AMARKHYS a échoué.',
        '',
        `Date UTC : ${new Date().toISOString()}`,
        '',
        message,
      ].join('\n'),
    });

    this.logger.log(`Alerte de sauvegarde envoyée à ${recipient}`);
  }
}
