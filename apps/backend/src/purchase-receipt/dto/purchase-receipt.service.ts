import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';

const prisma = (global as any).prisma || new PrismaClient();

@Injectable()
export class PurchaseReceiptService {
  
  async create(dto: CreatePurchaseReceiptDto) {
    const { purchaseOrderId, workspaceId, reference, lines } = dto;

    // Vérifier que le Bon de Commande existe
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { lines: true },
    });

    if (!purchaseOrder) {
      throw new BadRequestException('Bon de Commande introuvable');
    }

    // Transaction pour garantir l'intégrité
    return prisma.$transaction(async (tx) => {
      // 1. Créer la réception
      const receipt = await tx.purchaseReceipt.create({
        data: {
          purchaseOrderId,
          workspaceId,
          reference,
          status: 'completed',
          lines: {
            create: lines.map(line => ({
              productId: line.productId,
              quantity: line.quantity,
              unit_price: line.unit_price,
              lot: line.lot,
            })),
          },
        },
        include: { lines: true },
      });

      // 2. Mettre à jour le stock + créer les mouvements
      for (const line of lines) {
        // Mettre à jour ou créer l'inventaire
        await tx.inventory.upsert({
          where: { product_id: line.productId },
          update: {
            quantity: { increment: line.quantity },
          },
          create: {
            product_id: line.productId,
            quantity: line.quantity,
          },
        });

        // Créer le mouvement de stock
        await tx.stockMovement.create({
          data: {
            workspaceId,
            product_id: line.productId,
            type: 'purchase_in',
            quantity: line.quantity,
            reason: `Réception BL ${reference}`,
            reference: receipt.id,
          },
        });
      }

      return receipt;
    });
  }
}
