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
import type { Request } from 'express';

import { InventoryService } from './inventory.service';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseReceiptService } from './purchase-receipt.service';
import { StockService } from './stock.service';

import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
  };
};

@Controller('inventory')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.READ_ONLY,
)
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
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
)
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
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
)
  async createReceipt(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() data: CreatePurchaseReceiptDto,
    @Req() req: AuthenticatedRequest,
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
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
)
async autoGeneratePurchaseFromAlert(
  @Headers('x-workspace-id') workspaceId: string,
  @Body('itemId') itemId: string,
) {
  return this.inventoryService.autoGeneratePurchase(workspaceId, itemId);
}


}