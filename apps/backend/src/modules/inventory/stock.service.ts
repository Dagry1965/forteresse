import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PURCHASE_ORDER_STATUS } from '../../../../../shared/constants/status.constants';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ NOUVEAU : Calcule la valeur totale financière du stock
   * Appelé par le Dashboard (GET /api/inventory/value)
   */
  async getStockValue(workspaceId: string) {
    const items = await this.prisma.stockItem.findMany({
      where: { 
        workspace_id: workspaceId,
        deleted_at: null 
      },
      select: {
        quantity: true,
        price_buy: true
      }
    });

    const totalValue = items.reduce((acc, item) => {
      return acc + (Number(item.quantity || 0) * Number(item.price_buy || 0));
    }, 0);

    return { totalValue };
  }

  /**
   * ✅ EXISTANT : Liste les articles en alerte (utilisé par le dashboard)
   */
  async getLowStockAlerts(workspaceId: string) {
  try {
    const items = await this.prisma.stockItem.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        supplier: true,
      },
    });

    // Sécurité : On s'assure que quantity et min_stock sont traités comme des nombres
    // même s'ils sont null ou undefined en base de données.
    return items.filter(item => {
      const currentQty = Number(item.quantity || 0);
      const threshold = Number(item.min_stock || 0);
      
      // On ne déclenche l'alerte que si un seuil > 0 a été défini
      return threshold > 0 && currentQty <= threshold;
    });
  } catch (error) {
    console.error("Erreur Stock Alerts:", error);
    throw new InternalServerErrorException("Impossible de calculer les alertes de stock.");
  }
}


  /**
   * Liste tous les articles en stock (Catalogue)
   */
  async listProducts(filter: { workspace_id: string }) {
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
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException("Erreur lors de la lecture du catalogue de stock.");
    }
  }

  /**
   * Liste l'historique des mouvements (Entrées / Sorties)
   */
  async listMovements(workspaceId: string) {
    return this.prisma.stockMovement.findMany({
      where: { workspace_id: workspaceId },
      include: {
        item: true,
        createdBy: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Enregistre un mouvement manuel (Ajustement, Casse, Perte)
   */
  async registerMovement(
    workspaceId: string,
    userId: string | undefined,
    dto: {
      item_id: string;
      quantity: number;
      type: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.findFirst({
        where: {
          id: dto.item_id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!item) {
        throw new NotFoundException(
          'Article introuvable dans ce workspace.',
        );
      }

      const movement = await tx.stockMovement.create({
        data: {
          item_id: item.id,
          workspace_id: workspaceId,
          quantity: dto.quantity,
          type: dto.type,
          created_by: userId,
        },
      });

      const adjustment = dto.type.startsWith('IN')
        ? dto.quantity
        : -dto.quantity;

      await tx.stockItem.update({
        where: { id: item.id },
        data: {
          quantity: {
            increment: adjustment,
          },
        },
      });

      return movement;
    });
  }




}
