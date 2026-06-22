import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Transformer un Devis (Proforma) en Facture
  async createInvoice(dto: CreateInvoiceDto, workspaceId: string) {
    const proforma = await this.prisma.proforma.findUnique({
      where: { id: dto.proforma_id },
      select: { id: true, total_amount: true, invoice: true }
    });

    if (!proforma) throw new NotFoundException("Le devis spécifié n'existe pas.");
    if (proforma.invoice) throw new BadRequestException("Une facture existe déjà pour ce devis.");

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          proforma_id: dto.proforma_id,
          due_date: new Date(dto.due_date),
          status: 'unpaid',
          total_paid: 0,
          workspaceId, 
        }
      });

      await tx.auditLog.create({
        data: {
          workspaceId,
          entity: 'invoice',
          entityId: invoice.id,
          action: 'create',
          message: `Facture générée pour un montant de ${proforma.total_amount}€ à partir du devis ${proforma.id}`,
          metadata: JSON.stringify({ proforma_id: proforma.id, amount: proforma.total_amount })
        }
      });

      return invoice;
    });
  }

  // 2. Enregistrer un paiement (Caisse)
  async processPayment(dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoice_id },
      select: {
        id: true,
        total_paid: true,
        proforma: { select: { total_amount: true } }
      }
    });

    if (!invoice) throw new NotFoundException("Facture introuvable.");

    const totalAmount = invoice.proforma.total_amount;
    const currentPaid = invoice.total_paid;
    const remainingBefore = totalAmount - currentPaid;

    if (dto.amount > remainingBefore + 0.01) {
      throw new BadRequestException(
        `Le montant (${dto.amount}€) dépasse le solde restant dû (${remainingBefore.toFixed(2)}€).`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoice_id: dto.invoice_id,
          amount: dto.amount,
          method: dto.method,
        }
      });

      const newTotalPaid = currentPaid + dto.amount;
      const remainingAfter = totalAmount - newTotalPaid;

      const isFullyPaid = remainingAfter < 0.01;
      const newStatus = isFullyPaid ? 'paid' : 'partially_paid';

      const updatedInvoice = await tx.invoice.update({
        where: { id: dto.invoice_id },
        data: {
          total_paid: newTotalPaid,
          status: newStatus
        }
      });

      await tx.auditLog.create({
        data: {
          workspaceId: dto.workspaceId, 
          entity: 'payment',
          entityId: payment.id,
          action: 'payment_received',
          message: `Paiement de ${dto.amount}€ par ${dto.method}. Reste à payer : ${remainingAfter.toFixed(2)}€`,
          metadata: JSON.stringify({
            invoice_id: invoice.id,
            method: dto.method,
            status: newStatus
          })
        }
      });

      return { payment, updatedInvoice };
    });
  }

  // 3. Lister les factures impayées
  async findAllUnpaid(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: {
        proforma: { is: { workspaceId } },
        status: { in: ['unpaid', 'partially_paid'] }
      },
      select: {
        id: true,
        due_date: true,
        status: true,
        total_paid: true,
        proforma: {
          select: {
            id: true,
            intervention: {
              select: {
                id: true,
                appointment: {
                  select: {
                    id: true,
                    vehicle: {
                      select: {
                        id: true,
                        client: { select: { id: true, name: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { due_date: 'asc' }
    });
  }
}
