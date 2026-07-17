const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('ðŸ“¦ DÃ©marrage du Seed de Stock...');

  // 1. RÃ©cupÃ©rer le Workspace existant
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error("âŒ Aucun Workspace trouvÃ©. Lance d'abord le seed-full-cycle.js");
    return;
  }

  // 2. CrÃ©er un Fournisseur
  const supplier = await prisma.supplier.create({
    data: {
      workspaceId: workspace.id,
      name: 'AutoParts Pro',
      email: 'contact@autopartspro.fr',
      phone: '0102030405'
    }
  });

  console.log(`âœ… Fournisseur crÃ©Ã© : ${supplier.name}`);

  // 3. CrÃ©er des Produits (Catalogue)
  const product1 = await prisma.product.create({
    data: {
      workspaceId: workspace.id,
      supplier_id: supplier.id,
      reference: 'FILT-HUILE-001',
      name: 'Filtre Ã  Huile Premium',
      purchase_price: 5.50,
      selling_price: 15.00,
      min_stock_alert: 5
    }
  });
  // Initialiser l'inventaire Ã  0
  await prisma.inventory.create({ data: { product_id: product1.id, quantity: 0 } });

  const product2 = await prisma.product.create({
    data: {
      workspaceId: workspace.id,
      supplier_id: supplier.id,
      reference: 'FREIN-PLAQ-BOSCH',
      name: 'Plaquettes de frein Avant',
      purchase_price: 25.00,
      selling_price: 65.00,
      min_stock_alert: 3
    }
  });
  await prisma.inventory.create({ data: { product_id: product2.id, quantity: 0 } });

  console.log(`âœ… Produits crÃ©Ã©s : ${product1.name}, ${product2.name}`);

  // 4. Faire des EntrÃ©es en Stock (Mouvements)
  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        workspaceId: workspace.id,
        product_id: product1.id,
        type: 'IN',
        quantity: 20,
        reason: 'Livraison initiale'
      }
    }),
    prisma.inventory.update({
      where: { product_id: product1.id },
      data: { quantity: 20 }
    })
  ]);

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        workspaceId: workspace.id,
        product_id: product2.id,
        type: 'IN',
        quantity: 2, // Attention: c'est sous le seuil d'alerte (3) !
        reason: 'Livraison partielle'
      }
    }),
    prisma.inventory.update({
      where: { product_id: product2.id },
      data: { quantity: 2 }
    })
  ]);

  console.log(`âœ… Stock mis Ã  jour !`);
  console.log(`â„¹ï¸ Tu devrais avoir une alerte de stock sur les plaquettes (QuantitÃ©: 2, Alerte: 3).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

