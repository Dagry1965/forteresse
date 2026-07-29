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
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
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
  generateInvoice(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
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
  payInvoice(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
    @Body('amount') amount: number,
    @Body('method') method: string,
    @Req() req: any,
    @Body('reference') reference?: string,
    @Body('notes') notes?: string,
  ) {
    return this.financeService.registerPayment(
      workspaceId,
      id,
      amount,
      method,
      req.user?.id || req.user?.sub,
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
