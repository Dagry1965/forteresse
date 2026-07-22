import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { INTERVENTION_STATUS } from '../../../../../shared/constants/status.constants';

@Injectable()
export class WorkshopService {
  constructor(private readonly prisma: PrismaService) {}

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
      });

      if (!repairCase) {
        throw new Error('Dossier introuvable');
      }

      if (status === 'IN_PROGRESS') {
        await tx.intervention.updateMany({
          where: {
            case_id: caseId,
            workspace_id: workspaceId,
            deleted_at: null,
            status: {
              in: ['PENDING', 'DIAGNOSIS'],
            },
          },
          data: {
            status: 'IN_PROGRESS',
            updated_at: new Date(),
          },
        });
      }

      if (status === 'COMPLETED') {
        await tx.intervention.updateMany({
          where: {
            case_id: caseId,
            workspace_id: workspaceId,
            deleted_at: null,
          },
          data: {
            status: 'COMPLETED',
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
