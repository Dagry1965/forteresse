import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common'; // 👈 Imports corrigés ici
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { SequencingService } from '../shared/sequencing.service';
import { Prisma } from '@prisma/client';
import { CreateProformaLineDto } from './dto/create-proforma-line.dto';
import { UpdateProformaLineDto } from './dto/update-proforma-line.dto';
import {
  PROFORMA_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  CASE_STATUS,
  INTERVENTION_STATUS,
  PAYMENT_SCHEDULE_STATUS,
  PROFORMA_STATUS_TRANSITIONS,
  PROFORMA_LINE_TYPE,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class ProformasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
    private readonly auditService: AuditService,
  ) {}

  private calculateLineTotal(
    type: string,
    quantity: number,
    unitPrice: number,
    vatRate: number,
    discount: number,
  ): Prisma.Decimal {
    const quantityDecimal = new Prisma.Decimal(quantity);
    const unitPriceDecimal = new Prisma.Decimal(unitPrice);
    const vatRateDecimal = new Prisma.Decimal(vatRate);
    const discountDecimal = new Prisma.Decimal(discount);

    const subtotal = quantityDecimal.mul(unitPriceDecimal);
    const afterDiscount = subtotal.mul(
      new Prisma.Decimal(1).minus(discountDecimal.div(100)),
    );
    const totalWithVat = afterDiscount.mul(
      new Prisma.Decimal(1).plus(vatRateDecimal.div(100)),
    );

    const signedTotal =
      type === PROFORMA_LINE_TYPE.DISCOUNT
        ? totalWithVat.abs().negated()
        : totalWithVat;

    return new Prisma.Decimal(signedTotal.toFixed(2));
  }

  private async recalculateProformaTotal(
    proformaId: string,
    tx: Prisma.TransactionClient,
  ) {
    const lines = await tx.proformaLine.findMany({
      where: { proforma_id: proformaId },
      select: { total: true },
    });

    const total = lines.reduce(
      (sum, line) => sum.plus(line.total),
      new Prisma.Decimal(0),
    );

    await tx.proforma.update({
      where: { id: proformaId },
      data: { total: Number(total.toFixed(2)) },
    });

    return new Prisma.Decimal(total.toFixed(2));
  }

  private assertEditableProforma(status: string) {
    if (status !== PROFORMA_STATUS.DRAFT) {
      throw new BadRequestException(
        'Seul un devis en brouillon peut etre modifie.',
      );
    }
  }

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
        lines: true,
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
        lines: true,
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

      const lineCount = await tx.proformaLine.count({
        where: { proforma_id: proformaId },
      });

      if (lineCount === 0) {
        throw new BadRequestException(
          'Impossible d\u2019accepter un devis sans ligne',
        );
      }

      await this.recalculateProformaTotal(proformaId, tx);

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
        include: {
          lines: true,
        },
      });
    });
  }

  async addLine(
    workspaceId: string,
    proformaId: string,
    dto: CreateProformaLineDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const proforma = await tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

      this.assertEditableProforma(proforma.status);

      const discount = dto.discount ?? 0;
      const total = this.calculateLineTotal(
        dto.type,
        dto.quantity,
        dto.unit_price,
        dto.vat_rate,
        discount,
      );

      const line = await tx.proformaLine.create({
        data: {
          proforma_id: proforma.id,
          type: dto.type,
          label: dto.label.trim(),
          description: dto.description?.trim() || null,
          quantity: new Prisma.Decimal(dto.quantity),
          unit_price: new Prisma.Decimal(dto.unit_price),
          vat_rate: new Prisma.Decimal(dto.vat_rate),
          discount: new Prisma.Decimal(discount),
          total,
        },
      });

      await this.recalculateProformaTotal(proforma.id, tx);

      return line;
    });
  }

  async updateLine(
    workspaceId: string,
    proformaId: string,
    lineId: string,
    dto: UpdateProformaLineDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const proforma = await tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

      this.assertEditableProforma(proforma.status);

      const existingLine = await tx.proformaLine.findFirst({
        where: {
          id: lineId,
          proforma_id: proforma.id,
        },
      });

      if (!existingLine) {
        throw new NotFoundException('Ligne de devis introuvable');
      }

      const type = dto.type ?? existingLine.type;
      const quantity = dto.quantity ?? Number(existingLine.quantity);
      const unitPrice = dto.unit_price ?? Number(existingLine.unit_price);
      const vatRate = dto.vat_rate ?? Number(existingLine.vat_rate);
      const discount = dto.discount ?? Number(existingLine.discount);

      const total = this.calculateLineTotal(
        type,
        quantity,
        unitPrice,
        vatRate,
        discount,
      );

      const line = await tx.proformaLine.update({
        where: { id: existingLine.id },
        data: {
          type,
          label:
            dto.label !== undefined
              ? dto.label.trim()
              : existingLine.label,
          description:
            dto.description !== undefined
              ? dto.description.trim() || null
              : existingLine.description,
          quantity: new Prisma.Decimal(quantity),
          unit_price: new Prisma.Decimal(unitPrice),
          vat_rate: new Prisma.Decimal(vatRate),
          discount: new Prisma.Decimal(discount),
          total,
        },
      });

      await this.recalculateProformaTotal(proforma.id, tx);

      return line;
    });
  }

  async removeLine(
    workspaceId: string,
    proformaId: string,
    lineId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const proforma = await tx.proforma.findFirst({
        where: {
          id: proformaId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
      });

      if (!proforma) {
        throw new NotFoundException('Proforma introuvable');
      }

      this.assertEditableProforma(proforma.status);

      const line = await tx.proformaLine.findFirst({
        where: {
          id: lineId,
          proforma_id: proforma.id,
        },
      });

      if (!line) {
        throw new NotFoundException('Ligne de devis introuvable');
      }

      await tx.proformaLine.delete({
        where: { id: line.id },
      });

      const total = await this.recalculateProformaTotal(
        proforma.id,
        tx,
      );

      return {
        success: true,
        total: Number(total),
      };
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
