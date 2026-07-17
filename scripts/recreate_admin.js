const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const p = new PrismaClient();

(async () => {
  try {
    const hash = await argon2.hash('password');

    const user = await p.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: hash,
        role: 'admin'
      },
      create: {
        email: 'admin@example.com',
        password: hash,
        name: 'Admin',
        role: 'admin'
      }
    });

    console.log('✅ Utilisateur admin recréé avec succès');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
  } catch (e) {
    console.error('ERREUR:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
