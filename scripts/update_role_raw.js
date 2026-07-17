const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    await p.$executeRawUnsafe(`UPDATE User SET role = 'admin' WHERE email = 'admin@example.com'`);
    console.log('✅ Rôle mis à jour avec succès');
  } catch (e) {
    console.error('ERREUR:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
