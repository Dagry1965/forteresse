import { Injectable } from "@nestjs/common";
import { BillingService } from "./billing.service";

@Injectable()
export class EnterpriseService {
  constructor(private readonly billing: BillingService) {}

  async runMonthlyBilling(companyId: string, year: number, month: number) {
    const company = await this.getCompanyById(companyId);
    const invoices = await this.billing.getCompanyMonthlyInvoices(
      companyId,
      year,
      month
    );

    const summary = await this.billing.generateMonthlySummary(company, invoices);

    const pdf = await this.billing.generateMonthlyPDF({
      ...summary,
      periodLabel: `${month}/${year}`,
    });

    await this.billing.sendMonthlyBillingEmail(company, summary, pdf);

    return { success: true, summary };
  }

  async getCompanyById(companyId: string) {
    // ORM ici
    return {
      id: companyId,
      name: "Entreprise Demo",
      billingEmail: "facturation@entreprise.ch",
    };
  }
}
