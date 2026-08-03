import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { ReminderService } from './reminder.service';

@Injectable()
@Processor('reminders')
export class ReminderProcessor extends WorkerHost {
  constructor(private readonly reminderService: ReminderService) {
    super();
  }

  async process(_job: Job<unknown>): ReturnType<ReminderService['processPaymentReminders']> {
    return this.reminderService.processPaymentReminders();
  }
}
