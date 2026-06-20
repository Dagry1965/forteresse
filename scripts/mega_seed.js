const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

(async () => {
  try {
    console.log("⏳ Génération de toutes les données de test...");

    // 1. Workspace
    await p.workspace.upsert({
      where: { id: WORKSPACE_ID },
      update: {},
      create: { id: WORKSPACE_ID, name: "Garage Forteresse", ownerId: "admin-id" }
    });

    // 2. Fournisseur & Produits
    const supplier = await p.supplier.create({
      data: { workspaceId: WORKSPACE_ID, name: "AutoParts Pro" }
    });

    const p1 = await p.product.create({
      data: { workspaceId: WORKSPACE_ID, supplier_id: supplier.id, reference: "FREIN-01", name: "Plaquettes de Frein", purchase_price: 20, selling_price: 55 }
    });
    await p.inventory.create({ data: { product_id: p1.id, quantity: 15 }});

    const p2 = await p.product.create({
      data: { workspaceId: WORKSPACE_ID, supplier_id: supplier.id, reference: "HUILE-5W30", name: "Huile Moteur 5W30 5L", purchase_price: 15, selling_price: 45 }
    });
    await p.inventory.create({ data: { product_id: p2.id, quantity: 30 }});

    // 3. Client & Véhicule
    const client = await p.client.create({
      data: { workspaceId: WORKSPACE_ID, name: "Jean Dupont", email: "jean@dupont.com", phone: "0600000000" }
    });

    const vehicle = await p.vehicle.create({
      data: { workspaceId: WORKSPACE_ID, clientId: client.id, make: "Peugeot", model: "208", plateNumber: "AB-123-CD" }
    });

    // 4. Rendez-vous & Intervention
    const appointment = await p.appointment.create({
      data: { user_id: "admin-id", vehicle_id: vehicle.id, scheduled_at: new Date(), status: "in_progress", initial_description: "Révision complète" }
    });

    const intervention = await p.intervention.create({
      data: { appointment_id: appointment.id, status: "IN_PROGRESS", diagnosis_text: "Plaquettes usées, vidange à faire." }
    });

    console.log("✅ TOUTES LES DONNÉES SONT RESTAURÉES !");
    console.log("👉 Lien direct pour le devis : http://localhost:3000/proforma?interventionId=" + intervention.id);

  } catch (e) {
    console.error("ERREUR:", e.message);
  } finally {
    await p.$disconnect();
  }
})();
