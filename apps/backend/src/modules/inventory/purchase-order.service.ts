import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SequencingService } from '../shared/sequencing.service';
import { PURCHASE_ORDER_STATUS } from '../../../../../shared/constants/status.constants';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequencingService: SequencingService,
  ) {}

  /**
   * Création d'une commande fournisseur
   */
  async createOrder(workspaceId: string, userId: string | null, data: any) {

    if (!workspaceId) {
      throw new BadRequestException('Workspace manquant');
    }

    if (!data?.supplier_id) {
      throw new BadRequestException('Fournisseur manquant');
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('Aucun article dans la commande');
    }

    // 1. Vérifier l'existence du fournisseur dans ce workspace
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: data.supplier_id,
        workspace_id: workspaceId,
      },
    });

    if (!supplier) {
      throw new NotFoundException(
        `Fournisseur introuvable dans ce workspace : ${data.supplier_id}`,
      );
    }

    // 2. Préparer et valider les IDs des articles
    const itemIds = data.items.map((item: any) => item.stock_item_id).filter(Boolean);

    if (itemIds.length !== data.items.length) {
      throw new BadRequestException('Une ou plusieurs lignes n’ont pas d’article');
    }

    // 3. Vérifier que tous les articles appartiennent au workspace
    const existingItems = await this.prisma.stockItem.findMany({
      where: {
        id: { in: itemIds },
        workspace_id: workspaceId,
      },
      select: { id: true },
    });

    const existingItemIds = new Set(existingItems.map((item) => item.id));
    const missingItemIds = itemIds.filter((id: string) => !existingItemIds.has(id));

    if (missingItemIds.length > 0) {
      throw new NotFoundException(
        `Articles introuvables dans ce workspace : ${missingItemIds.join(', ')}`,
      );
    }

    // 4. Générer la référence (ex: CMD-2026-0001)
    const reference = await this.sequencingService.generateReference(
      workspaceId,
      'PURCHASE_ORDER',
    );

    // 5. Création de la commande et des items (Mapping schéma item_id / price_buy)
    return this.prisma.purchaseOrder.create({
      data: {
        workspace_id: workspaceId,
        supplier_id: data.supplier_id,
        reference,
        status: PURCHASE_ORDER_STATUS.DRAFT,
        // On lie l'utilisateur qui a créé la commande
        ...(userId ? { created_by: userId } : {}),
        items: {
          create: data.items.map((item: any) => ({
            item_id: item.stock_item_id, // Mapping vers le schéma
            quantity: Number(item.quantity),
            price_buy: Number(item.unit_cost), // Mapping vers le schéma
            received_quantity: 0,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: true, // Relation vers StockItem
          },
        },
      },
    });
  }

  /**
   * Lister toutes les commandes du garage
   */
  async findAll(workspaceId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        workspace_id: workspaceId,
      },
      include: {
        supplier: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Détail d'une commande spécifique
   */
  async findOne(workspaceId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        workspace_id: workspaceId,
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: true,
          },
        },
        purchaseReceipts: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Commande introuvable : ${id}`);
    }

    return order;
  }

  /**
   * Mise à jour du statut (DRAFT -> SENT -> RECEIVED)
   */
  async updateStatus(workspaceId: string, id: string, status: string) {
    // On utilise updateMany pour garantir que l'utilisateur ne modifie que son workspace
    const result = await this.prisma.purchaseOrder.updateMany({
      where: {
        id,
        workspace_id: workspaceId,
      },
      data: {
        status,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Commande introuvable ou accès refusé : ${id}`);
    }

    // On récupère l'objet mis à jour pour le renvoyer au front
    return this.findOne(workspaceId, id);
  }





}
