import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SequencingService } from '../shared/sequencing.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';

import {
  INTERVENTION_STATUS,
  PROFORMA_STATUS,
  INTERVENTION_STATUS_TRANSITIONS,
  STOCK_MOVEMENT_TYPE,
} from '../../../../../shared/constants/status.constants';

type UpdateInterventionPayload = UpdateInterventionDto & {
  description?: string;
  status?: string;
  caseId?: string;
  case_id?: string;
};

@Injectable()
export class InterventionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
  ) {}

  private async assertActiveUser(
    workspaceId: string,
    userId: string,
    client: any = this.prisma,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'Utilisateur authentifie requis.',
      );
    }

    const user = await client.user.findFirst({
      where: {
        id: userId,
        workspace_id: workspaceId,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(
        'Utilisateur introuvable dans ce workspace.',
      );
    }

    return user;
  }

  private assertStatusTransition(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions =
      INTERVENTION_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        'Transition d\u2019intervention interdite : '
          + currentStatus
          + ' -> '
          + nextStatus,
      );
    }
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateInterventionDto,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId est requis.');
    }

    if (!dto.case_id) {
      throw new BadRequestException('case_id est requis pour créer une intervention.');
    }

    if (!dto.appointment_id) {
      throw new BadRequestException('appointment_id est requis pour créer une intervention.');
    }

    const description = dto.description?.trim();

    if (!description) {
      throw new BadRequestException('La description de l’intervention est requise.');
    }

    const parts = Array.isArray(dto.parts) ? dto.parts : [];

    const repairCase = await this.prisma.case.findFirst({
      where: {
        id: dto.case_id,
        workspace_id: workspaceId,
      },
    });

    if (!repairCase) {
      throw new NotFoundException('Dossier introuvable dans ce workspace.');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: dto.appointment_id,
        workspace_id: workspaceId,
        deleted_at: null,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable dans ce workspace.');
    }

    if (repairCase.customer_id && appointment.client_id !== repairCase.customer_id) {
      throw new BadRequestException('Le rendez-vous ne correspond pas au client du dossier.');
    }

    if (repairCase.vehicle_id && appointment.vehicle_id !== repairCase.vehicle_id) {
      throw new BadRequestException('Le rendez-vous ne correspond pas au véhicule du dossier.');
    }

    const uniqueItemIds = new Set<string>();
    for (const part of parts) {
      if (!part?.item_id) {
        throw new BadRequestException('item_id est requis pour chaque pièce.');
      }
      const quantity = Number(part.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException(`La quantité de l’article ${part.item_id} doit être un entier supérieur à zéro.`);
      }
      if (uniqueItemIds.has(part.item_id)) {
        throw new BadRequestException(`L’article ${part.item_id} apparaît plusieurs fois.`);
      }
      uniqueItemIds.add(part.item_id);
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await this.assertActiveUser(
        workspaceId,
        userId,
        tx,
      );

      const validatedParts: Array<{
        item_id: string;
        quantity: number;
        price_snapshot: number;
      }> = [];

      for (const part of parts) {
        const quantity = Number(part.quantity);
        const stockItem = await tx.stockItem.findFirst({
          where: {
            id: part.item_id,
            workspace_id: workspaceId,
            deleted_at: null,
          },
        });

        if (!stockItem) {
          throw new NotFoundException(`Article introuvable : ${part.item_id}.`);
        }

        if (stockItem.quantity < quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour "${stockItem.name}". Disponible : ${stockItem.quantity}, demandé : ${quantity}.`,
          );
        }

        validatedParts.push({
          item_id: stockItem.id,
          quantity,
          price_snapshot: Number(stockItem.price_sell ?? 0),
        });
      }

      const intervention = await tx.intervention.create({
        data: {
          workspace_id: workspaceId,
          case_id: repairCase.id,
          description,
          status: INTERVENTION_STATUS.DIAGNOSIS,
          // CORRECTION ICI : Structure propre pour InterventionPart.create
          ...(validatedParts.length > 0
            ? {
                InterventionPart: {
                  create: validatedParts.map((part) => ({
                    item_id: part.item_id,
                    quantity: part.quantity,
                    price_snapshot: part.price_snapshot,
                  })),
                },
              }
            : {}),
        },
        include: {
          case: { include: { client: true, vehicle: true } },
          InterventionPart: {
          where: { deleted_at: null },
          include: { item: true },
        },
        },
      });

      for (const part of intervention.InterventionPart) {
        await tx.stockItem.update({
          where: { id: part.item_id },
          data: { quantity: { decrement: part.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            workspace_id: workspaceId,
            item_id: part.item_id,
            intervention_part_id: part.id,
            quantity: -part.quantity,
            type: STOCK_MOVEMENT_TYPE.OUT_WORKSHOP,
            created_by: user.id,
          },
        });
      }

      return intervention;
    });
  }

  // ... (Reste des méthodes : findAll, findOne, update, remove, addPart, removePart, etc.)
  // Assurez-vous que le reste du fichier suit bien le code que vous avez déjà fourni.
  
  async findAll(workspaceId: string) {
    return this.prisma.intervention.findMany({
      where: { workspace_id: workspaceId, deleted_at: null },
      include: {
        InterventionPart: {
          where: { deleted_at: null },
          include: { item: true },
        },
        case: {
          include: {
            client: true,
            vehicle: true,
            proformas: {
              where: { deleted_at: null },
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const intervention = await this.prisma.intervention.findFirst({
      where: { id, workspace_id: workspaceId, deleted_at: null },
      include: {
        case: { include: { client: true, vehicle: true } },
        InterventionPart: {
          where: { deleted_at: null },
          include: { item: true },
        },
      },
    });
    if (!intervention) throw new NotFoundException('Intervention introuvable.');
    return intervention;
  }

  async update(workspaceId: string, id: string, dto: UpdateInterventionDto) {
    const existingIntervention = await this.findOne(workspaceId, id);
    const payload = dto as UpdateInterventionPayload;
    const nextCaseId = payload.case_id ?? payload.caseId;

    if (nextCaseId) {
      const repairCase = await this.prisma.case.findFirst({
        where: { id: nextCaseId, workspace_id: workspaceId },
      });
      if (!repairCase) throw new NotFoundException('Le nouveau dossier associé est introuvable.');
    }

    const updateData: any = { updated_at: new Date() };
    if (payload.description !== undefined) updateData.description = payload.description.trim();
    if (payload.status !== undefined) {
      this.assertStatusTransition(
        existingIntervention.status,
        payload.status,
      );
      updateData.status = payload.status;
    }
    if (nextCaseId !== undefined) updateData.case_id = nextCaseId;

    return this.prisma.intervention.update({
      where: { id: existingIntervention.id },
      data: updateData,
      include: {
        case: { include: { client: true, vehicle: true } },
        InterventionPart: {
          where: { deleted_at: null },
          include: { item: true },
        },
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    const intervention = await this.findOne(workspaceId, id);
    return this.prisma.intervention.update({
      where: { id: intervention.id },
      data: { deleted_at: new Date() },
    });
  }

  async getMetrics(workspaceId: string) {
    const [total, pending, inProgress, completed] = await Promise.all([
      this.prisma.intervention.count({ where: { workspace_id: workspaceId, deleted_at: null } }),
      this.prisma.intervention.count({ where: { workspace_id: workspaceId, status: INTERVENTION_STATUS.PENDING, deleted_at: null } }),
      this.prisma.intervention.count({ where: { workspace_id: workspaceId, status: INTERVENTION_STATUS.IN_PROGRESS, deleted_at: null } }),
      this.prisma.intervention.count({ where: { workspace_id: workspaceId, status: INTERVENTION_STATUS.COMPLETED, deleted_at: null } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newCasesToday = await this.prisma.case.count({
      where: { workspace_id: workspaceId, created_at: { gte: today } },
    });

    return { total, pending, inProgress, completed, newCasesToday };
  }

  async addPart(
    workspaceId: string,
    interventionId: string,
    userId: string,
    dto: { item_id: string; quantity: number },
  ) {
    const quantity = Number(dto.quantity);
    return this.prisma.$transaction(async (tx) => {
      const user = await this.assertActiveUser(
        workspaceId,
        userId,
        tx,
      );

      const intervention = await tx.intervention.findFirst({
        where: { id: interventionId, workspace_id: workspaceId, deleted_at: null },
      });
      if (!intervention) throw new NotFoundException('Intervention introuvable.');

      const stockItem = await tx.stockItem.findFirst({
        where: { id: dto.item_id, workspace_id: workspaceId, deleted_at: null },
      });
      if (!stockItem) throw new NotFoundException('Article introuvable.');
      if (stockItem.quantity < quantity) throw new BadRequestException(`Stock insuffisant.`);

      const part = await tx.interventionPart.create({
        data: {
          intervention_id: intervention.id,
          item_id: stockItem.id,
          quantity,
          price_snapshot: Number(stockItem.price_sell ?? 0),
        },
        include: { item: true },
      });

      await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: { decrement: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          workspace_id: workspaceId,
          item_id: stockItem.id,
          intervention_part_id: part.id,
          quantity: -quantity,
          type: STOCK_MOVEMENT_TYPE.OUT_WORKSHOP,
          created_by: user.id,
        },
      });

      return part;
    });
  }

  async removePart(
    workspaceId: string,
    partId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await this.assertActiveUser(
        workspaceId,
        userId,
        tx,
      );

      const part = await tx.interventionPart.findFirst({
        where: {
          id: partId,
          deleted_at: null,
          intervention: { workspace_id: workspaceId, deleted_at: null },
        },
        include: { item: true },
      });
      if (!part) throw new NotFoundException('Pièce introuvable.');

      await tx.interventionPart.update({
        where: { id: part.id },
        data: { deleted_at: new Date() },
      });

      await tx.stockItem.update({
        where: { id: part.item_id },
        data: { quantity: { increment: part.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          workspace_id: workspaceId,
          item_id: part.item_id,
          intervention_part_id: part.id,
          quantity: part.quantity,
          type: STOCK_MOVEMENT_TYPE.IN_RETURN,
          created_by: user.id,
        },
      });
      return { success: true };
    });
  }

  async getCaseDetails(workspaceId: string, caseId: string) {
    const repairCase = await this.prisma.case.findFirst({
      where: { id: caseId, workspace_id: workspaceId },
      include: {
        client: true,
        vehicle: true,
        proformas: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        interventions: {
          where: { deleted_at: null },
          include: { InterventionPart: {
          where: { deleted_at: null },
          include: { item: true },
        } },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    if (!repairCase) throw new NotFoundException('Dossier introuvable.');
    return repairCase;
  }

  async createNewPhase(workspaceId: string, caseId: string, description: string) {
    const repairCase = await this.prisma.case.findFirst({
      where: { id: caseId, workspace_id: workspaceId },
    });
    if (!repairCase) throw new NotFoundException('Dossier introuvable.');

    return this.prisma.intervention.create({
      data: {
        workspace_id: workspaceId,
        case_id: repairCase.id,
        description: description?.trim() || 'Nouveau problème détecté',
        status: INTERVENTION_STATUS.DIAGNOSIS,
      },
      include: {
        InterventionPart: {
          where: { deleted_at: null },
          include: { item: true },
        },
        case: true,
      },
    });
  }

  async generateProforma(workspaceId: string, caseId: string) {
    return this.prisma.$transaction(async (tx) => {
      const repairCase = await tx.case.findFirst({
        where: { id: caseId, workspace_id: workspaceId },
        include: {
          client: true,
          interventions: {
            where: { deleted_at: null },
            include: {
              InterventionPart: {
                where: { deleted_at: null },
              },
            },
          },
        },
      });

      if (!repairCase) throw new NotFoundException('Dossier introuvable.');

      let proforma = await tx.proforma.findFirst({
        where: { case_id: caseId, workspace_id: workspaceId, deleted_at: null },
      });

      if (proforma && proforma.status !== PROFORMA_STATUS.DRAFT) {
        throw new BadRequestException(`Impossible de modifier cette proforma.`);
      }

      let totalHT = 0;
      for (const intervention of repairCase.interventions) {
        for (const part of intervention.InterventionPart) {
          totalHT += Number(part.price_snapshot ?? 0) * Number(part.quantity ?? 0);
        }
      }

      const totalTTC = Number((totalHT * 1.2).toFixed(2));

      if (proforma) {
        return tx.proforma.update({
          where: { id: proforma.id },
          data: { total: totalTTC, updated_at: new Date() },
        });
      }

      const relatedAppointment = await tx.appointment.findFirst({
        where: {
          workspace_id: workspaceId,
          deleted_at: null,
          ...(repairCase.vehicle_id ? { vehicle_id: repairCase.vehicle_id } : {}),
          ...(repairCase.customer_id ? { client_id: repairCase.customer_id } : {}),
        },
        orderBy: { created_at: 'desc' },
      });

      if (!relatedAppointment) {
        throw new BadRequestException('Aucun rendez-vous trouvé.');
      }

      const client = repairCase.client;
      const reference = await this.sequencingService.generateReference(
        workspaceId,
        'PROFORMA',
        tx,
      );

      return tx.proforma.create({
        data: {
          workspace_id: workspaceId,
          case_id: repairCase.id,
          appointment_id: relatedAppointment.id,
          total: totalTTC,
          status: PROFORMA_STATUS.DRAFT,
          reference,
          customer_name_snapshot:
            client?.company_name || client?.name || null,
          customer_address_snapshot:
            client?.address || null,
          customer_billing_address_snapshot:
            client?.billing_address || client?.address || null,
          customer_registration_number_snapshot:
            client?.registration_number || null,
          customer_vat_number_snapshot:
            client?.vat_number || null,
          customer_email_snapshot:
            client?.email || null,
          customer_phone_snapshot:
            client?.phone || null,
        },
      });
    });
  }
}
