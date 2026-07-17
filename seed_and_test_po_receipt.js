const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
(async () => {
  const p = new PrismaClient();
  try {
 const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || process.env.WORKSPACE_ID || null;
 // create supplier
 const supplier = await p.supplier.create({ data: { workspaceId: workspaceId || 'dev-ws', name: "Seed Supplier" }});
 // create product
 const product = await p.product.create({ data: {
   workspaceId: workspaceId || 'dev-ws',
   supplier_id: supplier.id,
   reference: 'SEED-PRD-' + randomUUID().slice(0,6),
   name: 'Seed Product',
   purchase_price: 10,
   selling_price: 20
 }});
 // ensure inventory record exists
 await p.inventory.upsert({
   where: { product_id: product.id },
   create: { product_id: product.id, quantity: 0 },
   update: {}
 });
 console.log('Seeded supplier/product:', supplier.id, product.id);

 // create PO with one line
 const po = await p.purchaseOrder.create({
   data: {
 workspaceId: workspaceId || 'dev-ws',
 supplierId: supplier.id,
 reference: 'PO-' + randomUUID().slice(0,6),
 status: 'confirmed',
 totalAmount: 100,
 lines: { create: [{ productId: product.id, quantity: 10, unit_price: 10 }] }
   },
   include: { lines: true }
 });
 console.log('Created PO', po.id, 'lines', po.lines.length);

 // create a PurchaseReceipt linked to PO, then complete transactionally
 const receiptRef = 'REC-' + randomUUID().slice(0,6);
 await p.$transaction(async (tx) => {
   const receipt = await tx.purchaseReceipt.create({
 data: {
   purchaseOrderId: po.id,
   workspaceId: workspaceId || 'dev-ws',
   reference: receiptRef,
   status: 'completed'
 }
   });
   const poLine = po.lines[0];
   const qty = poLine.quantity;
   await tx.purchaseReceiptLine.create({
 data: {
   purchaseReceiptId: receipt.id,
   productId: product.id,
   quantity: qty,
   unit_price: poLine.unit_price
 }
   });
   // update inventory (global)
   await tx.inventory.upsert({
 where: { product_id: product.id },
 create: { product_id: product.id, quantity: qty },
 update: { quantity: { increment: qty } }
   });
   // create stock movement
   await tx.stockMovement.create({
 data: {
   workspaceId: workspaceId || 'dev-ws',
   product_id: product.id,
   type: 'purchase_in',
   quantity: qty,
   reason: 'Receipt complete',
   reference: receipt.id
 }
   });
   // update PO line receivedQty
   await tx.purchaseOrderLine.update({
 where: { id: poLine.id },
 data: { receivedQty: { increment: qty } }
   });
 });
 console.log('Receipt created and inventory updated for product', product.id);

 // final checks
 const inv = await p.inventory.findUnique({ where: { product_id: product.id }});
 const sm = await p.stockMovement.findMany({ where: { product_id: product.id }});
 const pol = await p.purchaseOrderLine.findMany({ where: { productId: product.id }});
 console.log('Inventory:', inv ? inv.quantity : null);
 console.log('StockMovements count for product:', sm.length);
 console.log('PO lines for product:', pol.map(x=>({id:x.id,receivedQty:x.receivedQty})));

  } catch (e) {
    console.error('FATAL', e.message || e);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
