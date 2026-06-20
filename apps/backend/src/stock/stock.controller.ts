import { Controller, Get, Param, Query } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('api/inventory')
export class StockController {
  constructor(private readonly service: StockService) {}

  @Get(':productId')
  async getProductInventory(@Param('productId') productId: string) {
    return this.service.getInventory(productId);
  }

  @Get('movements')
  async listMovements(@Query('workspaceId') workspaceId: string, @Query('productId') productId?: string) {
    return this.service.listMovements(workspaceId, productId);
  }
}