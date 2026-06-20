import { Controller, Post, Body } from '@nestjs/common';
import { PurchaseReceiptService } from './purchase-receipt.service';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';

@Controller('api/purchase-receipts')
export class PurchaseReceiptController {
  constructor(private readonly service: PurchaseReceiptService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseReceiptDto) {
    return this.service.create(dto);
  }
}
