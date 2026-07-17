const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

(async () => {
  const WORKSPACE_ID = process.env.NEXT_PUBLIC_WORKSPACE_ID || process.env.WORKSPACE_ID || "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";
  const p = new PrismaClient();
  try {
    console.log("E2E START - workspace:", WORKSPACE_ID);

text

Collapse


 Copy

const supplier = await p.supplier.create({ data: { workspaceId: WORKSPACE_ID, name: "E2E Supplier" }});
const product = await p.product.create({
  data: {
    workspaceId: WORKSPACE_ID,
    supplier_id: supplier.id,
    reference: 'E2E-' + randomUUID().slice(0,6),
    name: 'E2E Product',
    purchase_price: 5,
    selling_price: 15
  }
});
await p.inventory.upsert({
  where: { product_id: product.id },
  create: { product_id: product.id, quantity: 0 },
  update: {}
});
console.log("Seeded product:", product.id);

const po = await p.purchaseOrder.create({
  data: {
    workspaceId: WORKSPACE_ID,
    supplierId: supplier.id,
    reference: 'PO-' + randomUUID().slice(0,6),
    status: 'confirmed',
    totalAmount: 5 * 5,
    lines: { create: [{ productId: product.id, quantity: 5, unit_price: 5 }] }
  },
  include: { lines: true }
});
console.log("Created PO:", po.reference, po.id);

await p.$transaction(async (tx) => {
  const receipt = await tx.purchaseReceipt.create({
    data: {
      purchaseOrderId: po.id,
      workspaceId: WORKSPACE_ID,
      reference: 'REC-' + randomUUID().slice(0,6),
      status: 'completed'
    }
  });
  const pol = po.lines[0];
  await tx.purchaseReceiptLine.create({
    data: { purchaseReceiptId: receipt.id, productId: product.id, quantity: pol.quantity, unit_price: pol.unit_price }
  });
  await tx.inventory.upsert({
    where: { product_id: product.id },
    create: { product_id: product.id, quantity: pol.quantity },
    update: { quantity: { increment: pol.quantity } }
  });
  await tx.stockMovement.create({
    data: { workspaceId: WORKSPACE_ID, product_id: product.id, type: 'purchase_in', quantity: pol.quantity, reason: 'E2E receipt' }
  });
  await tx.purchaseOrderLine.update({ where: { id: pol.id }, data: { receivedQty: { increment: pol.quantity } }});
});
console.log("Receipt completed & inventory increased by 5.");

const client = await p.client.create({ data: { workspaceId: WORKSPACE_ID, name: 'E2E Client' }});
const vehicle = await p.vehicle.create({ data: { workspaceId: WORKSPACE_ID, clientId: client.id }});
const appointment = await p.appointment.create({ data: { user_id: 'system', vehicle_id: vehicle.id, scheduled_at: new Date(), status: 'planned', initial_description: 'E2E test' }});
const intervention = await p.intervention.create({ data: { appointment_id: appointment.id, status: 'open' }});
const proforma = await p.proforma.create({
  data: {
    intervention_id: intervention.id,
    status: 'draft',
    total_amount: 3 * 15,
    lines: { create: [{ product_id: product.id, description: product.name, quantity: 3, unit_price: 15 }] }
  },
  include: { lines: true }
});
console.log("Created Proforma:", proforma.id);

await p.inventoryReservation.create({
  data: { workspaceId: WORKSPACE_ID, productId: product.id, quantity: 3, reference: proforma.id }
});
console.log("Reserved 3 units for proforma.");

const invoice = await p.invoice.create({
  data: {
    proforma_id: proforma.id,
    status: 'unpaid',
    due_date: new Date(Date.now() + 7*24*60*60*1000),
    total_paid: 0
  }
});
console.log("Invoice created:", invoice.id);

await p.$transaction(async (tx) => {
  const res = await tx.inventoryReservation.findMany({ where: { productId: product.id, reference: proforma.id }});
  let toConsume = res.reduce((s,r)=>s + Number(r.quantity), 0);
  if (toConsume < 3) throw new Error("Not enough reserved.");
  await tx.stockMovement.create({
    data: { workspaceId: WORKSPACE_ID, product_id: product.id, type: 'sale_out', quantity: 3, reason: 'Invoice billing', reference: invoice.id }
  });
  await tx.inventory.update({ where: { product_id: product.id }, data: { quantity: { decrement: 3 } }});
  await tx.inventoryReservation.deleteMany({ where: { productId: product.id, reference: proforma.id }});
  await tx.payment.create({ data: { invoice_id: invoice.id, amount: 45, method: 'cash' }});
  await tx.invoice.update({ where: { id: invoice.id }, data: { total_paid: { increment: 45 }, status: 'paid' }});
});
console.log("Invoice paid and inventory decremented by 3.");

const inv = await p.inventory.findUnique({ where: { product_id: product.id }});
const movements = await p.stockMovement.findMany({ where: { product_id: product.id }});
const pols = await p.purchaseOrderLine.findMany({ where: { productId: product.id }});
console.log("FINAL INVENTORY:", inv ? inv.quantity : null);
console.log("TOTAL MOVEMENTS for product:", movements.length);
console.log("PO lines:", pols.map(x=>({id:x.id,receivedQty:x.receivedQty})));

console.log("E2E SUCCESS");
  } catch (e) {
    console.error("E2E ERROR:", e);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
