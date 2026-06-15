import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // <-- NOUVEAU : Corriger ici
import { ScheduleModule } from '@nestjs/schedule'; // Pour le @Cron
import { ReminderService } from './reminder.service';
import { ReminderProcessor } from './reminder.processor';
import { PrismaModule } from '../prisma/prisma.module'; // Import du module Prisma

@Module({
  imports: [
    PrismaModule, // Pour que ReminderService et Processor puissent utiliser PrismaService
    ScheduleModule.forRoot(), // Initialise le planificateur
    BullModule.registerQueue({
      name: 'invoice-reminders', // Nom de la file d'attente
    }),
  ],
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService], // Exporter le service si d'autres modules en ont besoin
})
export class ReminderModule {}
