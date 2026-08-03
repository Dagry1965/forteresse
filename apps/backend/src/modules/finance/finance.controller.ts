import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

@Controller('finance')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('proforma/:id')
  getProforma(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.financeService.getProforma(id, workspaceId);
  }

  @Post('proforma/:id/generate-invoice')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
    USER_ROLE.ACCOUNTING,
  )
  generateInvoice(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return this.financeService.generateInvoiceFromProforma(
      id,
      workspaceId,
      userId,
    );
  }

  @Get('invoice/:id')
  getInvoice(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.financeService.getInvoice(id, workspaceId);
  }

  @Post('invoice/:id/pay')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.CASHIER,
    USER_ROLE.ACCOUNTING,
  )
  payInvoice(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
    @Body('amount') amount: number,
    @Body('method') method: string,
    @Req() req: AuthenticatedRequest,
    @Body('reference') reference?: string,
    @Body('notes') notes?: string,
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Utilisateur authentifie introuvable.',
      );
    }

    return this.financeService.registerPayment(
      workspaceId,
      id,
      amount,
      method,
      userId,
      reference,
      notes,
    );
  }

   @Get('fleet/pending/:clientId')
  async getPendingFleet(
    @Param('clientId') clientId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.financeService.getPendingFleetItems(workspaceId, clientId);
  }
}
