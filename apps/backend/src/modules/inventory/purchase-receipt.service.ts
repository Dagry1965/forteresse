import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SequencingService } from '../shared/sequencing.service';

import {
  PURCHASE_ORDER_STATUS,
  STOCK_MOVEMENT_TYPE,
} from '../../../../../shared/constants/status.constants';

type CreateReceiptItemDto = {
  item_id?: string;
  itemId?: string;
  quantity: number;
};

type CreateReceiptData = {
  reference?: string;
  purchaseOrderId: string;
  items: CreateReceiptItemDto[];
  userId?: string;
};

@Injectable()
export class PurchaseReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
  ) {}

  /**
   * Enregistrer une réception fournisseur.
   *
   * La transaction effectue :
   * 1. la création du bon de réception ;
   * 2. la mise à jour des quantités reçues ;
   * 3. l'augmentation du stock ;
   * 4. la création des mouvements de stock ;
   * 5. la mise à jour du statut de la commande.
   */
  async createReceipt(
    workspaceId: string,
    data: CreateReceiptData,
  ) {
    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId est requis.',
      );
    }

    if (!data?.purchaseOrderId) {
      throw new BadRequestException(
        'purchaseOrderId est requis.',
      );
    }

    if (
      !Array.isArray(data.items) ||
      data.items.length === 0
    ) {
      throw new BadRequestException(
        'La réception doit contenir au moins un article.',
      );
    }

    /*
     * Génération de la référence avant la transaction.
     */
    const requestedReference = data.reference?.trim();

    const finalReference =
      requestedReference ||
      (await this.sequencingService.generateReference(
        workspaceId,
        'RECEIPT',
      ));

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          /*
           * Vérifier que la commande existe dans le workspace.
           */
          const purchaseOrder =
            await tx.purchaseOrder.findFirst({
              where: {
                id: data.purchaseOrderId,
                workspace_id: workspaceId,
                deleted_at: null,
              },
              include: {
                supplier: true,
                items: {
                  include: {
                    item: true,
                  },
                },
              },
            });

          if (!purchaseOrder) {
            throw new NotFoundException(
              'Commande fournisseur introuvable.',
            );
          }

          if (
            purchaseOrder.status ===
            PURCHASE_ORDER_STATUS.RECEIVED
          ) {
            throw new BadRequestException(
              'Cette commande a déjà été entièrement réceptionnée.',
            );
          }

          /*
           * Création de l'en-tête du bon de réception.
           *
           * Le modèle PurchaseReceipt ne contient pas
           * de lignes de réception propres.
           */
          const receipt =
            await tx.purchaseReceipt.create({
              data: {
                reference: finalReference,
                workspace_id: workspaceId,
                purchase_order_id: purchaseOrder.id,
              },
            });

          /*
           * Empêcher qu'un même article apparaisse plusieurs fois
           * dans la même demande de réception.
           */
          const receivedItemIds = new Set<string>();

          for (const receivedItem of data.items) {
            const currentItemId =
              receivedItem.item_id ??
              receivedItem.itemId;

            if (!currentItemId) {
              throw new BadRequestException(
                'ID d’article manquant dans une ligne de réception.',
              );
            }

            if (receivedItemIds.has(currentItemId)) {
              throw new BadRequestException(
                `L’article ${currentItemId} apparaît plusieurs fois dans la réception.`,
              );
            }

            receivedItemIds.add(currentItemId);

            const receivedQuantity = Number(
              receivedItem.quantity,
            );

            if (
              !Number.isInteger(receivedQuantity) ||
              receivedQuantity <= 0
            ) {
              throw new BadRequestException(
                `La quantité reçue pour l’article ${currentItemId} doit être un entier supérieur à zéro.`,
              );
            }

            /*
             * Dans ton schéma, PurchaseOrderItem utilise item_id,
             * et non stock_item_id.
             */
            const orderLine =
              await tx.purchaseOrderItem.findFirst({
                where: {
                  purchase_order_id: purchaseOrder.id,
                  item_id: currentItemId,
                },
                include: {
                  item: true,
                },
              });

            if (!orderLine) {
              throw new NotFoundException(
                `L’article ${currentItemId} ne figure pas dans cette commande.`,
              );
            }

            /*
             * Vérifier que l'article appartient bien au workspace.
             */
            if (
              orderLine.item.workspace_id !== workspaceId ||
              orderLine.item.deleted_at !== null
            ) {
              throw new NotFoundException(
                `Article de stock introuvable dans ce workspace : ${currentItemId}.`,
              );
            }

            const orderedQuantity = Number(
              orderLine.quantity,
            );

            const previouslyReceived = Number(
              orderLine.received_quantity ?? 0,
            );

            const remainingQuantity =
              orderedQuantity - previouslyReceived;

            if (remainingQuantity <= 0) {
              throw new BadRequestException(
                `L’article "${orderLine.item.name}" a déjà été entièrement réceptionné.`,
              );
            }

            if (receivedQuantity > remainingQuantity) {
              throw new BadRequestException(
                `La quantité reçue pour "${orderLine.item.name}" dépasse le solde de la commande. ` +
                  `Commandée : ${orderedQuantity}, ` +
                  `déjà reçue : ${previouslyReceived}, ` +
                  `reste à recevoir : ${remainingQuantity}, ` +
                  `quantité saisie : ${receivedQuantity}.`,
              );
            }

            /*
             * Mise à jour de la ligne de commande.
             */
            await tx.purchaseOrderItem.update({
              where: {
                id: orderLine.id,
              },
              data: {
                received_quantity: {
                  increment: receivedQuantity,
                },
              },
            });

            /*
             * Augmentation du stock réel.
             */
            await tx.stockItem.update({
              where: {
                id: orderLine.item_id,
              },
              data: {
                quantity: {
                  increment: receivedQuantity,
                },
              },
            });

            /*
             * Création du mouvement de stock.
             */
            await tx.stockMovement.create({
              data: {
                workspace_id: workspaceId,
                item_id: orderLine.item_id,
                quantity: receivedQuantity,
                type: STOCK_MOVEMENT_TYPE.IN_PURCHASE,
                created_by: data.userId ?? null,
              },
            });
          }

          /*
           * Relire les lignes après toutes les mises à jour.
           */
          const updatedOrder =
            await tx.purchaseOrder.findFirst({
              where: {
                id: purchaseOrder.id,
                workspace_id: workspaceId,
                deleted_at: null,
              },
              include: {
                supplier: true,
                items: {
                  include: {
                    item: true,
                  },
                },
              },
            });

          if (!updatedOrder) {
            throw new NotFoundException(
              'Commande introuvable après la réception.',
            );
          }

          const isFullyReceived =
            updatedOrder.items.length > 0 &&
            updatedOrder.items.every(
              (line) =>
                Number(line.received_quantity ?? 0) >=
                Number(line.quantity),
            );

          const hasReceivedItems =
            updatedOrder.items.some(
              (line) =>
                Number(line.received_quantity ?? 0) > 0,
            );

          const newStatus = isFullyReceived
            ? PURCHASE_ORDER_STATUS.RECEIVED
            : hasReceivedItems
              ? PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED
              : purchaseOrder.status;

          await tx.purchaseOrder.update({
            where: {
              id: updatedOrder.id,
            },
            data: {
              status: newStatus,
            },
          });

          /*
           * Retour complet de la réception.
           */
          return tx.purchaseReceipt.findUnique({
            where: {
              id: receipt.id,
            },
            include: {
              purchase_order: {
                include: {
                  supplier: true,
                  items: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          });
        },
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(
        'PurchaseReceiptService.createReceipt error:',
        error,
      );

      throw new InternalServerErrorException(
        'Erreur lors de l’enregistrement de la réception.',
      );
    }
  }

  /**
   * Lister les bons de réception du workspace.
   */
  async findAll(workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId est requis.',
      );
    }

    try {
      return await this.prisma.purchaseReceipt.findMany({
        where: {
          workspace_id: workspaceId,
        },
        include: {
          purchase_order: {
            include: {
              supplier: true,
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      console.error(
        'PurchaseReceiptService.findAll error:',
        error,
      );

      throw new InternalServerErrorException(
        'Erreur lors de la lecture des réceptions.',
      );
    }
  }

  /**
   * Récupérer une réception précise.
   */
  async findOne(
    workspaceId: string,
    receiptId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId est requis.',
      );
    }

    if (!receiptId) {
      throw new BadRequestException(
        'receiptId est requis.',
      );
    }

    const receipt =
      await this.prisma.purchaseReceipt.findFirst({
        where: {
          id: receiptId,
          workspace_id: workspaceId,
        },
        include: {
          purchase_order: {
            include: {
              supplier: true,
              items: {
                include: {
                  item: true,
                },
              },
            },
          },
        },
      });

    if (!receipt) {
      throw new NotFoundException(
        'Bon de réception introuvable.',
      );
    }

    return receipt;
  }
}
