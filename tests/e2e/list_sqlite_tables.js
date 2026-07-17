const { PrismaClient } = require('@prisma/client');
(async () => {
  try {
 const p = new PrismaClient();
 const rows = await p.$queryRawUnsafe('SELECT name FROM sqlite_master WHERE type="table"');
 console.log(JSON.stringify(rows, null, 2));
 await p.$disconnect();
  } catch (e) {
 console.error("ERROR:", e.message || e);
 process.exit(1);
  }
})();
