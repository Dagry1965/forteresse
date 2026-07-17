import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';

import { InventoryController } from './inventory.controller';
import { PurchaseOrderController } from './purchase-order.controller';
import { StockController } from './stock.controller';
import { StockMovementController } from './stock-movement.controller';

import { InventoryService } from './inventory.service';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseReceiptService } from './purchase-receipt.service';
import { StockService } from './stock.service';
import { StockMovementService } from './stock-movement.service';

@Module({
  imports: [
    PrismaModule,
    SharedModule,
  ],

  controllers: [
    InventoryController,
    PurchaseOrderController,
    StockController,
    StockMovementController,
  ],

  providers: [
    InventoryService,
    PurchaseOrderService,
    PurchaseReceiptService,
    StockService,
    StockMovementService,
  ],

  exports: [
    InventoryService,
    PurchaseOrderService,
    PurchaseReceiptService,
    StockService,
    StockMovementService,
  ],
})
export class InventoryModule {}