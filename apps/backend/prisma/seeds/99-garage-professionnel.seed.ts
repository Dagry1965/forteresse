import { Prisma, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  APPOINTMENT_STATUS,
  CASE_STATUS,
  INTERVENTION_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  PAYMENT_SCHEDULE_STATUS,
  PROFORMA_STATUS,
  PURCHASE_ORDER_STATUS,
  TIME_SLOT_STATUS,
  VEHICLE_STATUS,
} from '../../../../shared/constants/status.constants';

const prisma = new PrismaClient();
const WORKSPACE_ID = 'seed-workspace-1';

function dateIn(days: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function clearWorkspace(): Promise<void> {
  const id = WORKSPACE_ID;
  await prisma.auditLog.deleteMany({ where: { user: { workspace_id: id } } });
  await prisma.refreshToken.deleteMany({ where: { workspace_id: id } });
  await prisma.invoicePayment.deleteMany({ where: { invoice: { workspace_id: id } } });
  await prisma.paymentSchedule.deleteMany({ where: { workspace_id: id } });
  await prisma.payment.deleteMany({ where: { workspace_id: id } });
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

  const password = await argon2.hash('Admin123!', { type: argon2.argon2id });
  const workspace = await prisma.workspace.create({
    data: {
      id: WORKSPACE_ID,
      name: 'Garage Forteresse Démo',
      businessSettings: { create: { openingTime: '08:00', closingTime: '18:00', slotDuration: 30, maxConcurrent: 3, workingDays: '1,2,3,4,5,6' } },
    },
  });

  const admin = await prisma.user.create({ data: { id: 'seed-admin-1', email: 'admin@forteresse.local', name: 'Administrateur Démo', password, workspace_id: workspace.id } });
  const mechanic = await prisma.user.create({ data: { id: 'seed-mechanic-1', email: 'mecanicien@forteresse.local', name: 'Jean Mécano', password, workspace_id: workspace.id } });
  const member = await prisma.user.create({ data: { id: 'seed-member-1', email: 'accueil@forteresse.local', name: 'Sophie Accueil', password, workspace_id: workspace.id } });
  await prisma.workspaceMember.createMany({ data: [
    { workspace_id: workspace.id, user_id: admin.id, role: 'ADMIN' },
    { workspace_id: workspace.id, user_id: mechanic.id, role: 'MECHANIC' },
    { workspace_id: workspace.id, user_id: member.id, role: 'MEMBER' },
  ] });

  const clients = await Promise.all([
    prisma.client.create({ data: { name: 'Alice Martin', phone: '+33 6 10 20 30 40', email: 'alice@example.com', type: 'INDIVIDUAL', workspace_id: workspace.id } }),
    prisma.client.create({ data: { name: 'Karim Benali', phone: '+33 6 22 33 44 55', email: 'karim@example.com', type: 'INDIVIDUAL', workspace_id: workspace.id } }),
    prisma.client.create({ data: { name: 'Transports Horizon SARL', phone: '+33 1 45 20 30 40', email: 'flotte@horizon.example', type: 'COMPANY', workspace_id: workspace.id } }),
    prisma.client.create({ data: { name: 'Boulangerie du Centre', phone: '+33 1 40 50 60 70', email: 'direction@boulangerie.example', type: 'COMPANY', workspace_id: workspace.id } }),
  ]);

  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { registration: 'AA-123-AA', brand: 'Renault', model: 'Clio V', status: 'DISPONIBLE', workspace_id: workspace.id, client_id: clients[0].id } }),
    prisma.vehicle.create({ data: { registration: 'BB-456-BB', brand: 'Peugeot', model: '3008', status: 'EN_REPARATION', workspace_id: workspace.id, client_id: clients[1].id } }),
    prisma.vehicle.create({ data: { registration: 'CC-789-CC', brand: 'Ford', model: 'Transit', status: 'EN_ATTENTE_PIECES', workspace_id: workspace.id, client_id: clients[2].id } }),
    prisma.vehicle.create({ data: { registration: 'DD-111-DD', brand: 'Mercedes', model: 'Sprinter', status: VEHICLE_STATUS.HORS_SERVICE, workspace_id: workspace.id, client_id: clients[2].id } }),
    prisma.vehicle.create({ data: { registration: 'EE-222-EE', brand: 'Toyota', model: 'Yaris', status: VEHICLE_STATUS.VENDU, workspace_id: workspace.id, client_id: clients[3].id } }),
  ]);

  const slots = await Promise.all([
    prisma.timeSlot.create({ data: { start: dateIn(-2, 9), end: dateIn(-2, 10), status: TIME_SLOT_STATUS.CLOSED, occupancy: 1, workspace_id: workspace.id } }),
    prisma.timeSlot.create({ data: { start: dateIn(0, 9), end: dateIn(0, 10), status: TIME_SLOT_STATUS.OPEN, occupancy: 1, workspace_id: workspace.id } }),
    prisma.timeSlot.create({ data: { start: dateIn(1, 10), end: dateIn(1, 11), status: TIME_SLOT_STATUS.OPEN, occupancy: 1, workspace_id: workspace.id } }),
    prisma.timeSlot.create({ data: { start: dateIn(2, 14), end: dateIn(2, 15), status: TIME_SLOT_STATUS.OPEN, occupancy: 1, workspace_id: workspace.id } }),
    prisma.timeSlot.create({ data: { start: dateIn(3, 11), end: dateIn(3, 12), status: TIME_SLOT_STATUS.CANCELLED, occupancy: 0, workspace_id: workspace.id } }),
  ]);

  const appointments = await Promise.all([
    prisma.appointment.create({ data: { date: dateIn(-2, 9), status: APPOINTMENT_STATUS.COMPLETED, workspace_id: workspace.id, client_id: clients[0].id, vehicle_id: vehicles[0].id, time_slot_id: slots[0].id, user_id: mechanic.id, created_by: member.id } }),
    prisma.appointment.create({ data: { date: dateIn(0, 9), status: APPOINTMENT_STATUS.IN_PROGRESS, workspace_id: workspace.id, client_id: clients[1].id, vehicle_id: vehicles[1].id, time_slot_id: slots[1].id, user_id: mechanic.id, created_by: member.id } }),
    prisma.appointment.create({ data: { date: dateIn(1, 10), status: APPOINTMENT_STATUS.CONFIRMED, workspace_id: workspace.id, client_id: clients[2].id, vehicle_id: vehicles[2].id, time_slot_id: slots[2].id, user_id: mechanic.id, created_by: member.id } }),
    prisma.appointment.create({ data: { date: dateIn(2, 14), status: APPOINTMENT_STATUS.PENDING, workspace_id: workspace.id, client_id: clients[2].id, vehicle_id: vehicles[3].id, time_slot_id: slots[3].id, user_id: mechanic.id, created_by: member.id } }),
    prisma.appointment.create({ data: { date: dateIn(3, 11), status: APPOINTMENT_STATUS.CANCELLED, workspace_id: workspace.id, client_id: clients[3].id, vehicle_id: vehicles[4].id, time_slot_id: slots[4].id, user_id: mechanic.id, created_by: member.id } }),
  ]);

  const cases = await Promise.all([
    prisma.case.create({ data: { reference: `DOS-${new Date().getFullYear()}-0001`, workspace_id: workspace.id, customer_id: clients[0].id, vehicle_id: vehicles[0].id, status: CASE_STATUS.COMPLETED, title: 'Révision annuelle', description: 'Vidange, filtres et contrôles.' } }),
    prisma.case.create({ data: { reference: `DOS-${new Date().getFullYear()}-0002`, workspace_id: workspace.id, customer_id: clients[1].id, vehicle_id: vehicles[1].id, status: CASE_STATUS.IN_PROGRESS, title: 'Freinage avant', description: 'Bruits et vibrations.' } }),
    prisma.case.create({ data: { reference: `DOS-${new Date().getFullYear()}-0003`, workspace_id: workspace.id, customer_id: clients[2].id, vehicle_id: vehicles[2].id, status: CASE_STATUS.WAITING_PARTS, title: 'Embrayage utilitaire', description: 'Kit embrayage en attente.' } }),
    prisma.case.create({ data: { reference: `DOS-${new Date().getFullYear()}-0004`, workspace_id: workspace.id, customer_id: clients[2].id, vehicle_id: vehicles[3].id, status: CASE_STATUS.DIAGNOSIS, title: 'Voyant moteur', description: 'Diagnostic électronique.' } }),
  ]);

  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'Auto Pièces Distribution', email: 'commandes@autopieces.example', phone: '+33 1 80 10 20 30', workspace_id: workspace.id } }),
    prisma.supplier.create({ data: { name: 'Lubrifiants Pro', email: 'ventes@lubrifiants.example', phone: '+33 4 70 20 30 40', workspace_id: workspace.id } }),
  ]);
  const categories = await Promise.all([
    prisma.stockCategory.create({ data: { name: 'Filtres', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Freinage', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Lubrifiants', workspace_id: workspace.id } }),
    prisma.stockCategory.create({ data: { name: 'Électricité', workspace_id: workspace.id } }),
  ]);
  const items = await Promise.all([
    prisma.stockItem.create({ data: { name: 'Filtre à huile', reference: 'FO-001', category_id: categories[0].id, supplier_id: suppliers[0].id, price_buy: 6.5, price_sell: 14.9, quantity: 24, min_stock: 10, unit: 'pièce', workspace_id: workspace.id } }),
    prisma.stockItem.create({ data: { name: 'Plaquettes de frein', reference: 'PF-AV-210', category_id: categories[1].id, supplier_id: suppliers[0].id, price_buy: 32, price_sell: 69, quantity: 3, min_stock: 5, unit: 'jeu', workspace_id: workspace.id } }),
    prisma.stockItem.create({ data: { name: 'Huile moteur 5W30', reference: 'HUI-5W30', category_id: categories[2].id, supplier_id: suppliers[1].id, price_buy: 7.2, price_sell: 14.5, quantity: 40, min_stock: 20, unit: 'litre', workspace_id: workspace.id } }),
    prisma.stockItem.create({ data: { name: 'Batterie 70 Ah', reference: 'BAT-70', category_id: categories[3].id, supplier_id: suppliers[0].id, price_buy: 82, price_sell: 149, quantity: 0, min_stock: 2, unit: 'pièce', workspace_id: workspace.id } }),
  ]);

  await prisma.stockMovement.createMany({ data: [
    { type: 'IN_PURCHASE', quantity: 30, item_id: items[0].id, workspace_id: workspace.id, created_by: admin.id },
    { type: 'OUT_WORKSHOP', quantity: -6, item_id: items[0].id, workspace_id: workspace.id, created_by: mechanic.id },
    { type: 'IN_ADJUSTMENT', quantity: 2, item_id: items[2].id, workspace_id: workspace.id, created_by: admin.id },
    { type: 'OUT_ADJUSTMENT', quantity: -1, item_id: items[3].id, workspace_id: workspace.id, created_by: admin.id },
  ] });

  const interventions = await Promise.all([
    prisma.intervention.create({ data: { description: 'Vidange et filtre à huile', status: INTERVENTION_STATUS.COMPLETED, workspace_id: workspace.id, case_id: cases[0].id } }),
    prisma.intervention.create({ data: { description: 'Remplacement des plaquettes', status: INTERVENTION_STATUS.IN_PROGRESS, workspace_id: workspace.id, case_id: cases[1].id } }),
    prisma.intervention.create({ data: { description: 'Remplacement du kit embrayage', status: INTERVENTION_STATUS.PENDING, workspace_id: workspace.id, case_id: cases[2].id } }),
    prisma.intervention.create({ data: { description: 'Lecture des défauts moteur', status: INTERVENTION_STATUS.DIAGNOSIS, workspace_id: workspace.id, case_id: cases[3].id } }),
  ]);
  await prisma.interventionPart.createMany({ data: [
    { intervention_id: interventions[0].id, item_id: items[0].id, quantity: 1, price_snapshot: items[0].price_sell },
    { intervention_id: interventions[0].id, item_id: items[2].id, quantity: 5, price_snapshot: items[2].price_sell },
    { intervention_id: interventions[1].id, item_id: items[1].id, quantity: 1, price_snapshot: items[1].price_sell },
  ] });

  const order = await prisma.purchaseOrder.create({ data: {
    reference: 'CMD-DEMO-001', status: PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED, supplier_id: suppliers[0].id, workspace_id: workspace.id, created_by: admin.id,
    items: { create: [
      { item_id: items[1].id, quantity: 10, received_quantity: 4, price_buy: items[1].price_buy },
      { item_id: items[3].id, quantity: 4, received_quantity: 0, price_buy: items[3].price_buy },
    ] },
  } });
  await prisma.stockReception.create({ data: { purchase_order_id: order.id, workspace_id: workspace.id } });
  await prisma.purchaseReceipt.create({ data: { reference: 'REC-DEMO-001', purchase_order_id: order.id, workspace_id: workspace.id } });

  const inventory = await prisma.inventory.create({ data: { reference: 'INV-DEMO-001', workspace_id: workspace.id } });
  await prisma.inventoryItem.createMany({ data: [
    { inventory_id: inventory.id, item_id: items[0].id, expected: 24, counted: 24 },
    { inventory_id: inventory.id, item_id: items[1].id, expected: 3, counted: 2 },
    { inventory_id: inventory.id, item_id: items[3].id, expected: 0, counted: 0 },
  ] });

  const proforma = await prisma.proforma.create({ data: {
    reference: 'DEV-DEMO-001', total: 241.8, status: PROFORMA_STATUS.ACCEPTED, workspace_id: workspace.id, appointment_id: appointments[0].id, case_id: cases[0].id,
    lines: { create: [
      { type: 'PART', label: 'Filtre à huile', quantity: new Prisma.Decimal(1), unit_price: new Prisma.Decimal(14.9), vat_rate: new Prisma.Decimal(20), discount: new Prisma.Decimal(0), total: new Prisma.Decimal(14.9) },
      { type: 'LABOR', label: 'Main-d’œuvre', quantity: new Prisma.Decimal(3.5), unit_price: new Prisma.Decimal(64.83), vat_rate: new Prisma.Decimal(20), discount: new Prisma.Decimal(0), total: new Prisma.Decimal(226.9) },
    ] },
  } });

  const paidInvoice = await prisma.invoice.create({ data: {
    reference: 'FAC-DEMO-001', total: 241.8, status: INVOICE_STATUS.PAID, type: INVOICE_TYPE.INVOICE, workspace_id: workspace.id, proforma_id: proforma.id,
    appointment_id: appointments[0].id, user_id: admin.id, client_id: clients[0].id, created_by: admin.id,
    lines: { create: [
      { type: 'PART', label: 'Filtre à huile', quantity: new Prisma.Decimal(1), unit_price: new Prisma.Decimal(14.9), vat_rate: new Prisma.Decimal(20), discount: new Prisma.Decimal(0), total: new Prisma.Decimal(14.9) },
      { type: 'LABOR', label: 'Révision complète', quantity: new Prisma.Decimal(3.5), unit_price: new Prisma.Decimal(64.83), vat_rate: new Prisma.Decimal(20), discount: new Prisma.Decimal(0), total: new Prisma.Decimal(226.9) },
    ] },
  } });
  const unpaidInvoice = await prisma.invoice.create({ data: { reference: 'FAC-DEMO-002', total: 328, status: INVOICE_STATUS.UNPAID, type: INVOICE_TYPE.INVOICE, workspace_id: workspace.id, appointment_id: appointments[1].id, user_id: admin.id, client_id: clients[1].id, created_by: admin.id } });
  const overdueInvoice = await prisma.invoice.create({ data: { reference: 'FAC-DEMO-003', total: 980, status: INVOICE_STATUS.OVERDUE, type: INVOICE_TYPE.INVOICE, workspace_id: workspace.id, appointment_id: appointments[2].id, user_id: admin.id, client_id: clients[2].id, created_by: admin.id } });

  await prisma.invoicePayment.createMany({ data: [
    { invoice_id: paidInvoice.id, amount: 141.8, method: 'CARD', user_id: member.id },
    { invoice_id: paidInvoice.id, amount: 100, method: 'CASH', user_id: member.id },
  ] });
  await prisma.payment.create({ data: { amount: 241.8, method: 'MIXED', workspace_id: workspace.id, invoice_id: paidInvoice.id, client_id: clients[0].id, user_id: member.id } });
  await prisma.paymentSchedule.createMany({ data: [
    { invoice_id: overdueInvoice.id, workspace_id: workspace.id, amount: 490, due_date: dateIn(-15), status: 'OVERDUE' },
    { invoice_id: overdueInvoice.id, workspace_id: workspace.id, amount: 490, due_date: dateIn(15), status: PAYMENT_SCHEDULE_STATUS.PENDING },
    { invoice_id: unpaidInvoice.id, workspace_id: workspace.id, amount: 328, due_date: dateIn(7), status: PAYMENT_SCHEDULE_STATUS.PENDING },
  ] });

  await prisma.numberSequence.createMany({ data: [
    { workspace_id: workspace.id, prefix: 'FAC', year: new Date().getFullYear(), last_number: 3 },
    { workspace_id: workspace.id, prefix: 'DEV', year: new Date().getFullYear(), last_number: 1 },
    { workspace_id: workspace.id, prefix: 'CMD', year: new Date().getFullYear(), last_number: 1 },
    { workspace_id: workspace.id, prefix: 'DOS', year: new Date().getFullYear(), last_number: 4 },
  ] });

  console.log('✅ Seed terminé');
  console.log('Compte: admin@forteresse.local');
  console.log('Mot de passe: Admin123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
