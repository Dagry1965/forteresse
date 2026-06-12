import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientController } from './client.controller';
import { VehicleController } from './vehicle.controller';
import { AppointmentController } from './appointment.controller';
import { InterventionController } from './intervention.controller';
import { FinanceController } from './finance.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ClientController, 
    VehicleController, 
    AppointmentController, 
    InterventionController,
    FinanceController
  ],
})
export class AppModule {}
