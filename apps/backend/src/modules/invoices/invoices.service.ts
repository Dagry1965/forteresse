import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { SequencingService } from '../shared/sequencing.service';
import {
  APPOINTMENT_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  PAYMENT_SCHEDULE_STATUS,
  PROFORMA_STATUS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------
  // HELPERS DE NORMALISATION
  // ---------------------------------------------------------
  private normalizeStatus(status: string | undefined | null): string {
    const normalized =
      status?.trim().toUpperCase() || INVOICE_STATUS.UNPAID;
    const allowedStatuses = Object.values(INVOICE_STATUS) as string[];

    if (!allowedStatuses.includes(normalized)) {
      throw new BadRequestException(
        `Statut de facture invalide : ${normalized}.`,
      );
    }

    return normalized;
  }

  private normalizeType(type: string | undefined | null): string {
    const normalized =
      type?.trim().toUpperCase() || INVOICE_TYPE.INVOICE;
    const allowedTypes = Object.values(INVOICE_TYPE) as string[];

    if (!allowedTypes.includes(normalized)) {
      throw new BadRequestException(
        `Type de facture invalide : ${normalized}.`,
      );
    }

    return normalized;
  }

  // ---------------------------------------------------------
  // CREATE INVOICE (Simple / Individuelle)
  // ---------------------------------------------------------
  async create(
    workspaceId: string,
    userId: string,
    dto: any,
  ) {
    const status = this.normalizeStatus(dto.status);
    const type = this.normalizeType(dto.type);

    const [client, user] = await Promise.all([
      this.prisma.client.findFirst({
        where: {
          id: dto.client_id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      }),
      this.prisma.user.findFirst({
        where: {
          id: userId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      }),
    ]);

    if (!client) {
      throw new NotFoundException(
        'Client introuvable dans ce workspace.',
      );
    }

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable dans ce workspace.',
      );
    }

    const reference = await this.sequencingService.generateReference(
      workspaceId,
      'INVOICE',
    );

    return this.prisma.invoice.create({
      data: {
        reference,
        total: dto.total,
        status,
        type,
        workspace: { connect: { id: workspaceId } },
        client: { connect: { id: client.id } },
        user: { connect: { id: user.id } },
        customer_name_snapshot:
          client.company_name || client.name || null,
        customer_address_snapshot:
          client.address || null,
        customer_billing_address_snapshot:
          client.billing_address || client.address || null,
        customer_registration_number_snapshot:
          client.registration_number || null,
        customer_vat_number_snapshot:
          client.vat_number || null,
        customer_email_snapshot:
          client.email || null,
        customer_phone_snapshot:
          client.phone || null,
        ...(dto.proforma_id && { proforma: { connect: { id: dto.proforma_id } } }),
        ...(dto.appointment_id && { appointment: { connect: { id: dto.appointment_id } } }),
      },
      include: {
        client: true,
        user: true,
        proforma: true,
        appointment: true,
      },
    });
  }

  // ---------------------------------------------------------
  // CREATE GROUPED INVOICE (La méthode utilisée par Fleet/index.tsx)
  // Enrichie avec copie détaillée des lignes de chaque dossier
  // ---------------------------------------------------------
  async createGroupedInvoice(workspaceId: string, userId: string, dto: { client_id: string, appointment_ids: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer les dossiers avec le détail complet (Pièces/Main d'oeuvre)
      const appointments = await tx.appointment.findMany({
        where: {
          id: { in: dto.appointment_ids },
          workspace_id: workspaceId,
          client_id: dto.client_id,
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
            include: { lines: true },
          },
        },
      });

      if (appointments.length !== dto.appointment_ids.length) {
        throw new BadRequestException(
          'Un ou plusieurs rendez-vous sont introuvables pour ce client et ce workspace.',
        );
      }
// 2. Calculer le total global
      const totalAmount = appointments.reduce((sum, appt) => {
        const amount = appt.proformas?.[0]?.total || 0;
        return sum + Number(amount);
      }, 0);

      // 3. Client et utilisateur authentifie
      const client = await tx.client.findFirst({
        where: {
          id: dto.client_id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!client) {
        throw new NotFoundException('Client introuvable.');
      }

      const user = await tx.user.findFirst({
        where: {
          id: userId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException(
          'Utilisateur invalide pour creer la facture groupee.',
        );
      }

      // 4. Créer la Facture Parente
      const reference = await this.sequencingService.generateReference(
        workspaceId,
        'INVOICE',
        tx,
      );

      const invoice = await tx.invoice.create({
        data: {
          reference,
          total: totalAmount,
          status: INVOICE_STATUS.UNPAID,
          type: INVOICE_TYPE.FLEET,
          workspace_id: workspaceId,
          client_id: dto.client_id,
          user_id: user.id,
          created_by: user.id,
          updated_by: user.id,
          customer_name_snapshot:
            client.company_name || client.name || null,
          customer_address_snapshot:
            client.address || null,
          customer_billing_address_snapshot:
            client.billing_address || client.address || null,
          customer_registration_number_snapshot:
            client.registration_number || null,
          customer_vat_number_snapshot:
            client.vat_number || null,
          customer_email_snapshot:
            client.email || null,
          customer_phone_snapshot:
            client.phone || null
        }
      });

      // 5. RECOPIE DU DÉTAIL DE CHAQUE DOSSIER DANS LES LIGNES DE FACTURE
      for (const appt of appointments) {
        const proforma = appt.proformas?.[0];
        
        // A. Ligne d'en-tête pour séparer les véhicules
        await tx.invoiceLine.create({
          data: {
            invoice_id: invoice.id,
            type: 'HEADER',
            label: `--- VÉHICULE : ${appt.vehicle?.registration} (${appt.vehicle?.brand}) ---`,
            quantity: 0, unit_price: 0, vat_rate: 0, discount: 0, total: 0
          }
        });

        // B. Copie des lignes réelles (Pièces, Main d'œuvre, etc.)
        if (proforma?.lines) {
          for (const line of proforma.lines) {
            await tx.invoiceLine.create({
              data: {
                invoice_id: invoice.id,
                type: line.type,
                label: line.label,
                quantity: line.quantity,
                unit_price: line.unit_price,
                vat_rate: line.vat_rate,
                discount: line.discount,
                total: line.total
              }
            });
          }
        }

      }

      // 6. Création de l'échéancier automatique à 30 jours
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await tx.paymentSchedule.create({
        data: {
          invoice_id: invoice.id,
          amount: totalAmount,
          due_date: dueDate,
          status: PAYMENT_SCHEDULE_STATUS.PENDING,
          workspace_id: workspaceId
        }
      });

      await this.auditService.log(
        {
          action: 'CREATE_GROUPED_FLEET_INVOICE',
          entity: 'Invoice',
          entityId: invoice.id,
          userId: user.id,
          newData: {
            invoiceId: invoice.id,
            reference: invoice.reference,
            clientId: dto.client_id,
            appointmentIds: dto.appointment_ids,
            total: Number(invoice.total),
            status: invoice.status,
            type: invoice.type,
          },
        },
        tx,
      );

      return invoice;
    });
  }

  // ---------------------------------------------------------
  // FIND ONE & GET FULL INVOICE (Pour Impression PDF)
  // ---------------------------------------------------------
  async findOne(id: string, workspaceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: null },
      include: {
        client: true,
        user: { select: { name: true } },
        lines: { orderBy: { created_at: 'asc' } },
        payments: true
      },
    });
    if (!invoice) throw new NotFoundException(`Facture introuvable`);
    return invoice;
  }

  async getFullInvoice(id: string, workspaceId: string) {
    return this.findOne(id, workspaceId);
  }

  // ---------------------------------------------------------
  // LISTING & FILTRES
  // ---------------------------------------------------------
  async findAll(workspaceId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      include: {
        client: true,
        payments: true,
        paymentSchedules: {
          orderBy: { due_date: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return invoices;
  }

  async findUnpaidInvoices(workspaceId: string) {
    return this.prisma.invoice.findMany({
      where: {
        workspace_id: workspaceId,
        status: INVOICE_STATUS.UNPAID,
        deleted_at: null,
      },
      include: {
        client: true,
        user: { select: { name: true } },
      },
    });
  }

  // ---------------------------------------------------------
  // MÉTHODES DE COMPATIBILITÉ (Gardées pour ne rien casser)
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // CANCEL INVOICE
  // ---------------------------------------------------------
  async cancelInvoice(
    workspaceId: string,
    invoiceId: string,
    userId: string,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: invoiceId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          payments: {
            where: { deleted_at: null },
            select: { id: true, amount: true },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException(
          'Facture introuvable dans ce workspace.',
        );
      }

      const user = await tx.user.findFirst({
        where: {
          id: userId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException(
          'Utilisateur invalide pour annuler la facture.',
        );
      }

      if (invoice.status === INVOICE_STATUS.CANCELLED) {
        return invoice;
      }

      if (
        invoice.status === INVOICE_STATUS.PAID ||
        invoice.status === INVOICE_STATUS.PARTIALLY_PAID ||
        invoice.payments.length > 0
      ) {
        throw new BadRequestException(
          'Une facture encaissee ne peut pas etre annulee directement. Un avoir est requis.',
        );
      }

      const cancelledInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: INVOICE_STATUS.CANCELLED,
          updated_by: user.id,
          updated_at: new Date(),
        },
      });

      await tx.paymentSchedule.updateMany({
        where: {
          invoice_id: invoice.id,
          workspace_id: workspaceId,
          status: PAYMENT_SCHEDULE_STATUS.PENDING,
        },
        data: {
          status: PAYMENT_SCHEDULE_STATUS.CANCELLED,
          updated_at: new Date(),
        },
      });

      await this.auditService.log(
        {
          action: 'CANCEL_INVOICE',
          entity: 'Invoice',
          entityId: invoice.id,
          userId: user.id,
          oldData: {
            status: invoice.status,
          },
          newData: {
            status: cancelledInvoice.status,
            reason: reason?.trim() || null,
          },
        },
        tx,
      );

      return cancelledInvoice;
    });
  }

  // ---------------------------------------------------------
  // CREATE CREDIT NOTE
  // ---------------------------------------------------------
  async createCreditNote(
    workspaceId: string,
    invoiceId: string,
    userId: string,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: {
          id: invoiceId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          lines: {
            orderBy: { created_at: 'asc' },
          },
          creditNotes: {
            where: { deleted_at: null },
            select: { id: true, reference: true },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundException(
          'Facture introuvable dans ce workspace.',
        );
      }

      const user = await tx.user.findFirst({
        where: {
          id: userId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException(
          'Utilisateur invalide pour creer un avoir.',
        );
      }

      if (invoice.type === INVOICE_TYPE.CREDIT_NOTE) {
        throw new BadRequestException(
          'Un avoir ne peut pas faire l objet d un nouvel avoir.',
        );
      }

      if (invoice.creditNotes.length > 0) {
        throw new BadRequestException(
          `Un avoir existe deja pour cette facture : ${invoice.creditNotes[0].reference}.`,
        );
      }

      if (
        invoice.status !== INVOICE_STATUS.PAID &&
        invoice.status !== INVOICE_STATUS.PARTIALLY_PAID
      ) {
        throw new BadRequestException(
          'Un avoir est reserve aux factures payees ou partiellement payees.',
        );
      }

      const reference = await this.sequencingService.generateReference(
        workspaceId,
        'CREDIT_NOTE',
        tx,
      );

      const creditNote = await tx.invoice.create({
        data: {
          reference,
          total: -Math.abs(Number(invoice.total)),
          status: INVOICE_STATUS.UNPAID,
          type: INVOICE_TYPE.CREDIT_NOTE,
          workspace_id: workspaceId,
          original_invoice_id: invoice.id,
          appointment_id: invoice.appointment_id,
          user_id: user.id,
          client_id: invoice.client_id,
          created_by: user.id,
          updated_by: user.id,
          customer_name_snapshot: invoice.customer_name_snapshot,
          customer_address_snapshot: invoice.customer_address_snapshot,
          customer_billing_address_snapshot:
            invoice.customer_billing_address_snapshot,
          customer_registration_number_snapshot:
            invoice.customer_registration_number_snapshot,
          customer_vat_number_snapshot:
            invoice.customer_vat_number_snapshot,
          customer_email_snapshot: invoice.customer_email_snapshot,
          customer_phone_snapshot: invoice.customer_phone_snapshot,
        },
      });

      for (const line of invoice.lines) {
        await tx.invoiceLine.create({
          data: {
            invoice_id: creditNote.id,
            type: line.type,
            label: line.label,
            description: line.description,
            quantity: line.quantity.negated(),
            unit_price: line.unit_price,
            vat_rate: line.vat_rate,
            discount: line.discount,
            total: line.total.negated(),
          },
        });
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: INVOICE_STATUS.CANCELLED,
          updated_by: user.id,
          updated_at: new Date(),
        },
      });

      await tx.paymentSchedule.updateMany({
        where: {
          invoice_id: invoice.id,
          workspace_id: workspaceId,
          status: PAYMENT_SCHEDULE_STATUS.PENDING,
        },
        data: {
          status: PAYMENT_SCHEDULE_STATUS.CANCELLED,
          updated_at: new Date(),
        },
      });

      await this.auditService.log(
        {
          action: 'CREATE_CREDIT_NOTE',
          entity: 'Invoice',
          entityId: creditNote.id,
          userId: user.id,
          oldData: {
            originalInvoiceId: invoice.id,
            originalInvoiceReference: invoice.reference,
            originalInvoiceStatus: invoice.status,
          },
          newData: {
            creditNoteId: creditNote.id,
            creditNoteReference: creditNote.reference,
            total: Number(creditNote.total),
            reason: reason?.trim() || null,
          },
        },
        tx,
      );

      return creditNote;
    });
  }

  async createGroupedFleetInvoice(workspaceId: string, userId: string, dto: { client_id: string; appointment_ids: string[] }) {
    // Redirige vers la nouvelle logique détaillée
    return this.createGroupedInvoice(workspaceId, userId, dto);
  }

}
