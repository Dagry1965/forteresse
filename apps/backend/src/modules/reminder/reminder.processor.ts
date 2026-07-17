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

  async process(job: Job<any>): Promise<any> {
    console.log(`Reminder job ignored temporarily: ${job.name}`);

    return this.reminderService.processPaymentReminders();
  }
}