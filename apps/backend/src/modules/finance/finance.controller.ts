import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers
} from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('proforma/:id')
  getProforma(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.financeService.getProforma(id, workspaceId);
  }

  @Post('proforma/:id/generate-invoice')
  generateInvoice(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Query('userId') userId: string,
  ) {
    return this.financeService.generateInvoiceFromProforma(id, workspaceId, userId);
  }

  @Get('invoice/:id')
  getInvoice(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.financeService.getInvoice(id, workspaceId);
  }

  @Post('invoice/:id/pay')
  payInvoice(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('workspace_id') workspace_id: string,
    @Body('client_id') client_id: string,
    @Body('user_id') user_id: string,
  ) {
    return this.financeService.registerPayment({
      amount,
      invoice_id: id,
      workspace_id,
      client_id,
      user_id,
    });
  }

   @Get('fleet/pending/:clientId')
  async getPendingFleet(
    @Param('clientId') clientId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.financeService.getPendingFleetItems(workspaceId, clientId);
  }
}
