import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReminderService } from './reminder.service';
import { ReminderProcessor } from './reminder.processor';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'invoice-reminders',
    }),
  ],
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}


