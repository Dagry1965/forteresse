import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

(async () => {
  try {
    console.log('E2E test skeleton start');
    const ws = process.env.NEXT_PUBLIC_WORKSPACE_ID || process.env.WORKSPACE_ID || 'dev-ws';

const supplier = await p.supplier.create({ data: { workspaceId: ws, name: 'CI Supplier' }});
const product = await p.product.create({
  data: {
    workspaceId: ws,
    supplier_id: supplier.id,
    reference: 'CI-PRD',
    name: 'CI Product',
    purchase_price: 1,
    selling_price: 2
  }
});

await p.inventory.upsert({
  where: { product_id: product.id },
  create: { product_id: product.id, quantity: 0 },
  update: {}
});

const po = await p.purchaseOrder.create({
  data: {
    workspaceId: ws,
    supplierId: supplier.id,
    reference: 'CI-PO',
    status: 'confirmed',
    totalAmount: 10,
    lines: { create: [{ productId: product.id, quantity: 5, unit_price: 2 }] }
  },
  include: { lines: true }
});

const receipt = await p.purchaseReceipt.create({
  data: { purchaseOrderId: po.id, workspaceId: ws, reference: 'CI-REC', status: 'pending' }
});

await p.purchaseReceiptLine.create({
  data: { purchaseReceiptId: receipt.id, productId: product.id, quantity: 5, unit_price: 2 }
});

await p.$transaction(async (tx) => {
  await tx.inventory.upsert({
    where: { product_id: product.id },
    create: { product_id: product.id, quantity: 5 },
    update: { quantity: { increment: 5 } }
  });
  await tx.stockMovement.create({
    data: { workspaceId: ws, product_id: product.id, type: 'purchase_in', quantity: 5, reason: 'ci test' }
  });
});

const inv = await p.inventory.findUnique({ where: { product_id: product.id }});
console.log('CI final inventory for product:', inv ? inv.quantity : null);
console.log('E2E test skeleton finished');
process.exit(0);
  } catch (e) {
    console.error('E2E skeleton error', e);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();