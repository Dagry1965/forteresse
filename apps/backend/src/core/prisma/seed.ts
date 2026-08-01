import { Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';
import {
  APPOINTMENT_STATUS,
  CASE_STATUS,
  CLIENT_TYPE,
  INVOICE_STATUS,
  INVOICE_TYPE,
  INTERVENTION_STATUS,
  PAYMENT_SCHEDULE_STATUS,
  PROFORMA_STATUS,
  PURCHASE_ORDER_STATUS,
  STOCK_MOVEMENT_TYPE,
  TIME_SLOT_STATUS,
  USER_ROLE,
  VEHICLE_STATUS,
} from '../../../../../shared/constants/status.constants';

const prisma = new PrismaClient();

const WORKSPACE_ID = 'seed-workspace-1';
const ADMIN_EMAIL = 'admin@forteresse.local';
const PASSWORD = 'adminpassword';

const JEAN_LUC_EMAIL = 'jean.luc.ohin@amarkhys.com';
const JEAN_LUC_PASSWORD = 'bonjourjeanluc';

const PAPA_SY_SAVANE_EMAIL = 'papa.sy.savane@amarkhys.com';
const PAPA_SY_SAVANE_PASSWORD = 'bonjourpapa';

const pick = <T>(values: readonly T[]): T =>
  faker.helpers.arrayElement([...values]);

const randomInt = (min: number, max: number): number =>
  faker.number.int({ min, max });

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const round = (value: number): number => Number(value.toFixed(2));

const brands = [
  'Peugeot',
  'Renault',
  'Citro\u00ebn',
  'Volkswagen',
  'Mercedes-Benz',
  'Ford',
  'Toyota',
  'Nissan',
  'Volvo',
  'Iveco',
] as const;

const models: Record<string, readonly string[]> = {
  Peugeot: ['208', '308', 'Partner', 'Expert', 'Boxer'],
  Renault: ['Clio', 'M\u00e9gane', 'Kangoo', 'Trafic', 'Master'],
  'Citro\u00ebn': ['C3', 'C4', 'Berlingo', 'Jumpy', 'Jumper'],
  Volkswagen: ['Golf', 'Passat', 'Caddy', 'Transporter', 'Crafter'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'Vito', 'Sprinter'],
  Ford: ['Fiesta', 'Focus', 'Transit Connect', 'Transit'],
  Toyota: ['Yaris', 'Corolla', 'ProAce', 'Hilux'],
  Nissan: ['Micra', 'Qashqai', 'Townstar', 'Interstar'],
  Volvo: ['V40', 'V60', 'XC40', 'XC60'],
  Iveco: ['Daily', 'Eurocargo'],
};

const operations = [
  'Diagnostic moteur',
  'Entretien p\u00e9riodique',
  'Vidange et remplacement des filtres',
  'Remplacement des plaquettes de frein',
  'Recherche de panne \u00e9lectrique',
  'Remplacement du kit de distribution',
  'Entretien de la climatisation',
  'Remplacement de pneumatiques',
  'R\u00e9paration du circuit de refroidissement',
  'Pr\u00e9paration au contr\u00f4le technique',
] as const;

const stockDefinitions = [
  ['Huile moteur 5W30', 'LITRE', 8, 18],
  ['Huile moteur 5W40', 'LITRE', 9, 19],
  ['Filtre \u00e0 huile', 'PIECE', 7, 19],
  ['Filtre \u00e0 air', 'PIECE', 10, 25],
  ['Filtre habitacle', 'PIECE', 9, 23],
  ['Filtre \u00e0 carburant', 'PIECE', 15, 39],
  ['Plaquettes avant', 'JEU', 34, 91],
  ['Plaquettes arri\u00e8re', 'JEU', 29, 81],
  ['Disque de frein avant', 'PIECE', 44, 109],
  ['Disque de frein arri\u00e8re', 'PIECE', 38, 95],
  ['Liquide de frein DOT4', 'LITRE', 6, 17],
  ['Liquide de refroidissement', 'LITRE', 5, 14],
  ['Batterie 70Ah', 'PIECE', 84, 165],
  ['Bougie d\u2019allumage', 'PIECE', 7, 20],
  ['Bougie de pr\u00e9chauffage', 'PIECE', 14, 34],
  ['Courroie accessoires', 'PIECE', 19, 51],
  ['Kit distribution', 'KIT', 98, 255],
  ['Pompe \u00e0 eau', 'PIECE', 41, 103],
  ['Balai essuie-glace', 'PIECE', 9, 25],
  ['Ampoule H7', 'PIECE', 4, 14],
  ['Pneumatique tourisme', 'PIECE', 52, 110],
  ['Pneumatique utilitaire', 'PIECE', 72, 145],
  ['Capteur ABS', 'PIECE', 26, 72],
  ['Sonde de temp\u00e9rature', 'PIECE', 20, 59],
  ['Main-d\u2019\u0153uvre atelier', 'HEURE', 0, 72],
] as const;

async function clearDemoWorkspace(): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: WORKSPACE_ID },
    select: { id: true },
  });

  if (!workspace) return;

  const invoiceIds = (
    await prisma.invoice.findMany({
      where: { workspace_id: WORKSPACE_ID },
      select: { id: true },
    })
  ).map((row) => row.id);

  const proformaIds = (
    await prisma.proforma.findMany({
      where: { workspace_id: WORKSPACE_ID },
      select: { id: true },
    })
  ).map((row) => row.id);

  const interventionIds = (
    await prisma.intervention.findMany({
      where: { workspace_id: WORKSPACE_ID },
      select: { id: true },
    })
  ).map((row) => row.id);

  const orderIds = (
    await prisma.purchaseOrder.findMany({
      where: { workspace_id: WORKSPACE_ID },
      select: { id: true },
    })
  ).map((row) => row.id);

  const inventoryIds = (
    await prisma.inventory.findMany({
      where: { workspace_id: WORKSPACE_ID },
      select: { id: true },
    })
  ).map((row) => row.id);

  if (invoiceIds.length) {
    await prisma.invoiceLine.deleteMany({
      where: { invoice_id: { in: invoiceIds } },
    });
  }

  if (proformaIds.length) {
    await prisma.proformaLine.deleteMany({
      where: { proforma_id: { in: proformaIds } },
    });
  }

  if (interventionIds.length) {
    await prisma.interventionPart.deleteMany({
      where: { intervention_id: { in: interventionIds } },
    });
  }

  if (orderIds.length) {
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchase_order_id: { in: orderIds } },
    });
  }

  if (inventoryIds.length) {
    await prisma.inventoryItem.deleteMany({
      where: { inventory_id: { in: inventoryIds } },
    });
  }

  await prisma.paymentSchedule.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.payment.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.invoice.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.proforma.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.intervention.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.case.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.appointment.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.timeSlot.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.stockMovement.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.stockReception.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.purchaseReceipt.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.purchaseOrder.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.inventory.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.stockItem.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.stockCategory.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.supplier.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.clientContact.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.vehicle.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.client.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.refreshToken.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.workspaceMember.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.businessSettings.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.numberSequence.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.user.deleteMany({ where: { workspace_id: WORKSPACE_ID } });
  await prisma.workspace.delete({ where: { id: WORKSPACE_ID } });
}

