import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('inventory')
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

  /**
   * Crée ou met à jour un brouillon de commande fournisseur
   * POST /api/inventory/purchases/auto-generate
   */
  @Post('purchases/auto-generate')
  async autoGenerate(
    @Headers('x-workspace-id') workspaceId: string,
    @Body('itemId') itemId: string
  ) {
    // Cette méthode appellera la logique de transaction Prisma
    // qui utilise PurchaseOrder et PurchaseOrderItem
    return this.stockService.generateAutoOrder(workspaceId, itemId);
  }


  


}
