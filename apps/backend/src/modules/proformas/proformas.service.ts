import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common'; // 👈 Imports corrigés ici
import { PrismaService } from '../../core/prisma/prisma.service';

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
        data: { status: 'ACCEPTED' }
      });

      if (proforma.case_id) {
        await tx.intervention.updateMany({
          where: {
            case_id: proforma.case_id,
            workspace_id: workspaceId,
            deleted_at: null,
            status: {
              in: ['PENDING', 'DIAGNOSIS']
            }
          },
          data: {
            status: 'IN_PROGRESS',
            updated_at: new Date()
          }
        });

        await tx.case.update({
          where: { id: proforma.case_id },
          data: {
            status: 'IN_PROGRESS',
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
          case: true
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
          status: 'UNPAID',
          type: 'INVOICE',
          reference: `FACT-${new Date().getFullYear()}-${Math.floor(
            1000 + Math.random() * 9000
          )}`
        }
      });

      await tx.case.update({
        where: {
          id: proforma.case_id
        },
        data: {
          status: 'INVOICED',
          updated_at: new Date()
        }
      });

      return invoice;
    });
  }
}
