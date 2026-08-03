import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SequencingService } from '../shared/sequencing.service';
import { InventoryFilterDto } from './dto/inventory-filter.dto';

import {
  PURCHASE_ORDER_STATUS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
  ) {}

  /**
   * Lister les articles du stock d'un workspace.
   */
  async listProducts(filter: InventoryFilterDto) {
    if (!filter?.workspace_id) {
      throw new BadRequestException('workspace_id est requis.');
    }

    try {
      return await this.prisma.stockItem.findMany({
        where: {
          workspace_id: filter.workspace_id,
          deleted_at: null,
        },
        include: {
          category: true,
          supplier: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        'Erreur lors de la lecture du stock.',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Erreur lors de la lecture du stock.',
      );
    }
  }

  /**
   * Générer automatiquement une commande fournisseur
   * depuis une alerte de stock.
   */
  async autoGeneratePurchase(
    workspaceId: string,
    itemId: string,
    userId?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis.');
    }

    if (!itemId) {
      throw new BadRequestException('itemId est requis.');
    }

    try {
      /*
       * findFirst est nécessaire pour vérifier simultanément :
       * - l'identifiant de l'article ;
       * - son workspace ;
       * - son état non supprimé.
       */
      const stockItem = await this.prisma.stockItem.findFirst({
        where: {
          id: itemId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          supplier: true,
        },
      });

      if (!stockItem) {
        throw new NotFoundException(
          'Article de stock introuvable.',
        );
      }

      /*
       * Dans le schéma, supplier_id est obligatoire
       * sur PurchaseOrder.
       */
      if (!stockItem.supplier_id || !stockItem.supplier) {
        throw new BadRequestException(
          `Aucun fournisseur principal n’est défini pour l’article "${stockItem.name}".`,
        );
      }

      const minimumStock = Number(stockItem.min_stock ?? 0);

      /*
       * Quantité automatique :
       * au minimum 10 unités ou 150 % du stock minimum.
       */
      const quantityToOrder = Math.max(
        10,
        Math.ceil(minimumStock * 1.5),
      );

      /*
       * Le schéma StockItem contient price_buy,
       * mais pas last_purchase_price.
       */
      const purchasePrice = Number(stockItem.price_buy ?? 0);

      if (
        !Number.isFinite(purchasePrice) ||
        purchasePrice < 0
      ) {
        throw new BadRequestException(
          `Le prix d’achat de l’article "${stockItem.name}" est invalide.`,
        );
      }

      const reference = await this.sequencingService.generateReference(
        workspaceId,
        'PURCHASE_ORDER',
      );

      /*
       * Le modèle PurchaseOrder ne contient pas :
       * - expected_date ;
       * - notes.
       *
       * Les lignes PurchaseOrderItem utilisent :
       * - item_id ;
       * - price_buy.
       */
      const purchaseOrder =
        await this.prisma.purchaseOrder.create({
          data: {
            workspace_id: workspaceId,
            supplier_id: stockItem.supplier_id,
            reference,
            status: PURCHASE_ORDER_STATUS.DRAFT,
            created_by: userId ?? null,

            items: {
              create: [
                {
                  item_id: stockItem.id,
                  quantity: quantityToOrder,
                  received_quantity: 0,
                  price_buy: purchasePrice,
                },
              ],
            },
          },

          include: {
            supplier: true,
            items: {
              include: {
                item: true,
              },
            },
          },
        });

      return purchaseOrder;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        'Erreur lors de la generation automatique du bon de commande.',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Erreur lors de la génération automatique du bon de commande.',
      );
    }
  }
}

