const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = 'admin@example.com';
    const password = 'password';
    const hashed = await argon2.hash(password);
    const exists = await prisma.user.findUnique({ where: { email }});
    if (!exists) {
      const u = await prisma.user.create({ data: { email, password: hashed, name: 'Admin', }});
      console.log('Created user', u.id);
    } else {
      console.log('User exists');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();