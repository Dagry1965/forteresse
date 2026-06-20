import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateSupplierDto } from './inventory/dto/create-supplier.dto';
import { CreateProductDto } from './inventory/dto/create-product.dto';
import { CreateMovementDto } from './inventory/dto/create-movement.dto';
import { GetStockAlertsDto } from './inventory/dto/get-stock-alerts.dto';


@Controller('api/inventory')
export class InventoryController {
  constructor(private prisma: PrismaService) {}

  // 1. Ajouter un Fournisseur
  @Post('supplier')
  async createSupplier(@Body() data: CreateSupplierDto) {
    return this.prisma.supplier.create({ data });
  }

  // 2. Ajouter une Pièce au Catalogue (Produit)
  @Post('product')
  async createProduct(@Body() data: CreateProductDto) {
    const product = await this.prisma.product.create({ data });

    // Initialiser le stock à 0 lors de la création
    await this.prisma.inventory.create({
      data: { product_id: product.id, quantity: 0 },
    });

    return product;
  }

  // 3. Faire un mouvement de stock (Entrée ou Sortie)
  @Post('movement')
  async createMovement(@Body() data: CreateMovementDto) {
    if (data.quantity <= 0) {
      throw new BadRequestException('La quantité doit être supérieure à 0');
    }

    const inventory = await this.prisma.inventory.findUnique({
      where: { product_id: data.product_id },
    });

    if (!inventory) {
      throw new BadRequestException("Produit introuvable dans l'inventaire");
    }

    if (data.type === 'OUT' && inventory.quantity < data.quantity) {
      throw new BadRequestException(`Stock insuffisant. Stock actuel : ${inventory.quantity}`);
    }

    const newQuantity =
      data.type === 'IN'
        ? inventory.quantity + data.quantity
        : inventory.quantity - data.quantity;

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
async getStockAlerts(@Query() query: GetStockAlertsDto) {
  const { workspaceId } = query;

  const products = await this.prisma.product.findMany({
    where: { workspaceId },
    include: { inventory: true, supplier: true },
  });

  // Filtrer pour ne garder que ceux où la quantité est inférieure ou égale au seuil d'alerte
  return products.filter((p) => p.inventory && p.inventory.quantity <= p.min_stock_alert);
}
  // 5. Lister les produits
  @Get('products')
  async getProducts(@Query('workspaceId') workspaceId: string) {
    return this.prisma.product.findMany({
      where: { workspaceId },
      include: { inventory: true, supplier: true },
    });
  }

  // 6. Lister les Fournisseurs
  @Get('supplier')
  async getSuppliers(@Query('workspaceId') workspaceId: string) {
    return this.prisma.supplier.findMany({
      where: { workspaceId }
    });
  }
}
