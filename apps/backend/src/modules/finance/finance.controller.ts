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
    @Headers('x-workspace-id') workspaceId: string,
    @Body('amount') amount: number,
    @Body('method') method: string,
    @Body('user_id') userId?: string,
    @Body('reference') reference?: string,
    @Body('notes') notes?: string,
  ) {
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
