const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.user.findUnique({ where: { email: 'admin@example.com' } })
  .then(u => {
    if (u) {
      console.log('ROLE EN BASE :', u.role);
      console.log('ID :', u.id);
    } else {
      console.log('Utilisateur non trouvé');
    }
  })
  .finally(() => p.$disconnect());
