import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Controller('finance/cashier')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.CASHIER,
  USER_ROLE.ACCOUNTING,
)
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  private getAuthenticatedUserId(req: any): string {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return userId;
  }

  @Get('active')
  async getActiveRegister(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.cashierService.getActiveRegister(workspaceId);
  }

  @Post('open')
  async openRegister(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: OpenCashRegisterDto,
    @Req() req: any,
  ) {
    return this.cashierService.openRegister(
      workspaceId,
      this.getAuthenticatedUserId(req),
      dto.opening_amount,
      dto.notes,
    );
  }

  @Post('movement')
  async createMovement(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateCashMovementDto,
    @Req() req: any,
  ) {
    return this.cashierService.createManualMovement(
      workspaceId,
      this.getAuthenticatedUserId(req),
      dto.type,
      dto.amount,
      dto.notes,
      dto.reference,
    );
  }

  @Post('close')
  async closeRegister(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CloseCashRegisterDto,
    @Req() req: any,
  ) {
    return this.cashierService.closeRegister(
      workspaceId,
      this.getAuthenticatedUserId(req),
      dto.closing_amount,
      dto.notes,
    );
  }

  @Get('report')
  async getReport(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('date') date?: string,
  ) {
    return this.cashierService.getDailyReport(workspaceId, date);
  }
}
