import { Controller, Get, Query, Headers } from '@nestjs/common';
import { CashierService } from './cashier.service';

@Controller('finance/cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  /**
   * Endpoint pour obtenir le journal de caisse
   * Exemple : /api/finance/cashier/report?date=2024-05-15
   */
  @Get('report')
  async getReport(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('date') date?: string,
  ) {
    return this.cashierService.getDailyReport(workspaceId, date);
  }
}
