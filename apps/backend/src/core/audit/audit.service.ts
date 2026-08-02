import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuditClient = Prisma.TransactionClient | PrismaService | PrismaClient;

export interface AuditLogInput {
  action: string;
  entity: string;
  entityId: string;
  userId?: string | null;
  oldData?: unknown;
  newData?: unknown;
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
        user_id: data.userId ?? null,
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
