import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { RecordSchedulePaymentDto } from './dto/record-schedule-payment.dto';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Controller('finance/payments')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getAuthenticatedUserId(req: any): string {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return userId;
  }

  @Post('schedule')
  async createSchedule(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.paymentsService.createPaymentSchedule(
      workspaceId,
      dto,
    );
  }

  @Get('reminders')
  async getReminders(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.paymentsService.getOverdueSchedules(workspaceId);
  }

  @Post('record')
  async record(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: RecordSchedulePaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.recordPayment(
      workspaceId,
      {
        ...dto,
        user_id: this.getAuthenticatedUserId(req),
      },
    );
  }

  @Post(':paymentId/cancel')
  async cancelPayment(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: CancelPaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.cancelPayment(
      workspaceId,
      paymentId,
      this.getAuthenticatedUserId(req),
      dto.reason,
    );
  }

  @Post(':paymentId/refund')
  async refundPayment(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundPaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.refundPayment(
      workspaceId,
      paymentId,
      this.getAuthenticatedUserId(req),
      dto.amount,
      dto.reason,
    );
  }
}
