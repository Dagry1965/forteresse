import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class PurchaseOrderService {
  async create(data: any) {
    return prisma.purchaseOrder.create({ data, include: { lines: true } });
  }

  async findAll(workspaceId: string) {
    return prisma.purchaseOrder.findMany({ where: { workspaceId }, include: { lines: true } });
  }

  async findOne(id: string) {
    return prisma.purchaseOrder.findUnique({ where: { id }, include: { lines: true } });
  }

  async confirm(id: string) {
    return prisma.purchaseOrder.update({ where: { id }, data: { status: 'confirmed' } });
  }
}
