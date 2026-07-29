import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller'; // <--- Importez votre nouveau contrôleur
//import { InvoicesAdminController } from './invoices.admin.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    InvoicesController, // <--- AJOUTEZ-LE ICI
  //  InvoicesAdminController
  ],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
