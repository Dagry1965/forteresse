
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class StockService {
  async getInventory(productId: string) {
    return prisma.inventory.findUnique({ where: { product_id: productId } });
  }

  async listMovements(workspaceId: string, productId?: string) {
    const where: any = { workspaceId };
    if (productId) where.product_id = productId;
    return prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async adjust(productId: string, delta: number, workspaceId: string, reason = 'adjustment') {
    return prisma.$transaction(async (tx) => {
      await tx.inventory.upsert({
        where: { product_id: productId },
        create: { product_id: productId, quantity: delta },
        update: { quantity: { increment: delta } },
      });
      return tx.stockMovement.create({
        data: {
          workspaceId,
          product_id: productId,
          type: delta >= 0 ? 'adjustment_in' : 'adjustment_out',
          quantity: Math.abs(delta),
          reason,
        },
      });
    });
  }
}