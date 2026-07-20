import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Core
import { WorkspaceModule } from './core/workspace/workspace.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { AuditModule } from './core/audit/audit.module';
import { BackupModule } from './core/backup/backup.module';

// Business Modules
import { ClientsModule } from './modules/clients/clients.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkshopModule } from './modules/workshop/workshop.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { TimeSlotsModule } from './modules/timeslots/timeslots.module';
import { ProformasModule } from './modules/proformas/proformas.module';
import { UsersModule } from './modules/users/users.module'; 

console.log({
  InventoryModule,
});

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    
    // Core Modules
    WorkspaceModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    BackupModule,
    
    // Feature Modules
    FinanceModule, 
    InvoicesModule,
    AppointmentsModule, 
    VehiclesModule,
    ClientsModule,
    WorkshopModule,
    InventoryModule,
    SuppliersModule,
    TimeSlotsModule,
    ProformasModule,
    UsersModule,
  ],
  controllers: [], // ðŸ‘ˆ NettoyÃ© (InvoicesController est dÃ©jÃ  dans InvoicesModule)
  providers: [],
})
export class AppModule {}



