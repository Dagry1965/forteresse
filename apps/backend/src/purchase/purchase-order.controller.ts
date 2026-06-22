import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { Request } from '@nestjs/common';

@Controller('api/purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const workspaceId =
      ((req.headers as any)['x-workspace-id'] as string) ||   // ✅ Correction TS
      process.env.NEXT_PUBLIC_WORKSPACE_ID ||
      process.env.WORKSPACE_ID ||
      'dev-ws';

    return this.service.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }
}
