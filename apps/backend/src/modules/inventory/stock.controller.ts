import {
  Controller,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('inventory')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
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
