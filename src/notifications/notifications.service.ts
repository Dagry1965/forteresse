import { Injectable } from "@nestjs/common";
import { SmsProvider } from "./sms.provider";
import { PushProvider } from "./push.provider";
import { EmailProvider } from "./email.provider";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly sms: SmsProvider,
    private readonly push: PushProvider,
    private readonly email: EmailProvider,
  ) {}

  // -------------------------
  // SMS
  // -------------------------
  async sendSMS(to: string, message: string) {
    return this.sms.sendSMS(to, message);
  }

  // -------------------------
  // PUSH
  // -------------------------
  async sendPush(expoToken: string, title: string, body: string) {
    return this.push.sendPush(expoToken, title, body);
  }

  // -------------------------
  // EMAIL
  // -------------------------
  async sendProformaEmail(proforma: any) {
    return this.email.sendProformaEmail(proforma);
  }

  async sendInvoiceEmail(invoice: any) {
    return this.email.sendInvoiceEmail(invoice);
  }

  // -------------------------
  // NOTIFICATIONS MÉTIER
  // -------------------------

  async notifyNewAppointment(appointment: any) {
    if (appointment.client.phone) {
      await this.sendSMS(
        appointment.client.phone,
        `Votre rendez-vous est confirmé le ${appointment.date}.`
      );
    }

    if (appointment.client.expoToken) {
      await this.sendPush(
        appointment.client.expoToken,
        "Rendez-vous confirmé",
        "Votre rendez-vous est enregistré."
      );
    }
  }

  async notifyProformaReady(proforma: any) {
    await this.sendProformaEmail(proforma);

    if (proforma.client.phone) {
      await this.sendSMS(
        proforma.client.phone,
        `Votre proforma est disponible. Montant estimé : ${proforma.totalTTC} CHF.`
      );
    }
  }

  async notifyInvoiceReady(invoice: any) {
    await this.sendInvoiceEmail(invoice);

    if (invoice.client.phone) {
      await this.sendSMS(
        invoice.client.phone,
        `Votre facture est disponible. Total : ${invoice.totalTTC} CHF.`
      );
    }
  }
}
