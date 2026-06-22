import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('finance')
export class FinanceController {
  constructor(private prisma: PrismaService) {}

  // 1. CRÉER OU METTRE À JOUR UN PROFORMA
  @Post('proforma')
  async createProforma(@Body() data: {
    interventionId: string;
    lines: { description: string; quantity: number; unitPrice: number; productId?: string }[];
  }) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id: data.interventionId },
      include: {
        proforma: true,
        appointment: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    if (!intervention) throw new NotFoundException('Intervention non trouvée');

    const workspaceId = intervention.appointment?.vehicle?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID manquant pour cette intervention');
    }

    if (intervention.proforma) {
      if (intervention.proforma.status === 'approved') {
        throw new ConflictException('Un proforma déjà approuvé existe et ne peut être modifié');
      }
      await this.prisma.lineItem.deleteMany({ where: { proforma_id: intervention.proforma.id } });
      await this.prisma.proforma.delete({ where: { id: intervention.proforma.id } });
    }

    const total = data.lines.reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.unitPrice),
      0,
    );

    return this.prisma.proforma.create({
      data: {
        intervention_id: data.interventionId,
        total_amount: total,
        status: 'draft',
        workspaceId: workspaceId,
        lines: {
          create: data.lines.map((line) => ({
            description: line.description,
            quantity: Number(line.quantity),
            unit_price: Number(line.unitPrice),
            product_id: line.productId,
          })),
        },
      },
      include: { lines: true },
    });
  }

  // 2. LISTER LES PROFORMAS
  @Get('proformas')
  async getAllProformas() {
    try {
      return await this.prisma.proforma.findMany({
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
      });
    } catch (e) {
      console.error('Erreur lors de la récupération des proformas:', e);
      return [];
    }
  }

  // 3. APPROUVER UN PROFORMA
  @Patch('proforma/:id/approve')
  async approveProforma(@Param('id') id: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id },
      include: {
        lines: { include: { product: { include: { inventory: true } } } },
        intervention: {
          include: {
            appointment: {
              include: { vehicle: true },
            },
          },
        },
      },
    });

    if (!proforma) throw new NotFoundException('Proforma non trouvé');
    if (proforma.status === 'approved') throw new ConflictException('Déjà approuvé');

    const workspaceId = proforma.intervention?.appointment?.vehicle?.workspaceId;
    if (!workspaceId) throw new BadRequestException('Workspace ID manquant');

    const stockUpdates: any[] = [];
    for (const line of proforma.lines) {
      if (line.product_id && line.product?.inventory) {
        if (line.product.inventory.quantity < line.quantity) {
          throw new BadRequestException(`Stock insuffisant pour ${line.product.name}`);
        }
        stockUpdates.push(
          this.prisma.inventory.update({
            where: { id: line.product.inventory.id },
            data: { quantity: line.product.inventory.quantity - line.quantity },
          }),
          this.prisma.stockMovement.create({
            data: {
              workspaceId: workspaceId,
              product_id: line.product.id,
              type: 'OUT',
              quantity: line.quantity,
              reason: `Sortie Facture Proforma ${proforma.id}`,
            },
          }),
        );
      }
    }

    const [updatedProforma, invoice] = await this.prisma.$transaction([
      this.prisma.proforma.update({ where: { id }, data: { status: 'approved' } }),
      this.prisma.invoice.create({
        data: {
          proforma_id: id,
          status: 'unpaid',
          due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
          total_paid: 0,
          workspaceId: workspaceId,
        },
      }),
      ...stockUpdates,
    ]);

    return { proforma: updatedProforma, invoice };
  }

  // 4. RAPPORTS : CHIFFRE D'AFFAIRES
  @Get('reports/revenue')
  async getRevenue(@Query('from') from: string, @Query('to') to: string) {
    const fromDate = from ? new Date(from) : new Date('1970-01-01');
    const toDate = to ? new Date(to) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    return { from: fromDate, to: toDate, totalRevenue, paymentsCount: payments.length };
  }

  // 5. RAPPORTS : STATUS FACTURES
  @Get('reports/invoices-by-status')
  async getInvoicesByStatus() {
    const invoices = await this.prisma.invoice.findMany();
    return invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // 6. RAPPORTS : TOP CLIENTS
  @Get('reports/top-clients')
  async getTopClients() {
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

    const map = new Map();
    for (const inv of invoices) {
      const client = inv.proforma?.intervention?.appointment?.vehicle?.client;
      if (!client) continue;

      const current = map.get(client.id) || { name: client.name, total: 0 };
      current.total += inv.total_paid;
      map.set(client.id, current);
    }

    return Array.from(map.values()).sort((a: any, b: any) => b.total - a.total);
  }

  // 7. RAPPORTS : TOP PRODUITS
  @Get('reports/top-products')
  async getTopProducts() {
    const lineItems = await this.prisma.lineItem.findMany({
      where: { 
        product_id: { not: null }, 
        proforma: { status: 'approved' } 
      },
      include: { product: true },
    });

    const map = new Map();
    for (const li of lineItems) {
      if (!li.product) continue;
      const current = map.get(li.product.id) || {
        name: li.product.name,
        qty: 0,
        revenue: 0,
      };
      current.qty += li.quantity;
      current.revenue += li.quantity * li.unit_price;
      map.set(li.product.id, current);
    }
    return Array.from(map.values()).sort((a: any, b: any) => b.revenue - a.revenue);
  }

  // 8. ENREGISTRER UN PAIEMENT
  @Post('invoice/:invoiceId/payment')
  async recordPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() data: { amount: number; method: string },
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { proforma: true, payments: true },
    });
    if (!invoice) throw new NotFoundException('Facture non trouvée');

    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const newTotalPaid = currentPaid + Number(data.amount);

    await this.prisma.payment.create({
      data: { 
        invoice_id: invoiceId, 
        amount: Number(data.amount), 
        method: data.method 
      },
    });

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        total_paid: newTotalPaid,
        status: newTotalPaid >= invoice.proforma.total_amount ? 'paid' : 'partially_paid',
      },
    });
  }

  // 9. FACTURES IMPAYÉES
  @Get('invoices/unpaid')
  async getUnpaidInvoices() {
    return this.prisma.invoice.findMany({
      where: { status: { not: 'paid' } },
      include: {
        proforma: {
          include: {
            lines: { include: { product: true } },
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
        payments: true,
      },
    });
  }
}