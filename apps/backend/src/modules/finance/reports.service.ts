import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTurnoverHistory(workspaceId: string) {
    try {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          workspace_id: workspaceId,
          status: { in: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'pending', 'paid'] },
          deleted_at: null
        },
        select: {
          total: true,
          created_at: true
        }
      });

      const monthlyData: Record<string, number> = {};
      
      invoices.forEach(inv => {
        if (!inv.created_at) return;
        
        // Formatage manuel simple pour éviter les bugs de locale sur certains systèmes
        const date = new Date(inv.created_at);
        const monthLabel = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
        
        monthlyData[monthLabel] = (monthlyData[monthLabel] || 0) + Number(inv.total || 0);
      });

      return Object.entries(monthlyData).map(([name, total]) => ({
        name,
        total
      })).slice(-6);
    } catch (error) {
      this.logger.error("Erreur Turnover History:", error);
      return []; // Retourne un tableau vide au lieu de faire crasher le serveur
    }
  }

  async getTopItems(workspaceId: string) {
    try {
      // On simplifie la requête pour SQLite
      const parts = await this.prisma.interventionPart.findMany({
        where: {
          intervention: { workspace_id: workspaceId }
        },
        include: { item: true },
        take: 50 // On prend les 50 dernières consommations
      });

      if (parts.length === 0) return [];

      // Groupement manuel en JS (plus sûr que le groupBy Prisma sur SQLite)
      const counts: Record<string, { name: string, quantity: number }> = {};
      
      parts.forEach(p => {
        const itemId = p.item_id;
        if (!counts[itemId]) {
          counts[itemId] = { name: p.item?.name || 'Inconnu', quantity: 0 };
        }
        counts[itemId].quantity += (p.quantity || 0);
      });

      return Object.values(counts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    } catch (error) {
      this.logger.error("Erreur Top Items:", error);
      return []; // Valeur de secours
    }
  }
}
