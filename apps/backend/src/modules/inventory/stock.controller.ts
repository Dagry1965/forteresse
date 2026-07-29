import {
  Controller,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * Retourne les articles en alerte (quantité <= min_stock)
   * GET /api/inventory/alerts
   */
  @Get('alerts')
  async getAlerts(@Headers('x-workspace-id') workspaceId: string) {
    return this.stockService.getLowStockAlerts(workspaceId);
  }

  /**
   * Retourne la valeur financière du stock (somme de qty * price_buy)
   * GET /api/inventory/value
   */
  @Get('value')
  async getValue(@Headers('x-workspace-id') workspaceId: string) {
    return this.stockService.getStockValue(workspaceId);
  }



  


}
