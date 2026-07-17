import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // Calcul de la valeur totale du stock (Prix d'achat * Quantité)
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

  // Récupération des articles sous le seuil de stock minimum
  async getLowStockAlerts(workspaceId: string) {
    const items = await this.prisma.stockItem.findMany({
      where: {
        workspace_id: workspaceId,
        deleted_at: null,
      },
      include: {
        supplier: true,
      },
    });

    // Filtre les articles dont la quantité est inférieure ou égale au min_stock
    return items.filter(item => item.quantity <= (item.min_stock || 0));
  }
}
