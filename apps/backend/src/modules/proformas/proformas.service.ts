import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common'; // 👈 Imports corrigés ici
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  PROFORMA_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  CASE_STATUS,
  INTERVENTION_STATUS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class ProformasService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // LISTER TOUS LES DEVIS
  // ---------------------------------------------------------
  async findAll(workspaceId: string) {
    return this.prisma.proforma.findMany({
      where: { workspace_id: workspaceId },
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
      where: { id, workspace_id: workspaceId },
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
          workspace_id: workspaceId
        }
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

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

        await tx.case.update({
          where: { id: proforma.case_id },
          data: {
            status: CASE_STATUS.IN_PROGRESS,
            updated_at: new Date()
          }
        });
      }

      return tx.proforma.findUnique({
        where: { id: proformaId }
      });
    });
  }

  async convertToInvoice(workspaceId: string, proformaId: string) {
    return this.prisma.$transaction(async (tx) => {
      const proforma = await tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId
        },
        include: {
          case: true,
          lines: true
        }
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

      const existingInvoice = await tx.invoice.findFirst({
        where: {
          proforma_id: proforma.id,
          workspace_id: workspaceId
        }
      });

      if (existingInvoice) {
        throw new BadRequestException('Ce devis a d?j? ?t? factur?');
      }

      if (!proforma.case_id || proforma.case?.status !== 'COMPLETED') {
        throw new BadRequestException(
          'Les travaux doivent ?tre termin?s avant la facturation'
        );
      }

      const invoice = await tx.invoice.create({
        data: {
          workspace_id: workspaceId,
          proforma_id: proforma.id,
          appointment_id: proforma.appointment_id,
          client_id: proforma.case.customer_id,
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
          reference: `FACT-${new Date().getFullYear()}-${Math.floor(
            1000 + Math.random() * 9000
          )}`,
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
          status: INVOICE_STATUS.UNPAID
        }
      });

      await tx.case.update({
        where: {
          id: proforma.case_id
        },
        data: {
          status: CASE_STATUS.INVOICED,
          updated_at: new Date()
        }
      });

      return invoice;
    });
  }
}
