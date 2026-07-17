import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon2 from "argon2";


const prisma = new PrismaClient();

async function main() {
  console.log("🚀 SEED FORTERESSE ERP — Garage professionnel");


  // Workspace
  const workspace = await prisma.workspace.create({
    data: { name: "Garage Forteresse" },
  });
  const workspace_id = workspace.id;

  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const pick = <T>(arr: T[]) => arr[rand(0, arr.length - 1)];

  const statusesIntervention = [
    "en_attente",
    "diagnostic",
    "en_cours",
    "en_attente_pieces",
    "terminee",
    "annulee",
  ];

  const statusesProforma = ["brouillon", "validee", "refusee"];
  const statusesInvoice = ["non_payee", "payee", "annulee"];

  console.log("✔ Workspace créé :", workspace_id);

  // -----------------------------------------
  // ENTREPRISES (20)
  // -----------------------------------------
  const entreprises = [];
  for (let i = 0; i < 20; i++) {
    const e = await prisma.client.create({
      data: {
        name: faker.company.name(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        workspace_id,
      },
    });
    entreprises.push(e);
  }
  console.log("✔ Entreprises créées :", entreprises.length);

  // -----------------------------------------
  // CLIENTS PRIVÉS (50)
  // -----------------------------------------
  const clientsPrives = [];
  for (let i = 0; i < 50; i++) {
    const c = await prisma.client.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        workspace_id,
      },
    });
    clientsPrives.push(c);
  }
  console.log("✔ Clients privés créés :", clientsPrives.length);

  const allClients = [...entreprises, ...clientsPrives];

  // -----------------------------------------
  // VÉHICULES (100)
  // -----------------------------------------
  const vehicles = [];
  for (let i = 0; i < 100; i++) {
    const owner = pick(allClients);

    const v = await prisma.vehicle.create({
      data: {
        registration: faker.vehicle.vin().slice(0, 10),
        brand: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        workspace_id,
        client_id: owner.id,
      },
    });

    vehicles.push(v);
  }
  console.log("✔ Véhicules créés :", vehicles.length);

  // -----------------------------------------
  // RENDEZ-VOUS (200)
  // -----------------------------------------
  const appointments = [];

  for (let i = 0; i < 200; i++) {
    const client = pick(allClients);
    const vehicle = pick(vehicles);

    const date = faker.date.soon({ days: 30 });

    // 1) créer le timeslot
    const slot = await prisma.timeSlot.create({
      data: {
        start: date,
        end: new Date(date.getTime() + 60 * 60 * 1000),
        workspace_id,
      },
    });

    // 2) créer l'utilisateur
  const user = await prisma.user.create({
  data: {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: await argon2.hash("password123"), // ✔ hash correct
    workspace_id,
  },
});


    // 3) créer le rendez-vous
    const a = await prisma.appointment.create({
      data: {
        date,
        status: "planifie",
        workspace_id,
        client_id: client.id,
        vehicle_id: vehicle.id,
        time_slot_id: slot.id,
        user_id: user.id,
      },
    });

    appointments.push(a);
  }
  console.log("✔ Rendez-vous créés :", appointments.length);

  // -----------------------------------------
  // PROFORMAS (50)
  // -----------------------------------------
  const proformas = [];

  for (let i = 0; i < 50; i++) {
    const appointment = pick(appointments);

    const p = await prisma.proforma.create({
      data: {
        reference: "PF-" + faker.string.alphanumeric(8).toUpperCase(),
        total: rand(80, 1200),
        status: pick(statusesProforma),
        workspace_id,
        appointment_id: appointment.id,
      },
    });

    proformas.push(p);
  }
  console.log("✔ Proformas créées :", proformas.length);

  // -----------------------------------------
  // INTERVENTIONS (100)
  // -----------------------------------------
  const interventions = [];

  for (let i = 0; i < 100; i++) {
    const appointment = pick(appointments);

    const inter = await prisma.intervention.create({
      data: {
        description: faker.lorem.sentence(),
        status: pick(statusesIntervention),
        workspace_id,
        appointment_id: appointment.id,
      },
    });

    interventions.push(inter);
  }
  console.log("✔ Interventions créées :", interventions.length);

  // -----------------------------------------
  // PLACEHOLDERS PIÈCES UTILISÉES (100)
  // -----------------------------------------
  const interventionPartsPlaceholders = [];

  for (let i = 0; i < 100; i++) {
    const inter = pick(interventions);

    interventionPartsPlaceholders.push({
      intervention_id: inter.id,
      quantity: rand(1, 3),
    });
  }

  console.log("✔ Placeholders pièces utilisées :", interventionPartsPlaceholders.length);

  // -----------------------------------------
  // STOCK — CATÉGORIES (50)
  // -----------------------------------------
  const categories = [];
  for (let i = 0; i < 50; i++) {
    const c = await prisma.stockCategory.create({
      data: {
        name: faker.commerce.department(),
        workspace_id,
      },
    });
    categories.push(c);
  }
  console.log("✔ Catégories stock créées :", categories.length);

  // -----------------------------------------
  // FOURNISSEURS (20)
  // -----------------------------------------
  const suppliers = [];
  for (let i = 0; i < 20; i++) {
    const s = await prisma.supplier.create({
      data: {
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        workspace_id,
      },
    });
    suppliers.push(s);
  }
  console.log("✔ Fournisseurs créés :", suppliers.length);

  // -----------------------------------------
  // ARTICLES STOCK (200)
  // -----------------------------------------
  const stockItems = [];
  for (let i = 0; i < 200; i++) {
    const item = await prisma.stockItem.create({
      data: {
        name: faker.commerce.productName(),
        reference: faker.string.alphanumeric(10).toUpperCase(),
        description: faker.commerce.productDescription(),
        price_buy: rand(5, 200),
        price_sell: rand(20, 400),
        quantity: rand(0, 50),
        workspace_id,
        category_id: pick(categories).id,
        supplier_id: pick(suppliers).id,
      },
    });
    stockItems.push(item);
  }
  console.log("✔ Articles stock créés :", stockItems.length);

  // -----------------------------------------
  // COMMANDES FOURNISSEUR (30)
  // -----------------------------------------
  const purchaseOrders = [];
  for (let i = 0; i < 30; i++) {
    const supplier = pick(suppliers);

    const po = await prisma.purchaseOrder.create({
      data: {
        reference: "PO-" + faker.string.alphanumeric(8).toUpperCase(),
        status: pick(["draft", "ordered", "received"]),
        supplier_id: supplier.id,
        workspace_id,
      },
    });

    purchaseOrders.push(po);

    const linesCount = rand(1, 5);
    for (let j = 0; j < linesCount; j++) {
      const item = pick(stockItems);

      await prisma.purchaseOrderItem.create({
        data: {
          purchase_order_id: po.id,
          item_id: item.id,
          quantity: rand(1, 10),
          price_buy: item.price_buy,
        },
      });
    }
  }
  console.log("✔ Commandes fournisseur créées :", purchaseOrders.length);

  // -----------------------------------------
  // RÉCEPTIONS (30)
  // -----------------------------------------
  const receptions = [];
  for (let i = 0; i < 30; i++) {
    const po = pick(purchaseOrders);

    const r = await prisma.stockReception.create({
      data: {
        purchase_order_id: po.id,
        workspace_id,
      },
    });

    receptions.push(r);
  }
  console.log("✔ Réceptions créées :", receptions.length);

  // -----------------------------------------
  // MOUVEMENTS STOCK (200)
  // -----------------------------------------
  const movements = [];
  for (let i = 0; i < 200; i++) {
    const item = pick(stockItems);

    const type = pick(["in", "out", "adjust"]);
    const qty = rand(1, 5);

    const m = await prisma.stockMovement.create({
      data: {
        type,
        quantity: qty,
        item_id: item.id,
        workspace_id,
      },
    });

    movements.push(m);

    if (type === "in") {
      await prisma.stockItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity + qty },
      });
    } else if (type === "out") {
      await prisma.stockItem.update({
        where: { id: item.id },
        data: { quantity: Math.max(0, item.quantity - qty) },
      });
    }
  }
  console.log("✔ Mouvements stock créés :", movements.length);

  // -----------------------------------------
  // INVENTAIRE COMPLET
  // -----------------------------------------
  const inventory = await prisma.inventory.create({
    data: {
      reference: "INV-" + faker.string.alphanumeric(8).toUpperCase(),
      workspace_id,
    },
  });

  for (const item of stockItems) {
    await prisma.inventoryItem.create({
      data: {
        inventory_id: inventory.id,
        item_id: item.id,
        counted: item.quantity,
        expected: item.quantity,
      },
    });
  }

  console.log("✔ Inventaire complet généré :", stockItems.length);

  // -----------------------------------------
  // LIER PIÈCES UTILISÉES AUX ARTICLES
  // -----------------------------------------
  for (const part of interventionPartsPlaceholders) {
    const item = pick(stockItems);

    await prisma.interventionPart.create({
      data: {
        intervention_id: part.intervention_id,
        item_id: item.id,
        quantity: part.quantity,
      },
    });

    await prisma.stockMovement.create({
      data: {
        type: "out",
        quantity: part.quantity,
        item_id: item.id,
        workspace_id,
      },
    });

    await prisma.stockItem.update({
      where: { id: item.id },
      data: { quantity: Math.max(0, item.quantity - part.quantity) },
    });
  }

  console.log("✔ Pièces utilisées liées aux interventions");

  // -----------------------------------------
  // FACTURES (50)
  // -----------------------------------------
  const invoices = [];

  for (let i = 0; i < 50; i++) {
    const proforma = pick(proformas);

    const appointment = await prisma.appointment.findUnique({
      where: { id: proforma.appointment_id },
      include: { client: true, user: true },
    });

    if (!appointment) continue;

    const invoice = await prisma.invoice.create({
      data: {
        reference: "FA-" + faker.string.alphanumeric(8).toUpperCase(),
        total: proforma.total,
        status: pick(statusesInvoice),
        workspace_id,
        proforma_id: proforma.id,
        appointment_id: appointment.id,
        client_id: appointment.client.id,
        user_id: appointment.user.id,
      },
    });

    invoices.push(invoice);
  }

  console.log("✔ Factures créées :", invoices.length);

  // -----------------------------------------
  // PAIEMENTS (50)
  // -----------------------------------------
  const payments = [];

  for (let i = 0; i < 50; i++) {
    const invoice = pick(invoices);

    const appointment = await prisma.appointment.findUnique({
      where: { id: invoice.appointment_id },
      include: { client: true, user: true },
    });

    if (!appointment) continue;

    const payment = await prisma.payment.create({
      data: {
        amount: invoice.total,
        method: pick(["cash", "card", "bank"]),
        workspace_id,
        invoice_id: invoice.id,
        client_id: appointment.client.id,
        user_id: appointment.user.id,
      },
    });

    payments.push(payment);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "payee" },
    });
  }

  console.log("✔ Paiements créés :", payments.length);

  console.log("🎉 SEED GARAGE PROFESSIONNEL TERMINÉ AVEC SUCCÈS !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur durant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Prisma déconnecté");
  });
