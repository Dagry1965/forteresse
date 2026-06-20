const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

(async () => {
  try {
    // 1. Recréer le Workspace
    await p.workspace.upsert({
      where: { id: WORKSPACE_ID },
      update: {},
      create: { id: WORKSPACE_ID, name: "Garage Forteresse", ownerId: "admin" }
    });

    // 2. Créer un fournisseur
    const supplier = await p.supplier.create({
      data: { workspaceId: WORKSPACE_ID, name: "AutoParts Pro" }
    });

    // 3. Créer Pièce 1 (Plaquettes)
    const p1 = await p.product.create({
      data: { workspaceId: WORKSPACE_ID, supplier_id: supplier.id, reference: "FREIN-01", name: "Plaquettes de Frein", purchase_price: 20, selling_price: 55 }
    });
    await p.inventory.create({ data: { product_id: p1.id, quantity: 15 }});

    // 4. Créer Pièce 2 (Huile)
    const p2 = await p.product.create({
      data: { workspaceId: WORKSPACE_ID, supplier_id: supplier.id, reference: "HUILE-5W30", name: "Huile Moteur 5W30 5L", purchase_price: 15, selling_price: 45 }
    });
    await p.inventory.create({ data: { product_id: p2.id, quantity: 30 }});

    console.log("✅ Catalogue rempli avec succès et stock initialisé !");
  } catch (e) {
    console.error("ERREUR:", e.message);
  } finally {
    await p.$disconnect();
  }
})();
