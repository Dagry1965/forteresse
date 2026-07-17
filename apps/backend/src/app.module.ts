import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Core
import { WorkspaceModule } from './core/workspace/workspace.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { AuditModule } from './core/audit/audit.module';

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

console.log({
  InventoryModule,
});

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Core Modules
    WorkspaceModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    
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
  ],
  controllers: [], // 👈 Nettoyé (InvoicesController est déjà dans InvoicesModule)
  providers: [],
})
export class AppModule {}
