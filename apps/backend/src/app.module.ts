import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; 
import { ClientController } from './client.controller';
import { VehicleController } from './vehicle.controller';
import { AppointmentController } from './appointment.controller';
import { InterventionController } from './intervention.controller';
import { InventoryController } from './inventory.controller';
import { QueueModule } from './queue.module';
import { ReportsController } from './reports.controller';
import { PurchaseModule } from './purchase/purchase.module'; 
import { PurchaseReceiptModule } from './purchase-receipt/purchase-receipt.module';
import { FinanceModule } from './finance/finance.module';
import { AuditModule } from './audit/audit.module'; // <-- AJOUT 1


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,     // <-- AJOUT 2 : Activation de la traçabilité globale
    AuthModule,
    QueueModule,
    PurchaseModule, 
    PurchaseReceiptModule,
    FinanceModule, 
    // ReminderModule est commenté pour l'instant à cause du bug Reflector
  ],
  controllers: [
    ClientController,
    VehicleController,
    AppointmentController,
    InterventionController,
    InventoryController,
    ReportsController,
  ],
})
export class AppModule {}
