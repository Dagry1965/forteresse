import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseReceiptService } from './purchase-receipt.service';
import { StockService } from './stock.service';

import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class InventoryController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchaseReceiptService: PurchaseReceiptService,
    private readonly stockService: StockService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Lister les produits du stock.
   */
  @Get('products')
  async listProducts(
    @Headers('x-workspace-id') workspaceId: string,
    @Query() filter: InventoryFilterDto,
  ) {
    return this.inventoryService.listProducts({
      ...filter,
      workspace_id: workspaceId,
    });
  }

  /**
   * Générer automatiquement une commande depuis une alerte de stock.
   */
  @Post('products/:itemId/auto-purchase')
  async autoGeneratePurchase(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.inventoryService.autoGeneratePurchase(
      workspaceId,
      itemId,
    );
  }

  /**
   * Enregistrer une réception fournisseur.
   */
  @Post('receipts')
  async createReceipt(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() data: CreatePurchaseReceiptDto,
    @Req() req: any,
  ) {
    return this.purchaseReceiptService.createReceipt(
      workspaceId,
      {
        ...data,
        userId: req.user?.id,
      },
    );
  }

  /**
   * Lister les réceptions.
   */
  @Get('receipts')
  async findAllReceipts(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.purchaseReceiptService.findAll(workspaceId);
  }

@Post('purchases/auto-generate')
async autoGeneratePurchaseFromAlert(
  @Headers('x-workspace-id') workspaceId: string,
  @Body('itemId') itemId: string,
) {
  return this.inventoryService.autoGeneratePurchase(workspaceId, itemId);
}


}