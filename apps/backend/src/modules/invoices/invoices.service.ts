import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SequencingService } from '../shared/sequencing.service';
import {
  APPOINTMENT_STATUS,
  CASE_STATUS,
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
  async createFleetInvoice(workspaceId: string, userId: string, clientId: string) {
    // Version simplifiée pour un seul client
    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: {
          id: clientId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!client) {
        throw new NotFoundException('Client introuvable.');
      }

      const pendingCases = await tx.case.findMany({
        where: { workspace_id: workspaceId, customer_id: clientId, status: CASE_STATUS.COMPLETED },
        include: {
          proformas: {
            where: { deleted_at: null },
          },
        },
      });
      if (pendingCases.length === 0) throw new Error("Aucun dossier trouvé.");
      const totalAmount = pendingCases.reduce((sum, c) => sum + (c.proformas[0]?.total || 0), 0);
      const reference = await this.sequencingService.generateReference(
        workspaceId,
        'INVOICE',
        tx,
      );

      return tx.invoice.create({
        data: {
          reference,
          total: totalAmount,
          status: INVOICE_STATUS.UNPAID,
          type: INVOICE_TYPE.FLEET,
          workspace_id: workspaceId,
          client_id: clientId,
          user_id: userId,
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
        },
      });
    });
  }

  async createGroupedFleetInvoice(workspaceId: string, userId: string, dto: { client_id: string; appointment_ids: string[] }) {
    // Redirige vers la nouvelle logique détaillée
    return this.createGroupedInvoice(workspaceId, userId, dto);
  }

  // ---------------------------------------------------------
  // UPDATE & REMOVE
  // ---------------------------------------------------------
  async update(workspaceId: string, id: string, dto: any) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        'Facture introuvable dans ce workspace',
      );
    }

    const data: any = { ...dto };

    delete data.workspace_id;
    delete data.workspaceId;
    delete data.client_id;
    delete data.user_id;

    if ('status' in dto) {
      data.status = this.normalizeStatus(dto.status);
    }

    if ('type' in dto) {
      data.type = this.normalizeType(dto.type);
    }

    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data,
    });
  }

  async remove(workspaceId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        'Facture introuvable dans ce workspace',
      );
    }

    return this.prisma.invoice.delete({
      where: { id: invoice.id },
    });
  }
}
