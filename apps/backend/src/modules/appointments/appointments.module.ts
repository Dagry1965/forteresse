// src/modules/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { SharedModule } from '../shared/shared.module';   // 🔥 IMPORT OBLIGATOIRE

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SharedModule,   // 🔥 Ajout ici
  ],
  controllers: [AppointmentController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
