import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ProformasService } from '../proformas/proformas.service';
import { PaymentsService } from './payments.service';
import {
  APPOINTMENT_STATUS,
  INVOICE_STATUS,
  PROFORMA_STATUS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly proformasService: ProformasService,
  ) {}

  // ---------------------------------------------------------
  // Helpers de normalisation (majuscules)
  // ---------------------------------------------------------


  // ---------------------------------------------------------
  // LIST ALL INVOICES
  // ---------------------------------------------------------
  async findAllInvoices(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
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
        deleted_at: null,
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
      where: { id, workspace_id: workspaceId, deleted_at: null },
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
  async generateInvoiceFromProforma(
    id: string,
    workspaceId: string,
    userId: string,
  ) {
    return this.proformasService.convertToInvoice(
      workspaceId,
      id,
      userId,
    );
  }

  // ---------------------------------------------------------
  // GET INVOICE
  // ---------------------------------------------------------
  async getInvoice(id: string, workspaceId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: null },
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
    userId: string,
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
    return this.prisma.appointment.findMany({
      where: {
        workspace_id: workspaceId,
        client_id: clientId,
        deleted_at: null,
        status: APPOINTMENT_STATUS.COMPLETED,
        proformas: {
          some: {
            deleted_at: null,
            status: PROFORMA_STATUS.ACCEPTED,
          },
        },
      },
      include: {
        vehicle: true,
        proformas: {
          where: {
            deleted_at: null,
            status: PROFORMA_STATUS.ACCEPTED,
          },
        },
      },
    });
  }


}
