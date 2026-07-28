import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon2 from "argon2";
import {
  APPOINTMENT_STATUS,
  INTERVENTION_STATUS,
  INVOICE_STATUS,
  PROFORMA_STATUS,
  PURCHASE_ORDER_STATUS,
} from '../../../../shared/constants/status.constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed avec Faker + Argon2 en cours...');

  // ==================== WORKSPACE ====================
  const workspace = await prisma.workspace.create({
    data: { name: 'Garage Auto Pro - Lyon' },
  });

  // ==================== UTILISATEURS ====================
  const admin = await prisma.user.create({
    data: {
      name: 'Alexandre Martin',
      email: 'admin@autopro.fr',
      password: await argon2.hash("password123"), // ✔ hash correct
      workspace_id: workspace.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sophie Laurent',
      email: 'manager@autopro.fr',
      password: await argon2.hash("password123"), // ✔ hash correct
      workspace_id: workspace.id,
    },
  });

  const mechanic = await prisma.user.create({
    data: {
      name: 'Julien Moreau',
      email: 'meca@autopro.fr',
      password: await argon2.hash("password123"), // ✔ hash correct
      workspace_id: workspace.id,
    },
  });

 await prisma.workspaceMember.create({
  data: { role: 'ADMIN', workspace_id: workspace.id, user_id: admin.id },
});
await prisma.workspaceMember.create({
  data: { role: 'MANAGER', workspace_id: workspace.id, user_id: manager.id },
});
await prisma.workspaceMember.create({
  data: { role: 'MECHANIC', workspace_id: workspace.id, user_id: mechanic.id },
});

  // ==================== CLIENTS ====================
  const individualClients = await Promise.all(
    Array.from({ length: 4 }).map(() =>
      prisma.client.create({
        data: {
          name: faker.person.fullName(),
          phone: faker.phone.number({ style: 'international' }),
          email: faker.internet.email().toLowerCase(),
          type: 'INDIVIDUAL',
          workspace_id: workspace.id,
        },
      })
    )
  );

  const fleetClient1 = await prisma.client.create({
    data: {
      name: 'Transport Express Lyon',
      phone: '0478123456',
      email: 'flotte@transportexpress.fr',
      type: 'COMPANY',
      workspace_id: workspace.id,
    },
  });

  const fleetClient2 = await prisma.client.create({
    data: {
      name: 'Services Pro Flotte',
      phone: '0478987654',
      email: 'contact@servicesproflotte.fr',
      type: 'COMPANY',
      workspace_id: workspace.id,
    },
  });

  // ==================== VÉHICULES ====================
  const individualVehicles = await Promise.all(
    individualClients.map(client =>
      prisma.vehicle.create({
        data: {
          registration: faker.vehicle.vin().slice(0, 10).toUpperCase(),
          brand: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          workspace_id: workspace.id,
          client_id: client.id,
        },
      })
    )
  );

  const fleet1Vehicles = await Promise.all(
    Array.from({ length: 6 }).map(() =>
      prisma.vehicle.create({
        data: {
          registration: `TE-${faker.string.alphanumeric(6).toUpperCase()}`,
          brand: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          workspace_id: workspace.id,
          client_id: fleetClient1.id,
        },
      })
    )
  );

  const fleet2Vehicles = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.vehicle.create({
        data: {
          registration: `SP-${faker.string.alphanumeric(6).toUpperCase()}`,
          brand: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          workspace_id: workspace.id,
          client_id: fleetClient2.id,
        },
      })
    )
  );

  const allVehicles = [...individualVehicles, ...fleet1Vehicles, ...fleet2Vehicles];

  // ==================== TIME SLOTS ====================
  const timeSlots = [];
  const months = [5, 6, 7];

  for (const month of months) {
    for (let d = 3; d <= 28; d += 2) {
      for (let h = 8; h <= 18; h++) {
        if (h === 12 || h === 13) continue;
        const start = new Date(`2026-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00`);
        timeSlots.push(
          await prisma.timeSlot.create({
            data: {
              start,
              end: new Date(start.getTime() + 3600000),
              workspace_id: workspace.id,
            },
          })
        );
      }
    }
  }

  // ==================== RENDEZ-VOUS ====================
  const appointmentStatuses = Object.values(APPOINTMENT_STATUS);
  const appointments = [];

  for (let i = 0; i < 70; i++) {
    const vehicle = allVehicles[i % allVehicles.length];
    let status = appointmentStatuses[i % appointmentStatuses.length];
    if (i % 8 === 0) status = APPOINTMENT_STATUS.CANCELLED;
    if (i > 50) status = APPOINTMENT_STATUS.COMPLETED;

    const appt = await prisma.appointment.create({
      data: {
        date: new Date(`2026-${String(months[i % 3]).padStart(2, '0')}-${String(((i % 22) + 4)).padStart(2, '0')}T09:00`),
        status,
        workspace_id: workspace.id,
        client_id: vehicle.client_id,
        vehicle_id: vehicle.id,
        time_slot_id: timeSlots[i % timeSlots.length].id,
        user_id: mechanic.id,
      },
    });
    appointments.push(appt);
  }

  // ==================== INTERVENTIONS ====================
  const interventionDescriptions = [
    'Vidange + filtres', 'Remplacement plaquettes de frein', 'Diagnostic électronique',
    'Entretien climatisation', 'Remplacement courroie de distribution', 'Contrôle suspension',
    'Changement de batterie', 'Révision complète', 'Contrôle freinage',
  ];

  for (const appt of appointments) {
    const nb = appt.status === APPOINTMENT_STATUS.COMPLETED ? 2 : appt.status === APPOINTMENT_STATUS.IN_PROGRESS ? 2 : 1;

    for (let j = 0; j < nb; j++) {
      let intStatus = INTERVENTION_STATUS.PENDING;
      if (appt.status === APPOINTMENT_STATUS.COMPLETED) intStatus = INTERVENTION_STATUS.COMPLETED;
      else if (appt.status === APPOINTMENT_STATUS.IN_PROGRESS) intStatus = j === 0 ? INTERVENTION_STATUS.COMPLETED : INTERVENTION_STATUS.IN_PROGRESS;

      await prisma.intervention.create({
        data: {
          description: faker.helpers.arrayElement(interventionDescriptions),
          status: intStatus,
          workspace_id: workspace.id,
          appointment_id: appt.id,
        },
      });
    }
  }

  // ==================== PROFORMAS + INVOICES + PAYMENTS ====================
  const completedAppts = appointments.filter(a => a.status === 'COMPLETED');

  for (let i = 0; i < completedAppts.length; i++) {
    const appt = completedAppts[i];

    const proformaStatus = faker.helpers.arrayElement(Object.values(PROFORMA_STATUS));

    const proforma = await prisma.proforma.create({
      data: {
        reference: `PRO-${faker.string.alphanumeric(8).toUpperCase()}`,
        total: faker.number.float({ min: 150, max: 850, multipleOf: 0.01 }),
        status: proformaStatus,
        workspace_id: workspace.id,
        appointment_id: appt.id,
      },
    });

    if (proformaStatus === PROFORMA_STATUS.ACCEPTED || proformaStatus === PROFORMA_STATUS.SENT) {
      const invoiceStatus = faker.helpers.arrayElement([INVOICE_STATUS.DRAFT, INVOICE_STATUS.UNPAID, INVOICE_STATUS.PAID, INVOICE_STATUS.OVERDUE]);

      const invoice = await prisma.invoice.create({
        data: {
          reference: `FAC-${faker.string.alphanumeric(8).toUpperCase()}`,
          total: proforma.total,
          status: invoiceStatus,
          workspace_id: workspace.id,
          proforma_id: proforma.id,
          appointment_id: appt.id,
          user_id: admin.id,
          client_id: appt.client_id,
        },
      });

      if (invoiceStatus === INVOICE_STATUS.PAID) {
        await prisma.payment.create({
          data: {
            amount: invoice.total,
            method: faker.helpers.arrayElement(['CARD', 'TRANSFER', 'CASH']),
            workspace_id: workspace.id,
            invoice_id: invoice.id,
            client_id: appt.client_id,
            user_id: admin.id,
          },
        });
      }
    }
  }

  // ==================== STOCK ====================
  const supplier = await prisma.supplier.create({
    data: {
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      workspace_id: workspace.id,
    },
  });

  const category = await prisma.stockCategory.create({
    data: { name: 'Pièces et Consommables', workspace_id: workspace.id },
  });

  for (let i = 0; i < 25; i++) {
    await prisma.stockItem.create({
      data: {
        name: faker.commerce.productName(),
        reference: `REF-${faker.string.alphanumeric(6).toUpperCase()}`,
        category_id: category.id,
        supplier_id: supplier.id,
        price_buy: faker.number.float({ min: 8, max: 120, multipleOf: 0.5 }),
        price_sell: faker.number.float({ min: 20, max: 250, multipleOf: 0.5 }),
        quantity: faker.number.int({ min: 10, max: 80 }),
        workspace_id: workspace.id,
      },
    });
  }

  // ==================== PURCHASE ORDERS ====================
  const poStatuses = [PURCHASE_ORDER_STATUS.DRAFT, PURCHASE_ORDER_STATUS.SENT, PURCHASE_ORDER_STATUS.RECEIVED];
  for (let i = 0; i < 20; i++) {
    const status = poStatuses[i % 3];
    const po = await prisma.purchaseOrder.create({
      data: {
        reference: `PO-${faker.string.alphanumeric(8).toUpperCase()}`,
        status,
        supplier_id: supplier.id,
        workspace_id: workspace.id,
      },
    });

    await prisma.purchaseOrderItem.create({
      data: {
        purchase_order_id: po.id,
        item_id: (await prisma.stockItem.findFirst())!.id,
        quantity: faker.number.int({ min: 5, max: 20 }),
        price_buy: faker.number.float({ min: 15, max: 80 }),
      },
    });

    if (status === PURCHASE_ORDER_STATUS.RECEIVED) {
      await prisma.stockReception.create({
        data: { purchase_order_id: po.id, workspace_id: workspace.id },
      });
    }
  }

  // ==================== STOCK MOVEMENTS ====================
  const stockItems = await prisma.stockItem.findMany();
  for (let i = 0; i < 50; i++) {
    const item = stockItems[i % stockItems.length];
    const type = faker.helpers.arrayElement(['in', 'out', 'adjust'] as const);

    await prisma.stockMovement.create({
      data: {
        type,
        quantity: type === 'out' ? -faker.number.int({ min: 1, max: 8 }) : faker.number.int({ min: 3, max: 15 }),
        item_id: item.id,
        workspace_id: workspace.id,
      },
    });
  }

  console.log('\n✅ Seed terminé avec succès !');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());