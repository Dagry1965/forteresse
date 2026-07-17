import { Module } from "@nestjs/common";
import { EnterpriseService } from "./enterprise.service";
import { BillingService } from "./billing.service";
import { PdfModule } from "../pdf/pdf.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [PdfModule, EmailModule],
  providers: [EnterpriseService, BillingService],
  exports: [EnterpriseService, BillingService],
})
export class EnterpriseModule {}
