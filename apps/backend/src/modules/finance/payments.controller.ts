import { Controller, Get, Post, Body, Headers } from '@nestjs/common'; // <-- Ajoutez Post et Body ici
import { PaymentsService } from './payments.service';

@Controller('finance/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('schedule')
  async createSchedule(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: any
  ) {
    return this.paymentsService.createPaymentSchedule(workspaceId, dto);
  }

  @Get('reminders')
  async getReminders(@Headers('x-workspace-id') workspaceId: string) {
    return this.paymentsService.getOverdueSchedules(workspaceId);
  }

  @Post('record')
async record(@Headers('x-workspace-id') workspaceId: string, @Body() dto: any) {
  return this.paymentsService.recordPayment(workspaceId, dto);
}


}
