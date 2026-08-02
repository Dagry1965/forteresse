import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuditClient = Prisma.TransactionClient | PrismaService | PrismaClient;

export interface AuditLogInput {
  action: string;
  entity: string;
  entityId: string;
  workspaceId?: string | null;
  userId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  success?: boolean;
  errorMessage?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    data: AuditLogInput,
    client: AuditClient = this.prisma,
  ) {
    return client.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entity_id: data.entityId,
        workspace_id: data.workspaceId ?? null,
        user_id: data.userId ?? null,
        success: data.success ?? true,
        error_message: data.errorMessage ?? null,
        ip_address: data.ipAddress ?? null,
        user_agent: data.userAgent ?? null,
        old_data:
          data.oldData === undefined
            ? null
            : JSON.stringify(data.oldData),
        new_data:
          data.newData === undefined
            ? null
            : JSON.stringify(data.newData),
      },
    });
  }
}
