import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientController } from './client.controller';
import { VehicleController } from './vehicle.controller';
import { AppointmentController } from './appointment.controller';
import { InterventionController } from './intervention.controller';
import { FinanceController } from './finance.controller';
import { InventoryController } from './inventory.controller';
import { QueueModule } from './queue.module';
import { ReminderModule } from './reminder/reminder.module';
import { ReportsController } from './reports.controller'; // <-- AJOUT

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    QueueModule,
    ReminderModule,
  ],
  controllers: [
    ClientController,
    VehicleController,
    AppointmentController,
    InterventionController,
    FinanceController,
    InventoryController,
    ReportsController, // <-- AJOUT
  ],
})
export class AppModule {}
