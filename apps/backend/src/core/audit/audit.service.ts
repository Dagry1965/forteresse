import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // LOG ACTION (placeholder)
  // ---------------------------------------------------------
  async log(data: { userId?: string; action: string; metadata?: any }) {
    // Ton schéma Prisma n'a pas de modèle AuditLog.
    // Si tu ajoutes plus tard un modèle `Audit`, tu pourras remplacer ce bloc par :
    //
    // return this.prisma.audit.create({
    //   data: {
    //     user_id: data.userId ?? null,
    //     action: data.action,
    //     metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    //   },
    // });
    //
    // Pour l'instant, on renvoie juste un objet en mémoire pour que le backend compile.

    return {
      userId: data.userId ?? null,
      action: data.action,
      metadata: data.metadata ?? null,
      created_at: new Date(),
    };
  }
}
