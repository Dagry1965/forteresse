import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { Request } from 'express';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto'; // <-- IMPORT AJOUTÉ

@Controller('api/purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly service: PurchaseOrderService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto) { // <-- TYPE CHANGÉ DE any À CreatePurchaseOrderDto
    // Note: Le décorateur @Body() associé au type DTO déclenche maintenant 
    // la validation @ArrayMinSize(1) grâce au ValidationPipe de main.ts
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    // Récupération sécurisée du workspaceId
    const workspaceId = 
      (req.headers['x-workspace-id'] as string) || 
      process.env.NEXT_PUBLIC_WORKSPACE_ID || 
      process.env.WORKSPACE_ID || 
      'dev-ws';
      
    return this.service.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  
  // ✅ ENDPOINT POUR CONFIRMER UN BON DE COMMANDE
  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }
}
