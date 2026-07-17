import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class StockMovementService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Lister tous les mouvements du workspace.
   */
  async findAll(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId est requis.',
      );
    }

    return this.prisma.stockMovement.findMany({
      where: {
        workspace_id: workspaceId,
      },
      include: {
        item: {
          include: {
            category: true,
            supplier: true,
          },
        },
        createdBy: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Lister les mouvements d'un article précis.
   */
  async findByItem(
    workspaceId: string,
    itemId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId est requis.',
      );
    }

    if (!itemId) {
      throw new BadRequestException(
        'itemId est requis.',
      );
    }

    /*
     * Vérifier que l'article appartient bien au workspace.
     */
    const stockItem = await this.prisma.stockItem.findFirst({
      where: {
        id: itemId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!stockItem) {
      throw new NotFoundException(
        'Article de stock introuvable.',
      );
    }

    return this.prisma.stockMovement.findMany({
      where: {
        item_id: itemId,
        workspace_id: workspaceId,
      },
      include: {
        item: {
          include: {
            category: true,
            supplier: true,
          },
        },
        createdBy: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}

