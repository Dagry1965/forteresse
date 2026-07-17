const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
 const products = await p.product.findMany({ select: { id: true, reference: true, name: true } });
 const report = [];
 for (const prod of products) {
   const inv = await p.inventory.findUnique({ where: { product_id: prod.id } });
   const invQty = inv ? Number(inv.quantity) : 0;
   const movements = await p.stockMovement.findMany({ where: { product_id: prod.id } });
   // Assume types: purchase_in, transfer_in => + ; sale_out, transfer_out, adjustment_out => -
   const sum = movements.reduce((s, m) => {
 const q = Number(m.quantity || 0);
 if (['purchase_in','transfer_in'].includes(m.type)) return s + q;
 if (['sale_out','transfer_out','adjustment_out'].includes(m.type)) return s - q;
 return s; // unknown types ignored
   }, 0);
   report.push({ productId: prod.id, reference: prod.reference, name: prod.name, inventory: invQty, movementsSum: sum, delta: invQty - sum });
 }
 console.log(JSON.stringify(report, null, 2));
  } catch (e) {
 console.error('FATAL', e.message || e);
 process.exit(1);
  } finally {
 await p.$disconnect();
  }
})();
