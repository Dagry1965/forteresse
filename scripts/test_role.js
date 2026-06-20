const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const updated = await p.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'admin' }
    });
    console.log('✅ SUCCÈS : Le champ role est reconnu -', updated.role);
  } catch (e) {
    console.error('ERREUR:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
