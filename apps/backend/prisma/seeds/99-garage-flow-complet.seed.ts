import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const WORKSPACE_ID = 'seed-workspace-1';
const ADMIN_PASSWORD = 'Admin123!';

function dateIn(days: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function money(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function gross(value: number): Prisma.Decimal {
  return money(Math.round(value * 1.2 * 100) / 100);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function normalizeRegistration(registration: string): string {
  return registration.trim().toUpperCase().replace(/\s+/g, '');
}

function moneyToNumber(decimal: Prisma.Decimal | number): number {
  return Number(decimal);
}

type FlowClient = {
  id: string;
  name: string;
  address?: string | null;
  billing_address?: string | null;
  registration_number?: string | null;
  vat_number?: string | null;
  email: string;
  phone: string;
};

type FlowVehicle = {
  id: string;
};

type FlowAppointment = {
  id: string;
};

type FlowPartSpec = {
  itemIndex: number;
  quantity: number;
  unitPrice: number;
  label: string;
};

type FlowInterventionSpec = {
  description: string;
  status: string;
  parts: FlowPartSpec[];
};

type FlowScenario = {
  appointment: FlowAppointment;
  client: FlowClient;
  vehicle: FlowVehicle;
  status: string;
  title: string;
  description: string;
  interventions: FlowInterventionSpec[];
  proforma: { reference: string; status: string } | null;
  invoice?: { reference: string; status: string };
  paid?: boolean;
};

async function clearWorkspace(): Promise<void> {
  const id = WORKSPACE_ID;

  await prisma.auditLog.deleteMany({ where: { workspace_id: id } });
  await prisma.refreshToken.deleteMany({ where: { workspace_id: id } });

  await prisma.cashMovement.deleteMany({ where: { workspace_id: id } });
  await prisma.payment.deleteMany({ where: { workspace_id: id } });
  await prisma.paymentSchedule.deleteMany({ where: { workspace_id: id } });
  await prisma.cashRegister.deleteMany({ where: { workspace_id: id } });

  await prisma.invoiceLine.deleteMany({ where: { invoice: { workspace_id: id } } });
  await prisma.invoice.deleteMany({ where: { workspace_id: id } });

  await prisma.proformaLine.deleteMany({ where: { proforma: { workspace_id: id } } });
  await prisma.proforma.deleteMany({ where: { workspace_id: id } });

  await prisma.interventionPart.deleteMany({ where: { intervention: { workspace_id: id } } });
  await prisma.intervention.deleteMany({ where: { workspace_id: id } });

  await prisma.case.deleteMany({ where: { workspace_id: id } });
  await prisma.appointment.deleteMany({ where: { workspace_id: id } });
  await prisma.timeSlot.deleteMany({ where: { workspace_id: id } });

  await prisma.inventoryItem.deleteMany({ where: { inventory: { workspace_id: id } } });
  await prisma.inventory.deleteMany({ where: { workspace_id: id } });

  await prisma.purchaseReceipt.deleteMany({ where: { workspace_id: id } });
  await prisma.stockReception.deleteMany({ where: { workspace_id: id } });
  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { workspace_id: id } } });
  await prisma.purchaseOrder.deleteMany({ where: { workspace_id: id } });

  await prisma.stockMovement.deleteMany({ where: { workspace_id: id } });
  await prisma.stockItem.deleteMany({ where: { workspace_id: id } });
  await prisma.stockCategory.deleteMany({ where: { workspace_id: id } });
  await prisma.supplier.deleteMany({ where: { workspace_id: id } });

  await prisma.clientContact.deleteMany({ where: { workspace_id: id } });
  await prisma.vehicle.deleteMany({ where: { workspace_id: id } });
  await prisma.client.deleteMany({ where: { workspace_id: id } });

  await prisma.numberSequence.deleteMany({ where: { workspace_id: id } });
  await prisma.businessSettings.deleteMany({ where: { workspace_id: id } });

  await prisma.workspaceMember.deleteMany({ where: { workspace_id: id } });
  await prisma.user.deleteMany({ where: { workspace_id: id } });
  await prisma.workspace.deleteMany({ where: { id } });
}

