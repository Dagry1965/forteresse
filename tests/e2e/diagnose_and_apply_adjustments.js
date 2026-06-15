const { PrismaClient } = require('@prisma/client');
(async () => {
  const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";
  const p = new PrismaClient();
  try {
 const products = await p.product.findMany({ select: { id: true, reference: true, name: true }});
 const results = [];
 for (const prod of products) {
   const inv = await p.inventory.findUnique({ where: { product_id: prod.id }});
   const invQty = inv ? Number(inv.quantity) : 0;
   const movements = await p.stockMovement.findMany({ where: { product_id: prod.id }});
   const sum = movements.reduce((s, m) => {
 const q = Number(m.quantity || 0);
 if (['purchase_in','transfer_in','adjustment_in'].includes(m.type)) return s + q;
 if (['sale_out','transfer_out','adjustment_out'].includes(m.type)) return s - q;
 return s;
   }, 0);
   const delta = invQty - sum;
   console.log('PRODUCT', prod.id, prod.reference, prod.name, 'inventory=', invQty, 'movementsSum=', sum, 'delta=', delta, 'movementsCount=', movements.length);
   // try to create adjustment but catch errors
   if (delta > 0) {
 try {
   const mv = await p.stockMovement.create({
     data: {
       workspaceId: WORKSPACE_ID,
       product_id: prod.id,
       type: 'adjustment_in',
       quantity: delta,
       reason: 'initial import adjustment (diagnostic)',
       reference: null
     }
   });
   console.log('  -> created movement id=', mv.id);
 } catch (e) {
   console.error('  -> create ERROR for product', prod.id, e.message || e);
 }
   }
   results.push({ productId: prod.id, delta });
 }
 console.log('Done diagnostic.');
  } catch (e) {
 console.error('FATAL', e.message || e);
 process.exit(1);
  } finally {
 await p.$disconnect();
  }
})();
