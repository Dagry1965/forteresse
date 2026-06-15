import { Body, Controller, Param, Post } from '@nestjs/common';
import { PurchaseReceiptService } from './purchase-receipt.service';

@Controller('api/purchase-receipts')
export class PurchaseReceiptController {
  constructor(private readonly service: PurchaseReceiptService) {}

  @Post()
  async create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    return this.service.completeReceipt(id);
  }
}