async function main(): Promise<void> {
  faker.seed(1965);
  await clearDemoWorkspace();

  const workspace = await prisma.workspace.create({
    data: {
      id: WORKSPACE_ID,
      name: 'Garage AMARKHYS D\u00e9monstration',
      businessSettings: {
        create: {
          openingTime: '08:00',
          closingTime: '18:00',
          slotDuration: 60,
          maxConcurrent: 4,
          workingDays: '1,2,3,4,5,6',
        },
      },
    },
  });

  const hashedPassword = await argon2.hash(PASSWORD);
  const jeanLucPassword = await argon2.hash(JEAN_LUC_PASSWORD);
  const papaSySavanePassword = await argon2.hash(PAPA_SY_SAVANE_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: 'Administrateur AMARKHYS',
      password: hashedPassword,
      workspace_id: workspace.id,
    },
  });

  const jeanLucOhin = await prisma.user.create({
    data: {
      email: JEAN_LUC_EMAIL,
      name: 'Jean-Luc Ohin',
      password: jeanLucPassword,
      workspace_id: workspace.id,
    },
  });

  const papaSySavane = await prisma.user.create({
    data: {
      email: PAPA_SY_SAVANE_EMAIL,
      name: 'Papa Sy Savané',
      password: papaSySavanePassword,
      workspace_id: workspace.id,
    },
  });

  const users = [admin, jeanLucOhin, papaSySavane];

  for (let index = 1; index <= 7; index += 1) {
    users.push(
      await prisma.user.create({
        data: {
          email: `mecanicien${index}@forteresse.local`,
          name: faker.person.fullName(),
          password: hashedPassword,
          workspace_id: workspace.id,
        },
      }),
    );
  }

  await prisma.workspaceMember.createMany({
    data: users.map((user, index) => ({
      workspace_id: workspace.id,
      user_id: user.id,
      role:
        index <= 2
          ? USER_ROLE.ADMIN
          : index <= 7
            ? USER_ROLE.MECHANIC
            : USER_ROLE.MEMBER,
    })),
  });

  const suppliers = [];

  for (let index = 1; index <= 10; index += 1) {
    suppliers.push(
      await prisma.supplier.create({
        data: {
          name: `${faker.company.name()} Auto`,
          email: `fournisseur${index}@demo.local`,
          phone: faker.phone.number(),
          workspace_id: workspace.id,
        },
      }),
    );
  }

  const categories = [];

  for (const name of [
    'Lubrifiants',
    'Freinage',
    'Filtration',
    '\u00c9lectricit\u00e9',
    'Refroidissement',
    'Distribution',
    'Pneumatiques',
    'Consommables',
  ]) {
    categories.push(
      await prisma.stockCategory.create({
        data: { name, workspace_id: workspace.id },
      }),
    );
  }

  const stockItems = [];

  for (let index = 0; index < stockDefinitions.length; index += 1) {
    const [name, unit, priceBuy, priceSell] = stockDefinitions[index];

    stockItems.push(
      await prisma.stockItem.create({
        data: {
          name,
          unit,
          price_buy: priceBuy,
          price_sell: priceSell,
          reference: `ART-${String(index + 1).padStart(4, '0')}`,
          description: `${name} pour entretien automobile`,
          quantity: randomInt(0, 80),
          min_stock: randomInt(5, 15),
          category_id: categories[index % categories.length].id,
          supplier_id: suppliers[index % suppliers.length].id,
          workspace_id: workspace.id,
        },
      }),
    );
  }

  const companies = [];

  for (let index = 1; index <= 15; index += 1) {
    const name = faker.company.name();

    const company = await prisma.client.create({
      data: {
        type: CLIENT_TYPE.COMPANY,
        name,
        company_name: name,
        trade_name: index % 3 === 0 ? `${name} Services` : null,
        registration_number: `ENT-${String(index).padStart(6, '0')}`,
        vat_number: `BE0${700000000 + index}`,
        phone: faker.phone.number(),
        email: `entreprise${index}@demo.local`,
        address: faker.location.streetAddress(),
        billing_address: faker.location.streetAddress(),
        payment_terms_days: pick([15, 30, 45, 60]),
        credit_limit: pick([5000, 10000, 15000, 25000]),
        workspace_id: workspace.id,
      },
    });

    companies.push(company);

    await prisma.clientContact.createMany({
      data: [
        {
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          role: 'Gestionnaire de flotte',
          email: `flotte${index}@demo.local`,
          phone: faker.phone.number(),
          is_primary: true,
          receives_proforma: true,
          receives_invoice: true,
          workspace_id: workspace.id,
          client_id: company.id,
        },
        {
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          role: 'Comptabilit\u00e9',
          email: `compta${index}@demo.local`,
          phone: faker.phone.number(),
          receives_invoice: true,
          workspace_id: workspace.id,
          client_id: company.id,
        },
      ],
    });
  }

  const individuals = [];

  for (let index = 1; index <= 25; index += 1) {
    individuals.push(
      await prisma.client.create({
        data: {
          type: CLIENT_TYPE.INDIVIDUAL,
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          email: `particulier${index}@demo.local`,
          address: faker.location.streetAddress(),
          workspace_id: workspace.id,
        },
      }),
    );
  }

  const clients = [...companies, ...individuals];
  const vehicles = [];
  let vehicleNumber = 1;

  for (const company of companies) {
    const count = randomInt(4, 7);

    for (let index = 0; index < count; index += 1) {
      const brand = pick(brands);

      vehicles.push(
        await prisma.vehicle.create({
          data: {
            registration: `FT-${String(vehicleNumber).padStart(4, '0')}`,
            brand,
            model: pick(models[brand]),
            status: pick([
              VEHICLE_STATUS.DISPONIBLE,
              VEHICLE_STATUS.DISPONIBLE,
              VEHICLE_STATUS.EN_REPARATION,
              VEHICLE_STATUS.EN_ATTENTE_PIECES,
              VEHICLE_STATUS.HORS_SERVICE,
            ]),
            fleet_number: `FL-${String(vehicleNumber).padStart(4, '0')}`,
            vin: faker.vehicle.vin(),
            year: randomInt(2015, 2026),
            mileage: randomInt(10000, 290000),
            usual_driver: faker.person.fullName(),
            cost_center: `CC-${randomInt(100, 999)}`,
            service_name: pick([
              'Direction',
              'Commercial',
              'Livraison',
              'Technique',
              'Maintenance',
            ]),
            client_id: company.id,
            workspace_id: workspace.id,
          },
        }),
      );

      vehicleNumber += 1;
    }
  }

  for (const individual of individuals) {
    const brand = pick(brands);

    vehicles.push(
      await prisma.vehicle.create({
        data: {
          registration: `FT-${String(vehicleNumber).padStart(4, '0')}`,
          brand,
          model: pick(models[brand]),
          status: pick([
            VEHICLE_STATUS.DISPONIBLE,
            VEHICLE_STATUS.DISPONIBLE,
            VEHICLE_STATUS.EN_REPARATION,
          ]),
          vin: faker.vehicle.vin(),
          year: randomInt(2010, 2026),
          mileage: randomInt(15000, 260000),
          client_id: individual.id,
          workspace_id: workspace.id,
        },
      }),
    );

    vehicleNumber += 1;
  }

  const appointmentStages = [
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.IN_PROGRESS,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
    APPOINTMENT_STATUS.COMPLETED,
  ] as const;

  const caseStages = [
    CASE_STATUS.RECEIVED,
    CASE_STATUS.DIAGNOSIS,
    CASE_STATUS.WAITING_PARTS,
    CASE_STATUS.IN_PROGRESS,
    CASE_STATUS.COMPLETED,
    CASE_STATUS.INVOICED,
  ] as const;

  const proformaStages = [
    PROFORMA_STATUS.ACCEPTED,
    PROFORMA_STATUS.SENT,
    PROFORMA_STATUS.ACCEPTED,
    PROFORMA_STATUS.DRAFT,
    PROFORMA_STATUS.ACCEPTED,
    PROFORMA_STATUS.REJECTED,
  ] as const;

  const invoiceStages = [
    INVOICE_STATUS.OVERDUE,
    INVOICE_STATUS.PARTIALLY_PAID,
    INVOICE_STATUS.UNPAID,
    INVOICE_STATUS.PAID,
    INVOICE_STATUS.OVERDUE,
    INVOICE_STATUS.CANCELLED,
  ] as const;

  let caseCount = 0;
  let interventionCount = 0;
  let proformaCount = 0;
  let invoiceCount = 0;
  let paymentCount = 0;
  let overdueScheduleCount = 0;

  for (let index = 0; index < 120; index += 1) {
    const vehicle = vehicles[index % vehicles.length];
    const user = users[index % users.length];
    const appointmentStatus =
      appointmentStages[index % appointmentStages.length];

    const date = addDays(new Date(), randomInt(-120, 45));
    date.setHours(randomInt(8, 16), pick([0, 30]), 0, 0);

    const slot = await prisma.timeSlot.create({
      data: {
        start: date,
        end: new Date(date.getTime() + 3600000),
        status:
          appointmentStatus === APPOINTMENT_STATUS.CANCELLED
            ? TIME_SLOT_STATUS.CANCELLED
            : appointmentStatus === APPOINTMENT_STATUS.PENDING
              ? TIME_SLOT_STATUS.OPEN
              : TIME_SLOT_STATUS.CLOSED,
        occupancy:
          appointmentStatus === APPOINTMENT_STATUS.CANCELLED ? 0 : 1,
        workspace_id: workspace.id,
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        date,
        status: appointmentStatus,
        workspace_id: workspace.id,
        client_id: vehicle.client_id,
        vehicle_id: vehicle.id,
        time_slot_id: slot.id,
        user_id: user.id,
        created_by: admin.id,
        updated_by: user.id,
      },
    });

    if (
      appointmentStatus === APPOINTMENT_STATUS.PENDING ||
      appointmentStatus === APPOINTMENT_STATUS.CANCELLED ||
      appointmentStatus === APPOINTMENT_STATUS.NO_SHOW
    ) {
      continue;
    }

    const caseStatus =
      appointmentStatus === APPOINTMENT_STATUS.COMPLETED
        ? pick([CASE_STATUS.COMPLETED, CASE_STATUS.INVOICED])
        : caseStages[index % caseStages.length];

    const repairCase = await prisma.case.create({
      data: {
        reference: `DOS-${new Date().getFullYear()}-${String(
          caseCount + 1,
        ).padStart(4, '0')}`,
        status: caseStatus,
        title: pick(operations),
        description: faker.lorem.sentence(),
        workspace_id: workspace.id,
        customer_id: vehicle.client_id,
        vehicle_id: vehicle.id,
        appointment_id: appointment.id,
      },
    });

    caseCount += 1;

    for (let interventionIndex = 0; interventionIndex < randomInt(1, 3); interventionIndex += 1) {
      const intervention = await prisma.intervention.create({
        data: {
          description: pick(operations),
          status:
            caseStatus === CASE_STATUS.COMPLETED ||
            caseStatus === CASE_STATUS.INVOICED
              ? INTERVENTION_STATUS.COMPLETED
              : caseStatus === CASE_STATUS.DIAGNOSIS
                ? INTERVENTION_STATUS.DIAGNOSIS
                : caseStatus === CASE_STATUS.IN_PROGRESS
                  ? INTERVENTION_STATUS.IN_PROGRESS
                  : INTERVENTION_STATUS.PENDING,
          workspace_id: workspace.id,
          case_id: repairCase.id,
        },
      });

      interventionCount += 1;

      for (const item of faker.helpers.arrayElements(stockItems, randomInt(1, 3))) {
        const quantity = randomInt(1, 3);

        await prisma.interventionPart.create({
          data: {
            intervention_id: intervention.id,
            item_id: item.id,
            quantity,
            price_snapshot: item.price_sell,
          },
        });

        await prisma.stockMovement.create({
          data: {
            type: STOCK_MOVEMENT_TYPE.OUT_WORKSHOP,
            quantity,
            item_id: item.id,
            workspace_id: workspace.id,
            created_by: user.id,
          },
        });
      }
    }

    if (
      caseStatus !== CASE_STATUS.COMPLETED &&
      caseStatus !== CASE_STATUS.INVOICED
    ) {
      continue;
    }

    const client = clients.find((row) => row.id === vehicle.client_id);

    if (!client) continue;

    const selectedParts = faker.helpers.arrayElements(
      stockItems,
      randomInt(1, 4),
    );

    const lines = [
      {
        type: 'LABOR',
        label: 'Main-d\u2019\u0153uvre atelier',
        quantity: randomInt(1, 6),
        unitPrice: 72,
      },
      ...selectedParts.map((item) => ({
        type: 'PART',
        label: item.name,
        quantity: randomInt(1, 3),
        unitPrice: item.price_sell,
      })),
    ];

    const lineTotals = lines.map((line) =>
      round(line.quantity * line.unitPrice * 1.21),
    );

    const total = round(
      lineTotals.reduce((sum, value) => sum + value, 0),
    );

    const proformaStatus =
      proformaStages[proformaCount % proformaStages.length];

    const proforma = await prisma.proforma.create({
      data: {
        reference: `DEV-${new Date().getFullYear()}-${String(
          proformaCount + 1,
        ).padStart(5, '0')}`,
        total,
        status: proformaStatus,
        appointment_id: appointment.id,
        case_id: repairCase.id,
        workspace_id: workspace.id,
        customer_name_snapshot: client.company_name || client.name,
        customer_address_snapshot: client.address,
        customer_billing_address_snapshot:
          client.billing_address || client.address,
        customer_registration_number_snapshot: client.registration_number,
        customer_vat_number_snapshot: client.vat_number,
        customer_email_snapshot: client.email,
        customer_phone_snapshot: client.phone,
      },
    });

    proformaCount += 1;

    await prisma.proformaLine.createMany({
      data: lines.map((line, lineIndex) => ({
        proforma_id: proforma.id,
        type: line.type,
        label: line.label,
        quantity: new Prisma.Decimal(line.quantity),
        unit_price: new Prisma.Decimal(line.unitPrice),
        vat_rate: new Prisma.Decimal(21),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(lineTotals[lineIndex]),
      })),
    });

    if (proformaStatus !== PROFORMA_STATUS.ACCEPTED) continue;

    const invoiceStatus =
      invoiceStages[invoiceCount % invoiceStages.length];

    const invoice = await prisma.invoice.create({
      data: {
        reference: `FAC-${new Date().getFullYear()}-${String(
          invoiceCount + 1,
        ).padStart(5, '0')}`,
        total,
        status: invoiceStatus,
        type:
          client.type === CLIENT_TYPE.COMPANY && invoiceCount % 3 === 0
            ? INVOICE_TYPE.FLEET
            : INVOICE_TYPE.INVOICE,
        workspace_id: workspace.id,
        proforma_id: proforma.id,
        appointment_id: appointment.id,
        user_id: user.id,
        client_id: client.id,
        created_by: admin.id,
        updated_by: user.id,
        customer_name_snapshot: client.company_name || client.name,
        customer_address_snapshot: client.address,
        customer_billing_address_snapshot:
          client.billing_address || client.address,
        customer_registration_number_snapshot: client.registration_number,
        customer_vat_number_snapshot: client.vat_number,
        customer_email_snapshot: client.email,
        customer_phone_snapshot: client.phone,
      },
    });

    invoiceCount += 1;

    await prisma.invoiceLine.createMany({
      data: lines.map((line, lineIndex) => ({
        invoice_id: invoice.id,
        type: line.type,
        label: line.label,
        quantity: new Prisma.Decimal(line.quantity),
        unit_price: new Prisma.Decimal(line.unitPrice),
        vat_rate: new Prisma.Decimal(21),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(lineTotals[lineIndex]),
      })),
    });

    const installments =
      client.type === CLIENT_TYPE.COMPANY ? pick([1, 2, 3, 4]) : pick([1, 2]);

    const installmentAmount = round(total / installments);

    const paidInstallments =
      invoiceStatus === INVOICE_STATUS.PAID
        ? installments
        : invoiceStatus === INVOICE_STATUS.PARTIALLY_PAID
          ? Math.max(1, installments - 1)
          : 0;

    for (let installmentIndex = 0; installmentIndex < installments; installmentIndex += 1) {
      const isOverdue =
        invoiceStatus === INVOICE_STATUS.OVERDUE ||
        (
          invoiceStatus === INVOICE_STATUS.PARTIALLY_PAID &&
          installmentIndex >= paidInstallments &&
          installmentIndex === 0
        );

      const dueDate = isOverdue
        ? addDays(new Date(), -pick([5, 15, 30, 60]))
        : addDays(
            new Date(),
            (client.payment_terms_days || 15) + installmentIndex * 30,
          );

      const amount =
        installmentIndex === installments - 1
          ? round(total - installmentAmount * (installments - 1))
          : installmentAmount;

      const scheduleStatus =
        invoiceStatus === INVOICE_STATUS.CANCELLED
          ? PAYMENT_SCHEDULE_STATUS.CANCELLED
          : installmentIndex < paidInstallments
            ? PAYMENT_SCHEDULE_STATUS.PAID
            : PAYMENT_SCHEDULE_STATUS.PENDING;

      await prisma.paymentSchedule.create({
        data: {
          invoice_id: invoice.id,
          amount,
          due_date: dueDate,
          status: scheduleStatus,
          workspace_id: workspace.id,
        },
      });

      if (
        isOverdue &&
        scheduleStatus === PAYMENT_SCHEDULE_STATUS.PENDING
      ) {
        overdueScheduleCount += 1;
      }

      if (scheduleStatus === PAYMENT_SCHEDULE_STATUS.PAID) {
        await prisma.payment.create({
          data: {
            amount,
            method: pick(['CASH', 'CARD', 'BANK_TRANSFER']),
            paid_at: addDays(dueDate, randomInt(-5, 5)),
            reference: `PAY-${String(paymentCount + 1).padStart(6, '0')}`,
            notes:
              invoiceStatus === INVOICE_STATUS.PARTIALLY_PAID
                ? 'R\u00e8glement partiel selon \u00e9ch\u00e9ancier'
                : 'R\u00e8glement de facture',
            workspace_id: workspace.id,
            invoice_id: invoice.id,
            client_id: client.id,
            user_id: user.id,
          },
        });

        paymentCount += 1;
      }
    }
  }

  for (let index = 1; index <= 20; index += 1) {
    const supplier = suppliers[index % suppliers.length];

    const status = pick([
      PURCHASE_ORDER_STATUS.DRAFT,
      PURCHASE_ORDER_STATUS.SENT,
      PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
      PURCHASE_ORDER_STATUS.RECEIVED,
      PURCHASE_ORDER_STATUS.CANCELLED,
    ]);

    const order = await prisma.purchaseOrder.create({
      data: {
        reference: `CMD-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`,
        status,
        supplier_id: supplier.id,
        workspace_id: workspace.id,
        created_by: admin.id,
      },
    });

    for (const item of faker.helpers.arrayElements(stockItems, randomInt(2, 5))) {
      const quantity = randomInt(5, 30);

      const receivedQuantity =
        status === PURCHASE_ORDER_STATUS.RECEIVED
          ? quantity
          : status === PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED
            ? randomInt(1, quantity - 1)
            : 0;

      await prisma.purchaseOrderItem.create({
        data: {
          purchase_order_id: order.id,
          item_id: item.id,
          quantity,
          received_quantity: receivedQuantity,
          price_buy: item.price_buy,
        },
      });

      if (receivedQuantity > 0) {
        await prisma.stockMovement.create({
          data: {
            type: STOCK_MOVEMENT_TYPE.IN_PURCHASE,
            quantity: receivedQuantity,
            item_id: item.id,
            workspace_id: workspace.id,
            created_by: admin.id,
          },
        });
      }
    }

    if (
      status === PURCHASE_ORDER_STATUS.RECEIVED ||
      status === PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED
    ) {
      await prisma.stockReception.create({
        data: {
          purchase_order_id: order.id,
          workspace_id: workspace.id,
        },
      });

      await prisma.purchaseReceipt.create({
        data: {
          reference: `REC-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`,
          purchase_order_id: order.id,
          workspace_id: workspace.id,
        },
      });
    }
  }

  const inventory = await prisma.inventory.create({
    data: {
      reference: `INV-${new Date().getFullYear()}-0001`,
      workspace_id: workspace.id,
    },
  });

  for (const item of stockItems) {
    await prisma.inventoryItem.create({
      data: {
        inventory_id: inventory.id,
        item_id: item.id,
        expected: item.quantity,
        counted: Math.max(0, item.quantity + randomInt(-3, 3)),
      },
    });
  }

  await prisma.numberSequence.createMany({
    data: [
      {
        workspace_id: workspace.id,
        prefix: 'DEV',
        year: new Date().getFullYear(),
        last_number: proformaCount,
      },
      {
        workspace_id: workspace.id,
        prefix: 'FAC',
        year: new Date().getFullYear(),
        last_number: invoiceCount,
      },
      {
        workspace_id: workspace.id,
        prefix: 'CMD',
        year: new Date().getFullYear(),
        last_number: 20,
      },
      {
        workspace_id: workspace.id,
        prefix: 'DOS',
        year: new Date().getFullYear(),
        last_number: caseCount,
      },
    ],
  });

  console.log('\u2705 Seed garage termin\u00e9');
  console.log({
    workspace: workspace.id,
    users: users.length,
    companies: companies.length,
    individuals: individuals.length,
    contacts: companies.length * 2,
    vehicles: vehicles.length,
    appointments: 120,
    cases: caseCount,
    interventions: interventionCount,
    proformas: proformaCount,
    invoices: invoiceCount,
    payments: paymentCount,
    overdueSchedules: overdueScheduleCount,
    stockItems: stockItems.length,
    purchaseOrders: 20,
  });
  console.log(`Connexion : ${ADMIN_EMAIL} / ${PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('\u274c Erreur durant le seed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
