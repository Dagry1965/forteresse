import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common'; // <-- Ajoutez Post et Body ici
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { RecordSchedulePaymentDto } from './dto/record-schedule-payment.dto';

@Controller('finance/payments')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
  async getReminders(@Headers('x-workspace-id') workspaceId: string) {
    return this.paymentsService.getOverdueSchedules(workspaceId);
  }

  @Post('record')
  async record(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: RecordSchedulePaymentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return this.paymentsService.recordPayment(
      workspaceId,
      {
        ...dto,
        user_id: userId,
      },
    );
  }


}
