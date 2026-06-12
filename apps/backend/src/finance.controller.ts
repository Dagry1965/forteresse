import { Controller, Post, Body, Get, Param, Patch, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('finance')
export class FinanceController {
  constructor(private prisma: PrismaService) {}

  // Créer un Proforma avec ses lignes (produits / main d'œuvre)
  @Post('proforma')
  async createProforma(@Body() data: {
    interventionId: string;
    lines: { description: string; quantity: number; unit_price: number }[];
  }) {
    // Vérification que l'intervention existe
    const intervention = await this.prisma.intervention.findUnique({
      where: { id: data.interventionId }
    });

    if (!intervention) {
      throw new NotFoundException('Intervention non trouvée');
    }

    const total = data.lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);

    const proforma = await this.prisma.proforma.create({
      data: {
        intervention_id: data.interventionId,
        total_amount: total,
        status: 'draft',
        lines: {
          create: data.lines.map(line => ({
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
          }))
        }
      },
      include: { lines: true }
    });

    return proforma;
  }

  // Récupérer un Proforma avec ses lignes
  @Get('proforma/:id')
  async getProforma(@Param('id') id: string) {
    return this.prisma.proforma.findUnique({
      where: { id },
      include: { lines: true, intervention: true }
    });
  }

  // Approuver un Proforma → Créer la Facture
  @Patch('proforma/:id/approve')
  async approveProforma(@Param('id') id: string) {
    const proforma = await this.prisma.proforma.update({
      where: { id },
      data: { status: 'approved' }
    });

    // Création automatique de la facture (échéance +30 jours)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await this.prisma.invoice.create({
      data: {
        proforma_id: id,
        status: 'unpaid',
        due_date: dueDate,
        total_paid: 0
      }
    });

    return { proforma, invoice };
  }

  // Lister les factures impayées (pour les relances)
  @Get('invoices/unpaid')
  async getUnpaidInvoices() {
    return this.prisma.invoice.findMany({
      where: { status: 'unpaid' },
      include: {
        proforma: {
          include: {
            lines: true,
            intervention: {
              include: {
                appointment: {
                  include: {
                    vehicle: { include: { client: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}