async function main(): Promise<void> {
  await clearWorkspace();

  const password = await argon2.hash(ADMIN_PASSWORD, {
    type: argon2.argon2id,
  });

  const workspace = await prisma.workspace.create({
    data: {
      id: WORKSPACE_ID,
      name: 'Garage Forteresse Démo',
      businessSettings: {
        create: {
          openingTime: '08:00',
          closingTime: '18:00',
          slotDuration: 30,
          maxConcurrent: 3,
          timezone: 'Europe/Paris',
          workingDays: '1,2,3,4,5,6',
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: 'seed-admin-1',
      email: 'admin.flow@forteresse.local',
      name: 'Administrateur Démo',
      password,
      workspace_id: workspace.id,
    },
  });

  const mechanic = await prisma.user.create({
    data: {
      id: 'seed-mechanic-1',
      email: 'mecanicien.flow@forteresse.local',
      name: 'Jean Mécano',
      password,
      workspace_id: workspace.id,
    },
  });

  const reception = await prisma.user.create({
    data: {
      id: 'seed-reception-1',
      email: 'accueil.flow@forteresse.local',
      name: 'Sophie Accueil',
      password,
      workspace_id: workspace.id,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      id: 'seed-accounting-1',
      email: 'compta.flow@forteresse.local',
      name: 'Maya Compta',
      password,
      workspace_id: workspace.id,
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      { workspace_id: workspace.id, user_id: admin.id, role: 'ADMIN' },
      { workspace_id: workspace.id, user_id: mechanic.id, role: 'MECHANIC' },
      { workspace_id: workspace.id, user_id: reception.id, role: 'MEMBER' },
      { workspace_id: workspace.id, user_id: accountant.id, role: 'MEMBER' },
    ],
  });

  const individualClients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Alice Martin',
        phone: '+33 6 10 20 30 40',
        phone_normalized: normalizePhone('+33 6 10 20 30 40'),
        email: 'alice@example.com',
        email_normalized: normalizeEmail('alice@example.com'),
        type: 'INDIVIDUAL',
        address: '12 rue du Pont, 75000 Paris',
        workspace_id: workspace.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Karim Benali',
        phone: '+33 6 22 33 44 55',
        phone_normalized: normalizePhone('+33 6 22 33 44 55'),
        email: 'karim@example.com',
        email_normalized: normalizeEmail('karim@example.com'),
        type: 'INDIVIDUAL',
        address: '7 avenue des Lilas, 75011 Paris',
        workspace_id: workspace.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Jean-Luc Ohin',
        phone: '+33 6 30 40 50 60',
        phone_normalized: normalizePhone('+33 6 30 40 50 60'),
        email: 'jeanluc.ohin@example.com',
        email_normalized: normalizeEmail('jeanluc.ohin@example.com'),
        type: 'INDIVIDUAL',
        address: '3 boulevard Victor, 75015 Paris',
        workspace_id: workspace.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Nadia Diallo',
        phone: '+33 6 40 50 60 70',
        phone_normalized: normalizePhone('+33 6 40 50 60 70'),
        email: 'nadia.diallo@example.com',
        email_normalized: normalizeEmail('nadia.diallo@example.com'),
        type: 'INDIVIDUAL',
        address: '18 rue de la Gare, 93100 Montreuil',
        workspace_id: workspace.id,
      },
    }),
  ]);

  const companyClients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Transports Horizon SARL',
        phone: '+33 1 45 20 30 40',
        phone_normalized: normalizePhone('+33 1 45 20 30 40'),
        email: 'flotte@horizon.example',
        email_normalized: normalizeEmail('flotte@horizon.example'),
        type: 'COMPANY',
        company_name: 'Transports Horizon SARL',
        trade_name: 'Horizon Services',
        registration_number: 'ENT-000001',
        vat_number: 'FR00123456789',
        address: '40 rue des Entreprises, 93120 La Courneuve',
        billing_address: '40 rue des Entreprises, 93120 La Courneuve',
        payment_terms_days: 30,
        credit_limit: money(15000),
        workspace_id: workspace.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Boulangerie du Centre',
        phone: '+33 1 40 50 60 70',
        phone_normalized: normalizePhone('+33 1 40 50 60 70'),
        email: 'direction@boulangerie.example',
        email_normalized: normalizeEmail('direction@boulangerie.example'),
        type: 'COMPANY',
        company_name: 'Boulangerie du Centre',
        trade_name: 'Boulangerie du Centre Services',
        registration_number: 'ENT-000002',
        vat_number: 'FR00987654321',
        address: '2 place Centrale, 75002 Paris',
        billing_address: '2 place Centrale, 75002 Paris',
        payment_terms_days: 15,
        credit_limit: money(6000),
        workspace_id: workspace.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Logistique Nord SA',
        phone: '+33 1 70 80 90 00',
        phone_normalized: normalizePhone('+33 1 70 80 90 00'),
        email: 'ops@logistique-nord.example',
        email_normalized: normalizeEmail('ops@logistique-nord.example'),
        type: 'COMPANY',
        company_name: 'Logistique Nord SA',
        trade_name: 'Nord Fleet',
        registration_number: 'ENT-000003',
        vat_number: 'FR00112233445',
        address: '88 boulevard Industriel, 95000 Cergy',
        billing_address: '88 boulevard Industriel, 95000 Cergy',
        payment_terms_days: 30,
        credit_limit: money(20000),
        workspace_id: workspace.id,
      },
    }),
  ]);

  const allClients = [...individualClients, ...companyClients];

  await prisma.clientContact.createMany({
    data: [
      {
        workspace_id: workspace.id,
        client_id: companyClients[0].id,
        first_name: 'Claire',
        last_name: 'Morel',
        role: 'Gestion flotte',
        email: 'claire.morel@horizon.example',
        phone: '+33 6 11 22 33 44',
        is_primary: true,
        receives_proforma: true,
        receives_invoice: true,
      },
      {
        workspace_id: workspace.id,
        client_id: companyClients[0].id,
        first_name: 'Marc',
        last_name: 'Simon',
        role: 'Atelier',
        email: 'marc.simon@horizon.example',
        phone: '+33 6 55 44 33 22',
        is_primary: false,
        receives_proforma: false,
        receives_invoice: true,
      },
      {
        workspace_id: workspace.id,
        client_id: companyClients[1].id,
        first_name: 'Fatou',
        last_name: 'Kane',
        role: 'Direction',
        email: 'fatou.kane@boulangerie.example',
        phone: '+33 6 21 21 21 21',
        is_primary: true,
        receives_proforma: true,
        receives_invoice: true,
      },
      {
        workspace_id: workspace.id,
        client_id: companyClients[1].id,
        first_name: 'Olivier',
        last_name: 'Petit',
        role: 'Exploitation',
        email: 'olivier.petit@boulangerie.example',
        phone: '+33 6 31 31 31 31',
        is_primary: false,
        receives_proforma: false,
        receives_invoice: true,
      },
      {
        workspace_id: workspace.id,
        client_id: companyClients[2].id,
        first_name: 'Said',
        last_name: 'Bensalem',
        role: 'Fleet manager',
        email: 'said.bensalem@logistique-nord.example',
        phone: '+33 6 41 41 41 41',
        is_primary: true,
        receives_proforma: true,
        receives_invoice: true,
      },
      {
        workspace_id: workspace.id,
        client_id: individualClients[0].id,
        first_name: 'Alice',
        last_name: 'Martin',
        role: 'Propriétaire',
        email: 'alice@example.com',
        phone: '+33 6 10 20 30 40',
        is_primary: true,
        receives_proforma: true,
        receives_invoice: false,
      },
    ],
  });

  const vehicleSpecs = [
    { client: individualClients[0], registration: 'AA-123-AA', brand: 'Renault', model: 'Clio V', status: 'DISPONIBLE', fleetNumber: 'FL-0001', year: 2022, mileage: 21000, driver: 'Alice Martin', service: 'Particulier' },
    { client: individualClients[1], registration: 'BB-456-BB', brand: 'Peugeot', model: '3008', status: 'EN_REPARATION', fleetNumber: 'FL-0002', year: 2021, mileage: 48000, driver: 'Karim Benali', service: 'Particulier' },
    { client: individualClients[2], registration: 'CC-789-CC', brand: 'Ford', model: 'Transit', status: 'EN_ATTENTE_PIECES', fleetNumber: 'FL-0003', year: 2020, mileage: 86000, driver: 'Jean-Luc Ohin', service: 'Particulier' },
    { client: individualClients[3], registration: 'DD-111-DD', brand: 'Mercedes-Benz', model: 'Sprinter', status: 'HORS_SERVICE', fleetNumber: 'FL-0004', year: 2019, mileage: 128000, driver: 'Nadia Diallo', service: 'Particulier' },
    { client: companyClients[0], registration: 'EH-101-EH', brand: 'Renault', model: 'Master', status: 'DISPONIBLE', fleetNumber: 'HZN-001', year: 2023, mileage: 32000, driver: 'Jean Dupont', service: 'Distribution' },
    { client: companyClients[0], registration: 'EH-102-EH', brand: 'Ford', model: 'Custom', status: 'EN_REPARATION', fleetNumber: 'HZN-002', year: 2022, mileage: 41000, driver: 'Laura Petit', service: 'Livraison' },
    { client: companyClients[1], registration: 'BC-201-BC', brand: 'Citroën', model: 'Berlingo', status: 'DISPONIBLE', fleetNumber: 'BDC-001', year: 2021, mileage: 28000, driver: 'Rachid El Fassi', service: 'Boulangerie' },
    { client: companyClients[1], registration: 'BC-202-BC', brand: 'Volkswagen', model: 'Caddy', status: 'EN_ATTENTE_PIECES', fleetNumber: 'BDC-002', year: 2020, mileage: 53000, driver: 'Sandra Lopez', service: 'Livraison' },
    { client: companyClients[1], registration: 'BC-203-BC', brand: 'Toyota', model: 'Yaris', status: 'VENDU', fleetNumber: 'BDC-003', year: 2018, mileage: 67000, driver: 'N/A', service: 'Véhicule de courtoisie' },
    { client: companyClients[2], registration: 'LN-301-LN', brand: 'Peugeot', model: 'Boxer', status: 'DISPONIBLE', fleetNumber: 'LND-001', year: 2024, mileage: 14000, driver: 'Yanis Ait', service: 'Magasin' },
    { client: companyClients[2], registration: 'LN-302-LN', brand: 'Mercedes-Benz', model: 'Vito', status: 'EN_REPARATION', fleetNumber: 'LND-002', year: 2021, mileage: 73000, driver: 'Mamadou Diallo', service: 'Logistique' },
    { client: companyClients[2], registration: 'LN-303-LN', brand: 'Iveco', model: 'Daily', status: 'EN_ATTENTE_PIECES', fleetNumber: 'LND-003', year: 2019, mileage: 91000, driver: 'Sofia Benali', service: 'Transport' },
  ] as const;

  const vehicles = [];
  for (const spec of vehicleSpecs) {
    const vehicle = await prisma.vehicle.create({
      data: {
        registration: spec.registration,
        registration_normalized: normalizeRegistration(spec.registration),
        brand: spec.brand,
        model: spec.model,
        status: spec.status,
        fleet_number: spec.fleetNumber,
        year: spec.year,
        mileage: spec.mileage,
        usual_driver: spec.driver,
        service_name: spec.service,
        workspace_id: workspace.id,
        client_id: spec.client.id,
      },
    });
    vehicles.push(vehicle);
  }

  const timeSlotSpecs = Array.from({ length: 14 }).flatMap((_, index) => {
    const dayOffset = Math.floor(index / 2);
    const firstHour = index % 2 === 0 ? 8 : 13;
    return [
      {
        start: dateIn(dayOffset, firstHour),
        end: dateIn(dayOffset, firstHour + 1),
        status: index === 3 ? 'CANCELLED' : index === 5 ? 'CLOSED' : 'OPEN',
        occupancy: index === 3 ? 0 : 1,
      },
    ];
  });

  const slots = [];
  for (const spec of timeSlotSpecs) {
    const slot = await prisma.timeSlot.create({
      data: {
        start: spec.start,
        end: spec.end,
        status: spec.status,
        occupancy: spec.occupancy,
        workspace_id: workspace.id,
      },
    });
    slots.push(slot);
  }

  const appointmentSpecs = [
    { client: allClients[0], vehicle: vehicles[0], slot: slots[0], status: 'PENDING', day: 0 },
    { client: allClients[1], vehicle: vehicles[1], slot: slots[1], status: 'CONFIRMED', day: 0 },
    { client: allClients[2], vehicle: vehicles[2], slot: slots[2], status: 'IN_PROGRESS', day: 1 },
    { client: allClients[3], vehicle: vehicles[3], slot: slots[3], status: 'COMPLETED', day: 1 },
    { client: allClients[4], vehicle: vehicles[4], slot: slots[4], status: 'CANCELLED', day: 2 },
    { client: allClients[4], vehicle: vehicles[5], slot: slots[5], status: 'CONFIRMED', day: 2 },
    { client: allClients[5], vehicle: vehicles[6], slot: slots[6], status: 'PENDING', day: 3 },
    { client: allClients[5], vehicle: vehicles[7], slot: slots[7], status: 'CONFIRMED', day: 3 },
    { client: allClients[5], vehicle: vehicles[8], slot: slots[8], status: 'COMPLETED', day: 4 },
    { client: allClients[6], vehicle: vehicles[9], slot: slots[9], status: 'PENDING', day: 4 },
    { client: allClients[6], vehicle: vehicles[10], slot: slots[10], status: 'CONFIRMED', day: 5 },
    { client: allClients[6], vehicle: vehicles[11], slot: slots[11], status: 'IN_PROGRESS', day: 5 },
  ] as const;

  const appointments = [];
  for (const spec of appointmentSpecs) {
    const appointment = await prisma.appointment.create({
      data: {
        date: dateIn(spec.day, spec.slot.start.getHours()),
        status: spec.status,
        workspace_id: workspace.id,
        client_id: spec.client.id,
        vehicle_id: spec.vehicle.id,
        time_slot_id: spec.slot.id,
        user_id: mechanic.id,
        created_by: reception.id,
      },
    });
    appointments.push(appointment);
  }

  const caseSpecs: FlowScenario[] = [
    {
      appointment: appointments[0],
      client: allClients[0],
      vehicle: vehicles[0],
      status: 'RECEIVED',
      title: 'Diagnostic sans pièce',
      description: 'Cas test pour vérifier le blocage de génération de proforma quand aucun article d’intervention n’existe.',
      interventions: [
        {
          description: 'Contrôle initial',
          status: 'DIAGNOSIS',
          parts: [],
        },
      ],
      proforma: null,
    },
    {
      appointment: appointments[1],
      client: allClients[1],
      vehicle: vehicles[1],
      status: 'DIAGNOSIS',
      title: 'Freinage avant',
      description: 'Plaquettes et disques à contrôler.',
      interventions: [
        {
          description: 'Remplacement plaquettes',
          status: 'IN_PROGRESS',
          parts: [
            { itemIndex: 1, quantity: 1, unitPrice: 69, label: 'Plaquettes de frein avant' },
            { itemIndex: 0, quantity: 1, unitPrice: 14.9, label: 'Filtre à huile' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0001',
        status: 'DRAFT',
      },
    },
    {
      appointment: appointments[2],
      client: allClients[2],
      vehicle: vehicles[2],
      status: 'WAITING_PARTS',
      title: 'Embrayage utilitaire',
      description: 'Kit embrayage en attente de réception.',
      interventions: [
        {
          description: 'Démontage et diagnostic embrayage',
          status: 'PENDING',
          parts: [
            { itemIndex: 3, quantity: 1, unitPrice: 149, label: 'Batterie 70 Ah' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0002',
        status: 'REJECTED',
      },
    },
    {
      appointment: appointments[3],
      client: allClients[3],
      vehicle: vehicles[3],
      status: 'IN_PROGRESS',
      title: 'Voyant moteur',
      description: 'Diagnostic électronique et remplacement d’un capteur.',
      interventions: [
        {
          description: 'Lecture des défauts moteur',
          status: 'DIAGNOSIS',
          parts: [
            { itemIndex: 2, quantity: 5, unitPrice: 14.5, label: 'Huile moteur 5W30' },
          ],
        },
        {
          description: 'Remplacement sonde',
          status: 'IN_PROGRESS',
          parts: [
            { itemIndex: 4, quantity: 1, unitPrice: 39, label: 'Sonde température' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0003',
        status: 'ACCEPTED',
      },
      invoice: {
        reference: 'FAC-2026-0001',
        status: 'UNPAID',
      },
    },
    {
      appointment: appointments[4],
      client: allClients[4],
      vehicle: vehicles[4],
      status: 'COMPLETED',
      title: 'Révision utilitaire',
      description: 'Révision complète avec remise à niveau.',
      interventions: [
        {
          description: 'Révision annuelle',
          status: 'COMPLETED',
          parts: [
            { itemIndex: 0, quantity: 1, unitPrice: 14.9, label: 'Filtre à huile' },
            { itemIndex: 5, quantity: 2, unitPrice: 18, label: 'Balai d’essuie-glace' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0004',
        status: 'ACCEPTED',
      },
      invoice: {
        reference: 'FAC-2026-0002',
        status: 'PAID',
      },
      paid: true,
    },
    {
      appointment: appointments[5],
      client: allClients[4],
      vehicle: vehicles[5],
      status: 'INVOICED',
      title: 'Freinage flotte',
      description: 'Travaux terminés, facturation à relancer.',
      interventions: [
        {
          description: 'Remplacement plaquettes et contrôle disque',
          status: 'COMPLETED',
          parts: [
            { itemIndex: 1, quantity: 2, unitPrice: 69, label: 'Plaquettes de frein' },
            { itemIndex: 6, quantity: 1, unitPrice: 22, label: 'Capteur ABS' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0005',
        status: 'ACCEPTED',
      },
      invoice: {
        reference: 'FAC-2026-0003',
        status: 'OVERDUE',
      },
    },
    {
      appointment: appointments[6],
      client: allClients[5],
      vehicle: vehicles[6],
      status: 'RECEIVED',
      title: 'Véhicule de boulangerie',
      description: 'Contrôle des niveaux et des pneus.',
      interventions: [
        {
          description: 'Contrôle sécurité',
          status: 'PENDING',
          parts: [
            { itemIndex: 7, quantity: 1, unitPrice: 95, label: 'Kit entretien' },
          ],
        },
      ],
      proforma: null,
    },
    {
      appointment: appointments[7],
      client: allClients[5],
      vehicle: vehicles[7],
      status: 'DIAGNOSIS',
      title: 'Gestion de flotte',
      description: 'Véhicule en diagnostic avant décision client.',
      interventions: [
        {
          description: 'Diagnostic électronique',
          status: 'DIAGNOSIS',
          parts: [
            { itemIndex: 8, quantity: 1, unitPrice: 12.5, label: 'Lampe diagnostic' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0006',
        status: 'DRAFT',
      },
    },
    {
      appointment: appointments[8],
      client: allClients[5],
      vehicle: vehicles[8],
      status: 'WAITING_PARTS',
      title: 'Courroie secondaire',
      description: 'Pièces commandées, intervention en attente.',
      interventions: [
        {
          description: 'Dépose périphériques',
          status: 'IN_PROGRESS',
          parts: [
            { itemIndex: 9, quantity: 1, unitPrice: 145, label: 'Kit courroie' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0007',
        status: 'REJECTED',
      },
    },
    {
      appointment: appointments[9],
      client: allClients[6],
      vehicle: vehicles[9],
      status: 'RECEIVED',
      title: 'Transport palettes',
      description: 'Contrôle avant départ.',
      interventions: [
        {
          description: 'Contrôle initial',
          status: 'PENDING',
          parts: [],
        },
      ],
      proforma: null,
    },
    {
      appointment: appointments[10],
      client: allClients[6],
      vehicle: vehicles[10],
      status: 'IN_PROGRESS',
      title: 'Entretien logistique',
      description: 'Travaux en cours sur la flotte.',
      interventions: [
        {
          description: 'Changement filtres',
          status: 'IN_PROGRESS',
          parts: [
            { itemIndex: 10, quantity: 2, unitPrice: 29, label: 'Filtre habitacle' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0008',
        status: 'ACCEPTED',
      },
      invoice: {
        reference: 'FAC-2026-0004',
        status: 'UNPAID',
      },
    },
    {
      appointment: appointments[11],
      client: allClients[6],
      vehicle: vehicles[11],
      status: 'COMPLETED',
      title: 'Véhicule utilitaire',
      description: 'Réparation terminée, facture soldée.',
      interventions: [
        {
          description: 'Réparation complète',
          status: 'COMPLETED',
          parts: [
            { itemIndex: 11, quantity: 1, unitPrice: 149, label: 'Joint de culasse' },
            { itemIndex: 2, quantity: 6, unitPrice: 14.5, label: 'Huile moteur' },
          ],
        },
      ],
      proforma: {
        reference: 'DEV-2026-0009',
        status: 'ACCEPTED',
      },
      invoice: {
        reference: 'FAC-2026-0005',
        status: 'PAID',
      },
      paid: true,
    },
  ];

  const stockCategories = await Promise.all([
    prisma.stockCategory.create({ data: { name: 'Filtres', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Freinage', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Lubrifiants', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Électricité', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Moteur', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Carrosserie', workspace_id: workspace.id } }),
  ]);

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: { name: 'Auto Pièces Distribution', email: 'commandes@autopieces.example', phone: '+33 1 80 10 20 30', workspace_id: workspace.id },
    }),
    prisma.supplier.create({
      data: { name: 'Lubrifiants Pro', email: 'ventes@lubrifiants.example', phone: '+33 4 70 20 30 40', workspace_id: workspace.id },
    }),
    prisma.supplier.create({
      data: { name: 'Electro Garage', email: 'contact@electrogarage.example', phone: '+33 3 10 11 12 13', workspace_id: workspace.id },
    }),
  ]);

  const stockItemSpecs = [
    { name: 'Filtre à huile', reference: 'FO-001', category: stockCategories[0], supplier: suppliers[0], priceBuy: 6.5, priceSell: 14.9, quantity: 24, min: 10, unit: 'pièce' },
    { name: 'Filtre à air', reference: 'FA-002', category: stockCategories[0], supplier: suppliers[0], priceBuy: 8.3, priceSell: 18.9, quantity: 16, min: 8, unit: 'pièce' },
    { name: 'Huile moteur 5W30', reference: 'HUI-5W30', category: stockCategories[2], supplier: suppliers[1], priceBuy: 7.2, priceSell: 14.5, quantity: 40, min: 20, unit: 'litre' },
    { name: 'Huile moteur 5W40', reference: 'HUI-5W40', category: stockCategories[2], supplier: suppliers[1], priceBuy: 7.9, priceSell: 15.9, quantity: 35, min: 20, unit: 'litre' },
    { name: 'Plaquettes de frein', reference: 'PF-AV-210', category: stockCategories[1], supplier: suppliers[0], priceBuy: 32, priceSell: 69, quantity: 12, min: 5, unit: 'jeu' },
    { name: 'Disques avant', reference: 'DIS-AV-220', category: stockCategories[1], supplier: suppliers[0], priceBuy: 55, priceSell: 119, quantity: 8, min: 4, unit: 'jeu' },
    { name: 'Capteur ABS', reference: 'ABS-900', category: stockCategories[3], supplier: suppliers[2], priceBuy: 26, priceSell: 72, quantity: 14, min: 6, unit: 'pièce' },
    { name: 'Sonde de température', reference: 'SON-120', category: stockCategories[4], supplier: suppliers[2], priceBuy: 20, priceSell: 59, quantity: 20, min: 8, unit: 'pièce' },
    { name: 'Joint de culasse', reference: 'JDC-001', category: stockCategories[4], supplier: suppliers[2], priceBuy: 48, priceSell: 149, quantity: 6, min: 2, unit: 'pièce' },
    { name: 'Kit embrayage', reference: 'EMB-300', category: stockCategories[4], supplier: suppliers[0], priceBuy: 120, priceSell: 289, quantity: 5, min: 2, unit: 'kit' },
    { name: 'Filtre habitacle', reference: 'FHA-050', category: stockCategories[0], supplier: suppliers[0], priceBuy: 9, priceSell: 29, quantity: 18, min: 8, unit: 'pièce' },
    { name: 'Kit courroie', reference: 'KCO-200', category: stockCategories[4], supplier: suppliers[1], priceBuy: 60, priceSell: 145, quantity: 9, min: 3, unit: 'kit' },
    { name: 'Pare-chocs avant', reference: 'CAR-001', category: stockCategories[5], supplier: suppliers[0], priceBuy: 80, priceSell: 199, quantity: 3, min: 1, unit: 'pièce' },
    { name: 'Phare avant', reference: 'PHA-001', category: stockCategories[5], supplier: suppliers[2], priceBuy: 45, priceSell: 109, quantity: 10, min: 4, unit: 'pièce' },
  ] as const;

  const stockItems = [];
  for (const spec of stockItemSpecs) {
    const item = await prisma.stockItem.create({
      data: {
        name: spec.name,
        reference: spec.reference,
        category_id: spec.category.id,
        supplier_id: spec.supplier.id,
        price_buy: spec.priceBuy,
        price_sell: spec.priceSell,
        quantity: spec.quantity,
        min_stock: spec.min,
        unit: spec.unit,
        workspace_id: workspace.id,
      },
    });
    stockItems.push(item);
  }

  const interventions = [];
  const interventionParts: Array<{ id: string; itemId: string; quantity: number; priceSnapshot: Prisma.Decimal }> = [];

  for (const [caseIndex, scenario] of caseSpecs.entries()) {
    const caseRef = `DOS-${new Date().getFullYear()}-${String(caseIndex + 1).padStart(4, '0')}`;
    const repairCase = await prisma.case.create({
      data: {
        reference: caseRef,
        workspace_id: workspace.id,
        customer_id: scenario.client.id,
        vehicle_id: scenario.vehicle.id,
        appointment_id: scenario.appointment.id,
        status: scenario.status,
        title: scenario.title,
        description: scenario.description,
      },
    });

    for (const [interventionIndex, interventionSpec] of scenario.interventions.entries()) {
      const intervention = await prisma.intervention.create({
        data: {
          description: interventionSpec.description,
          status: interventionSpec.status,
          priority: interventionIndex === 0 ? 'NORMAL' : 'HIGH',
          planned_minutes: interventionSpec.parts.length ? 90 + interventionIndex * 30 : 30,
          actual_minutes: interventionSpec.parts.length ? 70 + interventionIndex * 25 : 15,
          hourly_rate: money(72),
          quality_control_status: interventionSpec.parts.length ? 'PENDING' : 'NOT_REQUIRED',
          workspace_id: workspace.id,
          case_id: repairCase.id,
          mechanic_id: mechanic.id,
        },
      });

      interventions.push(intervention);

      for (const [partIndex, partSpec] of interventionSpec.parts.entries()) {
        const item = stockItems[partSpec.itemIndex];
        const part = await prisma.interventionPart.create({
          data: {
            intervention_id: intervention.id,
            item_id: item.id,
            quantity: partSpec.quantity,
            price_snapshot: money(partSpec.unitPrice),
          },
        });
        interventionParts.push({
          id: part.id,
          itemId: item.id,
          quantity: partSpec.quantity,
          priceSnapshot: money(partSpec.unitPrice),
        });

        await prisma.stockMovement.create({
          data: {
            type: 'OUT_WORKSHOP',
            quantity: -partSpec.quantity,
            item_id: item.id,
            workspace_id: workspace.id,
            created_by: mechanic.id,
            intervention_part_id: part.id,
          },
        });
      }
    }

    const proformaScenario = scenario.proforma;
    if (proformaScenario) {
      const interventionRows = await prisma.interventionPart.findMany({
        where: { intervention: { case_id: repairCase.id } },
        include: { item: true, intervention: true },
      });

      const partLines = interventionRows.map((part, index) => ({
        type: 'PART',
        label: part.item.name,
        description: `Article ${index + 1}`,
        quantity: moneyToNumber(part.quantity),
        unit_price: moneyToNumber(part.price_snapshot),
        vat_rate: money(20),
        discount: money(0),
        total: gross(moneyToNumber(part.quantity) * moneyToNumber(part.price_snapshot)),
      }));

      const laborBase = Math.max(1, interventionRows.length) * 1.5;
      const laborLines = [
        {
          type: 'LABOR',
          label: 'Main-d’œuvre atelier',
          description: 'Temps de diagnostic et de réparation',
          quantity: 1,
          unit_price: laborBase * 45,
          vat_rate: money(20),
          discount: money(0),
          total: gross(laborBase * 45),
        },
      ];

      const total = [...partLines, ...laborLines].reduce((sum, line) => sum + Number(line.total), 0);

      const proforma = await prisma.proforma.create({
        data: {
          reference: proformaScenario.reference,
          total: money(total),
          status: proformaScenario.status,
          workspace_id: workspace.id,
          appointment_id: scenario.appointment.id,
          case_id: repairCase.id,
          customer_name_snapshot: scenario.client.name,
          customer_address_snapshot: scenario.client.address ?? null,
          customer_billing_address_snapshot: scenario.client.billing_address ?? scenario.client.address ?? null,
          customer_registration_number_snapshot: scenario.client.registration_number ?? null,
          customer_vat_number_snapshot: scenario.client.vat_number ?? null,
          customer_email_snapshot: scenario.client.email,
          customer_phone_snapshot: scenario.client.phone,
          lines: {
            create: [...partLines, ...laborLines],
          },
        },
      });

      const invoiceScenario = scenario.invoice;
      if (invoiceScenario) {
        const invoice = await prisma.invoice.create({
          data: {
            reference: invoiceScenario.reference,
            total: money(total),
            status: invoiceScenario.status,
            type: 'INVOICE',
            workspace_id: workspace.id,
            proforma_id: proforma.id,
            appointment_id: scenario.appointment.id,
            user_id: accountant.id,
            client_id: scenario.client.id,
            created_by: accountant.id,
            customer_name_snapshot: scenario.client.name,
            customer_address_snapshot: scenario.client.address ?? null,
            customer_billing_address_snapshot: scenario.client.billing_address ?? scenario.client.address ?? null,
            customer_registration_number_snapshot: scenario.client.registration_number ?? null,
            customer_vat_number_snapshot: scenario.client.vat_number ?? null,
            customer_email_snapshot: scenario.client.email,
            customer_phone_snapshot: scenario.client.phone,
            lines: {
              create: [...partLines, ...laborLines],
            },
          },
        });

        if (invoiceScenario.status === 'PAID') {
          const register = await prisma.cashRegister.create({
            data: {
              status: 'OPEN',
              opening_amount: money(500),
              workspace_id: workspace.id,
              opened_by: admin.id,
              opening_notes: 'Ouverture de caisse pour seed de démonstration.',
            },
          });

          const paymentOne = await prisma.payment.create({
            data: {
              amount: money(total),
              method: 'CASH',
              status: 'COMPLETED',
              workspace_id: workspace.id,
              invoice_id: invoice.id,
              client_id: scenario.client.id,
              user_id: accountant.id,
              cash_register_id: register.id,
              reference: `PAY-${invoiceScenario.reference}`,
              notes: 'Règlement seed',
            },
          });

          await prisma.cashMovement.create({
            data: {
              type: 'INCOME',
              amount: money(total),
              method: 'CASH',
              workspace_id: workspace.id,
              cash_register_id: register.id,
              payment_id: paymentOne.id,
              user_id: accountant.id,
              reference: paymentOne.reference ?? invoice.reference,
              notes: 'Encaissement facture payée',
            },
          });
        }

        if (invoiceScenario.status === 'UNPAID' || invoiceScenario.status === 'OVERDUE') {
          await prisma.paymentSchedule.createMany({
            data: [
              {
                invoice_id: invoice.id,
                workspace_id: workspace.id,
                amount: money(Math.round((total / 2) * 100) / 100),
                due_date: dateIn(-10),
                status: 'OVERDUE',
              },
              {
                invoice_id: invoice.id,
                workspace_id: workspace.id,
                amount: money(Math.round((total / 2) * 100) / 100),
                due_date: dateIn(15),
                status: 'PENDING',
              },
            ],
          });
        }
      }
    }
  }

  const purchaseOrders = [
    {
      reference: 'CMD-DEMO-001',
      status: 'DRAFT',
      supplier: suppliers[0],
      items: [
        { item: stockItems[4], quantity: 10, received: 0 },
        { item: stockItems[5], quantity: 4, received: 0 },
      ],
    },
    {
      reference: 'CMD-DEMO-002',
      status: 'SENT',
      supplier: suppliers[1],
      items: [
        { item: stockItems[2], quantity: 20, received: 0 },
        { item: stockItems[3], quantity: 10, received: 0 },
      ],
    },
    {
      reference: 'CMD-DEMO-003',
      status: 'PARTIALLY_RECEIVED',
      supplier: suppliers[0],
      items: [
        { item: stockItems[0], quantity: 12, received: 6 },
        { item: stockItems[9], quantity: 5, received: 2 },
      ],
    },
    {
      reference: 'CMD-DEMO-004',
      status: 'RECEIVED',
      supplier: suppliers[2],
      items: [
        { item: stockItems[6], quantity: 8, received: 8 },
        { item: stockItems[7], quantity: 6, received: 6 },
      ],
    },
    {
      reference: 'CMD-DEMO-005',
      status: 'CANCELLED',
      supplier: suppliers[1],
      items: [
        { item: stockItems[12], quantity: 2, received: 0 },
        { item: stockItems[13], quantity: 4, received: 0 },
      ],
    },
  ] as const;

  for (const orderSpec of purchaseOrders) {
    const order = await prisma.purchaseOrder.create({
      data: {
        reference: orderSpec.reference,
        status: orderSpec.status,
        supplier_id: orderSpec.supplier.id,
        workspace_id: workspace.id,
        created_by: admin.id,
        items: {
          create: orderSpec.items.map((itemSpec) => ({
            item_id: itemSpec.item.id,
            quantity: itemSpec.quantity,
            received_quantity: itemSpec.received,
            price_buy: moneyToNumber(itemSpec.item.price_buy),
          })),
        },
      },
    });

    if (orderSpec.status === 'RECEIVED' || orderSpec.status === 'PARTIALLY_RECEIVED') {
      const reception = await prisma.stockReception.create({
        data: {
          purchase_order_id: order.id,
          workspace_id: workspace.id,
        },
      });

      const receipt = await prisma.purchaseReceipt.create({
        data: {
          reference: `REC-${orderSpec.reference.slice(-3)}`,
          purchase_order_id: order.id,
          workspace_id: workspace.id,
        },
      });

      await prisma.stockMovement.createMany({
        data: orderSpec.items.map((itemSpec, idx) => ({
          type: 'IN_PURCHASE',
          quantity: orderSpec.status === 'RECEIVED' ? itemSpec.quantity : itemSpec.received || 1,
          item_id: itemSpec.item.id,
          workspace_id: workspace.id,
          created_by: admin.id,
          purchase_receipt_id: receipt.id,
        })),
      });
    }
  }

  const inventories = [
    {
      reference: 'INV-DEMO-001',
      items: [
        { item: stockItems[0], expected: 24, counted: 24 },
        { item: stockItems[4], expected: 12, counted: 11 },
        { item: stockItems[6], expected: 14, counted: 14 },
      ],
    },
    {
      reference: 'INV-DEMO-002',
      items: [
        { item: stockItems[2], expected: 40, counted: 39 },
        { item: stockItems[9], expected: 5, counted: 5 },
        { item: stockItems[11], expected: 9, counted: 8 },
      ],
    },
    {
      reference: 'INV-DEMO-003',
      items: [
        { item: stockItems[12], expected: 3, counted: 3 },
        { item: stockItems[13], expected: 10, counted: 10 },
      ],
    },
  ] as const;

  for (const inventorySpec of inventories) {
    const inventory = await prisma.inventory.create({
      data: {
        reference: inventorySpec.reference,
        workspace_id: workspace.id,
      },
    });

    await prisma.inventoryItem.createMany({
      data: inventorySpec.items.map((item) => ({
        inventory_id: inventory.id,
        item_id: item.item.id,
        expected: item.expected,
        counted: item.counted,
      })),
    });
  }

  await prisma.numberSequence.createMany({
    data: [
      { workspace_id: workspace.id, prefix: 'FAC', year: new Date().getFullYear(), last_number: 5 },
      { workspace_id: workspace.id, prefix: 'DEV', year: new Date().getFullYear(), last_number: 9 },
      { workspace_id: workspace.id, prefix: 'CMD', year: new Date().getFullYear(), last_number: 5 },
      { workspace_id: workspace.id, prefix: 'DOS', year: new Date().getFullYear(), last_number: 12 },
      { workspace_id: workspace.id, prefix: 'REC', year: new Date().getFullYear(), last_number: 5 },
    ],
  });

  console.log('✅ Seed garage scénario terminé');
  console.log('Compte admin: admin.flow@forteresse.local');
  console.log('Mot de passe de test: ' + ADMIN_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });