import { Injectable } from "@nestjs/common";
import { EmailService } from "../email/email.service";

@Injectable()
export class EmailProvider {
  constructor(private readonly email: EmailService) {}

  async sendProformaEmail(proforma: any) {
    return this.email.sendProformaEmail(proforma);
  }

  async sendInvoiceEmail(invoice: any) {
    return this.email.sendInvoiceEmail(invoice);
  }
}
