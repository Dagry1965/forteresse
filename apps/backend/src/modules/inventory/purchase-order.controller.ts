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
import type { Request } from 'express';
import { PurchaseOrderService } from './purchase-order.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
  };
};

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // ← Important
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.STOCK,
  )
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id || req.user?.sub || null;

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
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.STOCK,
  )
  updateStatus(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.poService.updateStatus(workspaceId, id, status);
  }
}