const { PrismaClient } = require('@prisma/client');
(async () => {
  try {
 const p = new PrismaClient();
 const names = ['Product','Inventory','PurchaseOrder','PurchaseReceipt','StockMovement','InventoryReservation'];
 for (const n of names) {
   try {
 const sql = 'SELECT COUNT(*) as c FROM "' + n + '"';
 const res = await p.$queryRawUnsafe(sql);
 console.log(n, res[0].c);
   } catch (e) {
 console.log(n, 'ERR', e.message);
   }
 }
 await p.$disconnect();
  } catch (e) {
 console.error('FATAL', e.message || e);
 process.exit(1);
  }
})();
