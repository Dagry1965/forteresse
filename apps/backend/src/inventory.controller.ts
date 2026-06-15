import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('inventory')
export class InventoryController {
  constructor(private prisma: PrismaService) {}

  // 1. Ajouter un Fournisseur
  @Post('supplier')
  async createSupplier(@Body() data: { name: string; email?: string; phone?: string; workspaceId: string }) {
    return this.prisma.supplier.create({ data });
  }

  // 2. Ajouter une Pièce au Catalogue (Produit)
  @Post('product')
  async createProduct(
    @Body()
    data: {
      workspaceId: string;
      supplier_id?: string;
      reference: string;
      name: string;
      purchase_price: number;
      selling_price: number;
      min_stock_alert: number;
    },
  ) {
    const product = await this.prisma.product.create({ data });

    // Initialiser le stock à 0 lors de la création
    await this.prisma.inventory.create({
      data: { product_id: product.id, quantity: 0 },
    });

    return product;
  }

  // 3. Faire un mouvement de stock (Entrée ou Sortie)
  @Post('movement')
  async createMovement(
    @Body()
    data: {
      workspaceId: string;
      product_id: string;
      type: 'IN' | 'OUT';
      quantity: number;
      reason: string;
    },
  ) {
    if (data.quantity <= 0) throw new BadRequestException('La quantité doit être supérieure à 0');

    // Récupérer le stock actuel
    const inventory = await this.prisma.inventory.findUnique({ where: { product_id: data.product_id } });

    if (!inventory) throw new BadRequestException("Produit introuvable dans l'inventaire");

    if (data.type === 'OUT' && inventory.quantity < data.quantity) {
      throw new BadRequestException(`Stock insuffisant. Stock actuel : ${inventory.quantity}`);
    }

    // Mise à jour de la quantité
    const newQuantity =
      data.type === 'IN' ? inventory.quantity + data.quantity : inventory.quantity - data.quantity;

    // Transaction : on met à jour le stock ET on trace le mouvement
    const [movement, updatedInventory] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({ data }),
      this.prisma.inventory.update({
        where: { product_id: data.product_id },
        data: { quantity: newQuantity },
      }),
    ]);

    return { movement, stock_actuel: updatedInventory.quantity };
  }

  // 4. Voir les alertes de stock (Pièces à recommander)
  @Get('alerts')
  async getStockAlerts(@Query('workspaceId') workspaceId: string) {
    const products = await this.prisma.product.findMany({
      where: { workspaceId },
      include: { inventory: true, supplier: true },
    });

    // Filtrer pour ne garder que ceux où la quantité est <= au seuil d'alerte
    return products.filter((p) => p.inventory && p.inventory.quantity <= p.min_stock_alert);
  }

  // 5. Lister les produits (catalogue + stock)
  @Get('products')
  async getProducts(@Query('workspaceId') workspaceId: string) {
    return this.prisma.product.findMany({
      where: { workspaceId },
      include: {
        inventory: true,
        supplier: true,
      },
    });
  }
}
