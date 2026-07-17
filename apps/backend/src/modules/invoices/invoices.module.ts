import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller'; // <--- Importez votre nouveau contrôleur
//import { InvoicesAdminController } from './invoices.admin.controller';

@Module({
  controllers: [
    InvoicesController, // <--- AJOUTEZ-LE ICI
  //  InvoicesAdminController
  ],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
