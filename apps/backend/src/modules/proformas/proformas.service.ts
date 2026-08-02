import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common'; // 👈 Imports corrigés ici
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { SequencingService } from '../shared/sequencing.service';
import {
  PROFORMA_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  CASE_STATUS,
  INTERVENTION_STATUS,
  PAYMENT_SCHEDULE_STATUS,
  PROFORMA_STATUS_TRANSITIONS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class ProformasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
    private readonly auditService: AuditService,
  ) {}

  private assertStatusTransition(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions = PROFORMA_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        'Transition de proforma interdite : '
          + currentStatus
          + ' -> '
          + nextStatus,
      );
    }
  }

  // ---------------------------------------------------------
  // LISTER TOUS LES DEVIS
  // ---------------------------------------------------------
  async findAll(workspaceId: string) {
    return this.prisma.proforma.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      include: {
        case: {
          include: { client: true, vehicle: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // ---------------------------------------------------------
  // RÉCUPÉRER UN DEVIS DÉTAILLÉ
  // ---------------------------------------------------------
  async findOne(workspaceId: string, id: string) {
    return this.prisma.proforma.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: null },
      include: {
        case: {
          include: { 
            client: true, 
            vehicle: true,
            interventions: {
              include: { 
                InterventionPart: { include: { item: true } } 
              }
            }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------
  // TRANSFORMER UN DEVIS EN FACTURE DÉFINITIVE
  // ---------------------------------------------------------
  async acceptProforma(workspaceId: string, proformaId: string) {
    return this.prisma.$transaction(async (tx) => {
      const proforma = await tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId,
          deleted_at: null,
        }
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

      if (proforma.status === PROFORMA_STATUS.ACCEPTED) {
        return proforma;
      }

      this.assertStatusTransition(
        proforma.status,
        PROFORMA_STATUS.ACCEPTED,
      );

      await tx.proforma.update({
        where: { id: proformaId },
        data: { status: PROFORMA_STATUS.ACCEPTED }
      });

      if (proforma.case_id) {
        await tx.intervention.updateMany({
          where: {
            case_id: proforma.case_id,
            workspace_id: workspaceId,
            deleted_at: null,
            status: {
              in: [INTERVENTION_STATUS.PENDING, INTERVENTION_STATUS.DIAGNOSIS]
            }
          },
          data: {
            status: INTERVENTION_STATUS.IN_PROGRESS,
            updated_at: new Date()
          }
        });

        const updatedCase = await tx.case.updateMany({
          where: {
            id: proforma.case_id,
            workspace_id: workspaceId,
          },
          data: {
            status: CASE_STATUS.IN_PROGRESS,
            updated_at: new Date(),
          },
        });

        if (updatedCase.count === 0) {
          throw new NotFoundException(
            'Dossier introuvable dans ce workspace',
          );
        }
      }

      return tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });
    });
  }

  async convertToInvoice(
    workspaceId: string,
    proformaId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const proforma = await tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        include: {
          case: true,
          lines: true
        }
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

      if (proforma.status !== PROFORMA_STATUS.ACCEPTED) {
        throw new BadRequestException(
          'Seule une proforma acceptée peut être transformée en facture',
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
          'Utilisateur invalide pour generer la facture.',
        );
      }

      const existingInvoice = await tx.invoice.findFirst({
        where: {
          proforma_id: proforma.id,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (existingInvoice) {
        throw new BadRequestException('Ce devis a d\u00e9j\u00e0 \u00e9t\u00e9 factur\u00e9');
      }

      if (!proforma.case_id || proforma.case?.status !== CASE_STATUS.COMPLETED) {
        throw new BadRequestException(
          'Les travaux doivent \u00eatre termin\u00e9s avant la facturation'
        );
      }

      const reference = await this.sequencingService.generateReference(
        workspaceId,
        'INVOICE',
        tx,
      );

      const invoice = await tx.invoice.create({
        data: {
          workspace_id: workspaceId,
          proforma_id: proforma.id,
          appointment_id: proforma.appointment_id,
          client_id: proforma.case.customer_id,
          user_id: user.id,
          created_by: user.id,
          updated_by: user.id,
          total: proforma.total,
          status: INVOICE_STATUS.UNPAID,
          type: INVOICE_TYPE.INVOICE,
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
          reference,
          lines: {
            create: proforma.lines.map((line) => ({
              type: line.type,
              label: line.label,
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              vat_rate: line.vat_rate,
              discount: line.discount,
              total: line.total
            }))
          }
        },
        include: {
          lines: true
        }
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await tx.paymentSchedule.create({
        data: {
          invoice_id: invoice.id,
          workspace_id: workspaceId,
          amount: Number(invoice.total),
          due_date: dueDate,
          status: PAYMENT_SCHEDULE_STATUS.PENDING
        }
      });

      const invoicedCase = await tx.case.updateMany({
        where: {
          id: proforma.case_id,
          workspace_id: workspaceId,
        },
        data: {
          status: CASE_STATUS.INVOICED,
          updated_at: new Date(),
        },
      });

      if (invoicedCase.count === 0) {
        throw new NotFoundException(
          'Dossier introuvable dans ce workspace',
        );
      }

      await this.auditService.log(
        {
          action: 'CREATE_INVOICE_FROM_PROFORMA',
          entity: 'Invoice',
          entityId: invoice.id,
          userId: user.id,
          newData: {
            invoiceId: invoice.id,
            reference: invoice.reference,
            proformaId: proforma.id,
            caseId: proforma.case_id,
            clientId: proforma.case.customer_id,
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
}
