import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { Request } from 'express';

@Controller('api/purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Post()
  async create(@Body() dto: any, @Req() req: Request) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const workspaceId = (req.headers['x-workspace-id'] as string) || process.env.NEXT_PUBLIC_WORKSPACE_ID || process.env.WORKSPACE_ID || 'dev-ws';
    return this.service.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
