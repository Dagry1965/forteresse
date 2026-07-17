import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // Helpers de normalisation (majuscules)
  // ---------------------------------------------------------
  private normalizeStatus(status: string | undefined | null): string {
    if (!status) return 'PENDING';
    return status.trim().toUpperCase();
  }

  private normalizeType(type: string | undefined | null): string {
    if (!type) return 'INVOICE';
    return type.trim().toUpperCase();
  }

  // ---------------------------------------------------------
  // LIST ALL INVOICES
  // ---------------------------------------------------------
  async findAllInvoices(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: { workspace_id: workspaceId },
      include: {
        client: true,
        user: true,
        proforma: true,
        appointment: {
          include: {
            vehicle: true,
          },
        },
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ---------------------------------------------------------
  // FIND UNPAID INVOICES
  // ---------------------------------------------------------
  async findUnpaidInvoices(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: {
        workspace_id: workspaceId,
        status: 'PENDING',                    // corrigé
      },
      include: {
        client: true,
        user: true,
        proforma: true,
        appointment: {
          include: {
            vehicle: true,
          },
        },
        payments: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // ---------------------------------------------------------
  // GET PROFORMA
  // ---------------------------------------------------------
  async getProforma(id: string, workspaceId: string) {
    return this.prisma.proforma.findFirst({
      where: { id, workspace_id: workspaceId },
      include: {
        appointment: {
          include: {
            client: true,
            vehicle: true,
          },
        },
      },
    });
  }

  // ---------------------------------------------------------
  // GENERATE INVOICE FROM PROFORMA
  // ---------------------------------------------------------
  async generateInvoiceFromProforma(id: string, workspaceId: string, userId: string) {
    const proforma = await this.prisma.proforma.findFirst({
      where: { id, workspace_id: workspaceId },
    });

    if (!proforma) throw new BadRequestException('Proforma introuvable.');

    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { proforma_id: id },
    });

    if (existingInvoice) {
      throw new BadRequestException('Une facture existe déjà pour ce devis.');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: proforma.appointment_id },
    });

    if (!appointment) {
      throw new BadRequestException('Rendez-vous lié introuvable.');
    }

    return this.prisma.invoice.create({
      data: {
        reference: `INV-${Date.now()}`,
        total: proforma.total,
        status: this.normalizeStatus('pending'),     // → PENDING
        type: this.normalizeType('INVOICE'),        // → INVOICE
        workspace_id: workspaceId,
        proforma_id: id,
        appointment_id: proforma.appointment_id,
        client_id: appointment.client_id,
        user_id: userId,
      },
    });
  }

  // ---------------------------------------------------------
  // GET INVOICE
  // ---------------------------------------------------------
  async getInvoice(id: string, workspaceId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, workspace_id: workspaceId },
      include: {
        payments: true,
        proforma: true,
        appointment: {
          include: {
            client: true,
            vehicle: true,
          },
        },
      },
    });
  }

  // ---------------------------------------------------------
  // REGISTER PAYMENT
  // ---------------------------------------------------------
  async registerPayment(dto: any) {
    return this.prisma.payment.create({
      data: {
        amount: dto.amount,
        invoice_id: dto.invoice_id,
        method: dto.method ?? 'cash',
        workspace_id: dto.workspace_id,
        client_id: dto.client_id,
        user_id: dto.user_id,
      },
    });
  }

  // ---------------------------------------------------------
  // GET PENDING FLEET ITEMS
  // ---------------------------------------------------------
async getPendingFleetItems(workspaceId: string, clientId: string) {
  const data = await this.prisma.appointment.findMany({
    where: {
      workspace_id: workspaceId,
      client_id: clientId,
    },
    include: {
      vehicle: true,
      proformas: true // Assure-toi que c'est bien écrit au pluriel comme dans ton schema.prisma
    }
  });
  
  // LOG DE DEBUG : Regarde ton terminal noir NestJS après avoir rafraîchi la page
  console.log("Nombre de proformas sur le premier RDV:", data[0]?.proformas?.length);
  
  return data;
}


}