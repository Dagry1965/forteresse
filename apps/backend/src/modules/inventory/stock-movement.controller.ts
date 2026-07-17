import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
} from '@nestjs/common';

import { StockMovementService } from './stock-movement.service';

@Controller('inventory/movements')
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

