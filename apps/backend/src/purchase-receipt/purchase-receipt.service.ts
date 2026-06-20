import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePurchaseReceiptDto } from './dto/create-purchase-receipt.dto';

const prisma = (global as any).prisma || new PrismaClient();

@Injectable()
export class PurchaseReceiptService {
  
  async create(dto: CreatePurchaseReceiptDto) {
    const { purchaseOrderId, workspaceId, reference, lines } = dto;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { lines: true },
    });

    if (!purchaseOrder) {
      throw new BadRequestException('Bon de Commande introuvable');
    }

    return prisma.$transaction(async (tx) => {

      // 1. Vérification des quantités (sécurité)
      for (const line of lines) {
        if (line.quantity <= 0) {
          throw new BadRequestException(`Quantité invalide pour le produit ${line.productId}`);
        }
      }

      // 2. Créer la réception + lignes
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

      // 3. Mettre à jour le stock + mouvements
      for (const line of lines) {
        await tx.inventory.upsert({
          where: { product_id: line.productId },
          update: { quantity: { increment: line.quantity } },
          create: { product_id: line.productId, quantity: line.quantity },
        });

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

      // 4. Mise à jour des receivedQty avec protection anti-sur-réception
      for (const line of lines) {
        const poLine = purchaseOrder.lines.find(l => l.productId === line.productId);

        if (poLine) {
          const newReceivedQty = poLine.receivedQty + line.quantity;

          if (newReceivedQty > poLine.quantity) {
            throw new BadRequestException(
              `Quantité reçue trop élevée pour le produit ${line.productId}.`
            );
          }

          await tx.purchaseOrderLine.update({
            where: { id: poLine.id },
            data: { receivedQty: newReceivedQty },
          });
        }
      }

      // 5. Calcul du nouveau statut du Bon de Commande
      const updatedPOLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId },
      });

      const isFullyReceived = updatedPOLines.every(l => l.receivedQty >= l.quantity);
      const isPartiallyReceived = updatedPOLines.some(l => l.receivedQty > 0);

      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: isFullyReceived ? 'received' : (isPartiallyReceived ? 'partially_received' : 'confirmed'),
        },
      });

      // 6. ✅ AJOUT DU LOG D'AUDIT
      await tx.auditLog.create({
        data: {
          workspaceId,
          entity: 'purchase_receipt',
          entityId: receipt.id,
          action: 'create',
          message: `Réception enregistrée pour le Bon de Commande : ${purchaseOrder.reference}. Référence BL : ${reference}`,
          metadata: JSON.stringify({
            purchaseOrderId,
            reference,
            totalItems: lines.length,
            timestamp: new Date().toISOString()
          }),
        },
      });

      return receipt;
    });
  }
}
