import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  UseGuards,
} from '@nestjs/common';

import { StockMovementService } from './stock-movement.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('inventory/movements')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
export class StockMovementController {
  constructor(
    private readonly movementService: StockMovementService,
  ) {}

  /**
   * Lister tous les mouvements de stock du workspace.
   *
   * GET /inventory/movements
   */
  @Get()
  findAll(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException(
        'Le header x-workspace-id est requis.',
      );
    }

    return this.movementService.findAll(workspaceId);
  }

  /**
   * Lister les mouvements d'un article précis.
   *
   * GET /inventory/movements/item/:itemId
   */
  @Get('item/:itemId')
  findByItem(
    @Param('itemId') itemId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException(
        'Le header x-workspace-id est requis.',
      );
    }

    if (!itemId) {
      throw new BadRequestException(
        'itemId est requis.',
      );
    }

    return this.movementService.findByItem(
      workspaceId,
      itemId,
    );
  }
}

