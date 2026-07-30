import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaymentsService } from './payments.service';
import {
  INVOICE_STATUS,
  INVOICE_TYPE,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // ---------------------------------------------------------
  // Helpers de normalisation (majuscules)
  // ---------------------------------------------------------


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
        status: INVOICE_STATUS.UNPAID,
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
        status: INVOICE_STATUS.UNPAID,
        type: INVOICE_TYPE.INVOICE,
        workspace_id: workspaceId,
        proforma_id: id,
        appointment_id: proforma.appointment_id,
        client_id: appointment.client_id,
        user_id: userId,
        customer_name_snapshot:
          proforma.customer_name_snapshot,
        customer_address_snapshot:
          proforma.customer_address_snapshot,
        customer_billing_address_snapshot:
          proforma.customer_billing_address_snapshot,
        customer_registration_number_snapshot:
          proforma.customer_registration_number_snapshot,
        customer_vat_number_snapshot:
          proforma.customer_vat_number_snapshot,
        customer_email_snapshot:
          proforma.customer_email_snapshot,
        customer_phone_snapshot:
          proforma.customer_phone_snapshot,
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
  async registerPayment(
    workspaceId: string,
    invoiceId: string,
    amount: number,
    method: string,
    userId?: string,
    reference?: string,
    notes?: string,
  ) {
    return this.paymentsService.recordInvoicePayment(
      workspaceId,
      {
        invoice_id: invoiceId,
        amount,
        method,
        user_id: userId,
        reference,
        notes,
      },
    );
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
  
  
  return data;
}


}
