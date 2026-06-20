import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = (global as any).prisma || new PrismaClient();

@Injectable()
export class PurchaseOrderService {
  async create(data: any) {
    // 1. Validation de base
    if (!data.workspaceId || !data.supplierId) {
      throw new BadRequestException('WorkspaceId et SupplierId sont obligatoires.');
    }

    // 2. Préparation des données pour Prisma (Nested Create)
    const createPayload = {
      workspaceId: data.workspaceId,
      supplierId: data.supplierId,
      reference: data.reference || `PO-${Date.now()}`,
      status: data.status || 'draft',
      totalAmount: Number(data.totalAmount) || 0,
      lines: {
        // C'est ici que l'erreur se corrige : on enveloppe dans "create"
        create: (data.lines || []).map((line: any) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
        })),
      },
    };

    try {
      return await prisma.purchaseOrder.create({
        data: createPayload,
        include: {
          lines: true,
          supplier: true,
        },
      });
    } catch (error) {
      console.error("Détails erreur Prisma:", error);
      throw new BadRequestException('Erreur lors de la création du Bon de Commande en base de données.');
    }
  }

  async findAll(workspaceId: string) {
    return prisma.purchaseOrder.findMany({
      where: { workspaceId },
      include: { lines: true, supplier: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true, supplier: true },
    });
  }

  async confirm(id: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'confirmed' },
    });
  }
}
