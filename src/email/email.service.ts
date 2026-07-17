import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import { PdfService } from "../pdf/pdf.service";

@Injectable()
export class EmailService {
  private transporter;

  constructor(private readonly pdfService: PdfService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private loadTemplate(name: string) {
    const filePath = path.join(
      process.cwd(),
      "src/email/templates",
      `${name}.hbs`
    );

    const content = fs.readFileSync(filePath, "utf8");
    return Handlebars.compile(content);
  }

  async sendProformaEmail(proforma: any) {
    const template = this.loadTemplate("proforma-email");

    const html = template({
      proforma,
      client: proforma.client,
      vehicle: proforma.vehicle,
    });

    const pdf = await this.pdfService.generateProformaPDF(proforma);

    await this.transporter.sendMail({
      from: `"Garage Nova" <${process.env.SMTP_FROM}>`,
      to: proforma.client.email,
      subject: `Votre proforma - Intervention ${proforma.interventionId}`,
      html,
      attachments: [
        {
          filename: `proforma-${proforma.id}.pdf`,
          content: pdf,
        },
      ],
    });
  }

  async sendInvoiceEmail(invoice: any) {
    const template = this.loadTemplate("invoice-email");

    const html = template({
      invoice,
      client: invoice.client,
      vehicle: invoice.vehicle,
    });

    const pdf = await this.pdfService.generateInvoicePDF(invoice);

    await this.transporter.sendMail({
      from: `"Garage Nova" <${process.env.SMTP_FROM}>`,
      to: invoice.client.email,
      subject: `Votre facture - Intervention ${invoice.interventionId}`,
      html,
      attachments: [
        {
          filename: `facture-${invoice.id}.pdf`,
          content: pdf,
        },
      ],
    });
  }
}
