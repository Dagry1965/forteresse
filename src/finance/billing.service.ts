import { Injectable } from "@nestjs/common";
import { PdfService } from "../pdf/pdf.service";
import { EmailService } from "../email/email.service";

@Injectable()
export class BillingService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly emailService: EmailService,
  ) {}

  async getCompanyMonthlyInvoices(companyId: string, year: number, month: number) {
    // À adapter à ton ORM (Prisma, TypeORM, etc.)
    // Exemple pseudo-code :
    // return this.invoiceRepo.find({
    //   where: {
    //     companyId,
    //     createdAt: between(startOfMonth, endOfMonth),
    //   },
    // });

    return []; // placeholder
  }

  async generateMonthlySummary(company: any, invoices: any[]) {
    const total = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalTTC),
      0
    );

    return {
      company,
      invoices,
      total,
      count: invoices.length,
    };
  }

  async generateMonthlyPDF(summary: any): Promise<Buffer> {
    const templateName = "enterprise-monthly"; // à créer dans pdf/templates
    const template = (await import("../pdf/templates-loader")).load(templateName);

    const html = template(summary);
    return this.pdfService["renderPdf"](html); // ou expose une méthode dédiée
  }

  async sendMonthlyBillingEmail(company: any, summary: any, pdf: Buffer) {
    await this.emailService["transporter"].sendMail({
      from: `"Garage Nova" <${process.env.SMTP_FROM}>`,
      to: company.billingEmail,
      subject: `Facturation mensuelle - ${summary.periodLabel}`,
      html: `
        <p>Bonjour ${company.name},</p>
        <p>Veuillez trouver ci-joint votre récapitulatif de facturation mensuelle.</p>
        <p>Nombre d'interventions : <b>${summary.count}</b><br/>
        Total : <b>${summary.total} CHF TTC</b></p>
        <p>Cordialement,<br/>Garage Nova</p>
      `,
      attachments: [
        {
          filename: `facturation-${summary.periodLabel}.pdf`,
          content: pdf,
        },
      ],
    });
  }
}
