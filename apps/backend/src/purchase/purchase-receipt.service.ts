
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class PurchaseReceiptService {
  async create(data: any) {
    return prisma.purchaseReceipt.create({ data, include: { lines: true } });
  }

  async completeReceipt(receiptId: string) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.purchaseReceipt.findUnique({ where: { id: receiptId }, include: { lines: true } });
      if (!receipt) throw new Error('Receipt not found');



  for (const line of receipt.lines) {
    const qty = Number(line.quantity || 0);

    // update global inventory
    await tx.inventory.upsert({
      where: { product_id: line.productId },
      create: { product_id: line.productId, quantity: qty },
      update: { quantity: { increment: qty } },
    });

    // create stock movement record
    await tx.stockMovement.create({
      data: {
        workspaceId: receipt.workspaceId,
        product_id: line.productId,
        type: 'purchase_in',
        quantity: qty,
        reason: 'receipt completed',
        reference: receipt.id,
      },
    });

    // update PO lines receivedQty if linked to a PO
    if (receipt.purchaseOrderId) {
      await tx.purchaseOrderLine.updateMany({
        where: { purchaseOrderId: receipt.purchaseOrderId, productId: line.productId },
        data: { receivedQty: { increment: qty } },
      });
    }
  }

  return tx.purchaseReceipt.update({ where: { id: receiptId }, data: { status: 'completed' } });
});
  }
}