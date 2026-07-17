import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le rapport journalier pour un workspace
   * @param workspaceId ID du garage
   * @param date Date du rapport (format YYYY-MM-DD)
   */
  async getDailyReport(workspaceId: string, dateStr?: string) {
    // 1. Définir la plage horaire (du début à la fin de la journée)
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Récupérer tous les paiements de la journée
    const payments = await this.prisma.invoicePayment.findMany({
      where: {
        invoice: { workspace_id: workspaceId },
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
        user: {
          select: { name: true }, // Pour savoir qui a encaissé
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 3. Calculer les totaux par méthode
    const summary = payments.reduce(
      (acc, p) => {
        const method = p.method.toUpperCase();
        if (!acc.byMethod[method]) acc.byMethod[method] = 0;
        acc.byMethod[method] += p.amount;
        acc.totalGlobal += p.amount;
        return acc;
      },
      { byMethod: {} as Record<string, number>, totalGlobal: 0 }
    );

    return {
      date: startOfDay.toISOString(),
      count: payments.length,
      totals: summary.byMethod,
      grandTotal: summary.totalGlobal,
      payments: payments.map(p => ({
        id: p.id,
        time: p.created_at,
        amount: p.amount,
        method: p.method,
        client: p.invoice?.client?.name || 'Client Inconnu',
        invoiceRef: p.invoice?.reference,
        processedBy: p.user?.name || 'Système',
      })),
    };
  }
}
