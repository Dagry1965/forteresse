const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

(async () => {
  try {
    // Créer un fournisseur s'il n'existe pas
    const supplier = await p.supplier.findUnique({ where: { id: "test-supplier-id" } });
    let createdSupplier;

    if (!supplier) {
      createdSupplier = await p.supplier.create({
        data: { id: "test-supplier-id", workspaceId: WORKSPACE_ID, name: "Central Auto Parts", email: "contact@centralauto.com" }
      });
      console.log(`✅ Fournisseur "${createdSupplier.name}" créé.`);
    } else {
      createdSupplier = await p.supplier.update({ where: { id: "test-supplier-id" }, data: { workspaceId: WORKSPACE_ID, name: "Central Auto Parts", email: "contact@centralauto.com" } });
      console.log(`✅ Fournisseur "${createdSupplier.name}" mis à jour.`);
    }

    // Créer un produit "Filtre à Huile" s'il n'existe pas
    const product1 = await p.product.upsert({
      where: { id: "test-filter-id" }, // Utiliser un ID fixe pour l'upsert
      update: { workspaceId: WORKSPACE_ID, supplier_id: createdSupplier.id },
      create: { 
        id: "test-filter-id", workspaceId: WORKSPACE_ID, supplier_id: createdSupplier.id, reference: "FILTRE-HUILE-01", 
        name: "Filtre à Huile Standard", purchase_price: 10, selling_price: 25, min_stock_alert: 5 
      }
    });
    await p.inventory.upsert({
      where: { product_id: product1.id },
      update: { quantity: 50 },
      create: { product_id: product1.id, quantity: 50 }
    });
    console.log(`✅ Produit "${product1.name}" avec stock créé/mis à jour.`);

    // Créer un produit "Plaquettes de Frein" s'il n'existe pas
    const product2 = await p.product.upsert({
      where: { id: "test-pads-id" }, // Utiliser un ID fixe
      update: { workspaceId: WORKSPACE_ID, supplier_id: createdSupplier.id },
      create: { 
        id: "test-pads-id", workspaceId: WORKSPACE_ID, supplier_id: createdSupplier.id, reference: "PLAQUETTES-FREIN-AV", 
        name: "Plaquettes de Frein Avant", purchase_price: 30, selling_price: 80, min_stock_alert: 3 
      }
    });
    await p.inventory.upsert({
      where: { product_id: product2.id },
      update: { quantity: 20 },
      create: { product_id: product2.id, quantity: 20 }
    });
    console.log(`✅ Produit "${product2.name}" avec stock créé/mis à jour.`);

  } catch (e) {
    console.error("ERREUR lors du seed fournisseur/produits:", e.message);
  } finally {
    await p.$disconnect();
  }
})();
