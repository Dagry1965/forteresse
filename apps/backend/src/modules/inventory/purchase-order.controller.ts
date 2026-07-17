import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Controller('purchase-orders')
@UseGuards(WorkspaceGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // ← Important
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || null;

    console.log('📥 DTO brut reçu :', dto); // Debug

    return this.poService.createOrder(workspaceId, userId, dto);
  }

  @Get()
  findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.poService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.poService.findOne(workspaceId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.poService.updateStatus(workspaceId, id, status);
  }
}