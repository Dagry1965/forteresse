import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CASE_STATUS,
  INTERVENTION_STATUS,
  CASE_STATUS_TRANSITIONS,
  PROFORMA_STATUS,
} from '../../../../../shared/constants/status.constants';

@Injectable()
export class WorkshopService {
  constructor(private readonly prisma: PrismaService) {}

  private assertCaseStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedStatuses = Object.values(CASE_STATUS) as string[];
    if (!allowedStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        'Statut de dossier invalide : ' + nextStatus,
      );
    }

    const allowedTransitions = CASE_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new BadRequestException(
        'Transition de dossier interdite : '
          + currentStatus
          + ' -> '
          + nextStatus,
      );
    }
  }

  async getDashboardMetrics(workspaceId: string) {
    const [totalActive, inDiagnosis, inProgress] = await Promise.all([
      this.prisma.intervention.count({
        where: { workspace_id: workspaceId, deleted_at: null, status: { not: INTERVENTION_STATUS.COMPLETED } }
      }),
      this.prisma.intervention.count({
        where: { workspace_id: workspaceId, deleted_at: null, status: INTERVENTION_STATUS.DIAGNOSIS }
      }),
      this.prisma.intervention.count({
        where: { workspace_id: workspaceId, deleted_at: null, status: INTERVENTION_STATUS.IN_PROGRESS }
      }),
    ]);

    return {
      totalActive,
      inDiagnosis,
      inProgress,
    };
  }

 async updateCaseStatus(workspaceId: string, caseId: string, status: string) {
  return this.prisma.$transaction(async (tx) => {
    const repairCase = await tx.case.findFirst({
      where: {
        id: caseId,
        workspace_id: workspaceId,
      },
      include: {
        proformas: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!repairCase) {
      throw new NotFoundException('Dossier introuvable');
    }

    const latestProforma = repairCase.proformas?.[0] ?? null;

    const requiresAcceptedProforma =
      status === CASE_STATUS.WAITING_PARTS ||
      status === CASE_STATUS.IN_PROGRESS ||
      status === CASE_STATUS.COMPLETED;

    if (
      requiresAcceptedProforma &&
      latestProforma?.status !== PROFORMA_STATUS.ACCEPTED
    ) {
      throw new BadRequestException(
        "Le devis doit être accepté avant de poursuivre l'atelier.",
      );
    }

    this.assertCaseStatusTransition(repairCase.status, status);

    if (status === CASE_STATUS.IN_PROGRESS) {
      await tx.intervention.updateMany({
        where: {
          case_id: caseId,
          workspace_id: workspaceId,
          deleted_at: null,
          status: {
            in: [INTERVENTION_STATUS.PENDING, INTERVENTION_STATUS.DIAGNOSIS],
          },
        },
        data: {
          status: INTERVENTION_STATUS.IN_PROGRESS,
          updated_at: new Date(),
        },
      });
    }

    if (status === CASE_STATUS.COMPLETED) {
      await tx.intervention.updateMany({
        where: {
          case_id: caseId,
          workspace_id: workspaceId,
          deleted_at: null,
        },
        data: {
          status: INTERVENTION_STATUS.COMPLETED,
          updated_at: new Date(),
        },
      });
    }

    return tx.case.update({
      where: {
        id: caseId,
      },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  });
}



}
