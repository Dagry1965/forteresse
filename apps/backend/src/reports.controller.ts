import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('finance/reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  // 1. Chiffre d'affaires par période (basé sur les paiements)
  @Get('revenue')
  async getRevenue(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      from: fromDate,
      to: toDate,
      totalRevenue,
      paymentsCount: payments.length,
    };
  }

  // 2. Nombre de factures par statut
  @Get('invoices-by-status')
  async getInvoicesByStatus() {
    const invoices = await this.prisma.invoice.findMany();

    const counts = invoices.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return counts;
  }

  // 3. Top clients par chiffre d'affaires (basé sur total_paid)
  @Get('top-clients')
  async getTopClients(@Query('limit') limit = '5') {
    const invoices = await this.prisma.invoice.findMany({
      where: { status: { in: ['paid', 'partially_paid'] } },
      include: {
        proforma: {
          include: {
            intervention: {
              include: {
                appointment: {
                  include: {
                    vehicle: { include: { client: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const map = new Map<
      string,
      { clientId: string; name: string; email: string | null; total: number }
    >();

    for (const inv of invoices) {
      const client = inv.proforma.intervention.appointment.vehicle.client;
      if (!client) continue;
      const key = client.id;
      const current = map.get(key) || {
        clientId: client.id,
        name: client.name,
        email: client.email,
        total: 0,
      };
      current.total += inv.total_paid;
      map.set(key, current);
    }

    const sorted = Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, parseInt(limit, 10));

    return sorted;
  }

  // 4. Top produits vendus (quantité totale et CA généré)
  @Get('top-products')
  async getTopProducts(@Query('limit') limit = '10') {
    const lineItems = await this.prisma.lineItem.findMany({
      where: { product_id: { not: null } },
      include: { product: true },
    });

    const map = new Map<
      string,
      { productId: string; name: string; reference: string | null; qty: number; revenue: number }
    >();

    for (const li of lineItems) {
      if (!li.product) continue;
      const key = li.product.id;
      const current = map.get(key) || {
        productId: li.product.id,
        name: li.product.name,
        reference: li.product.reference,
        qty: 0,
        revenue: 0,
      };
      current.qty += li.quantity;
      current.revenue += li.quantity * li.unit_price;
      map.set(key, current);
    }

    const sorted = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit, 10));

    return sorted;
  }
}
