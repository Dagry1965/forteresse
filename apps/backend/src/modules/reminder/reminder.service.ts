import { Injectable } from '@nestjs/common';

@Injectable()
export class ReminderService {
  async processPaymentReminders() {
    return {
      success: true,
      message: 'Reminder service temporarily disabled: invoice reminder fields are not present in Prisma schema.',
      processed: 0,
    };
  }
}