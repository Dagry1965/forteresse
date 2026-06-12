import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@forteresse.local' },
    update: {},
    create: {
      email: 'admin@forteresse.local',
      name: 'Admin Forteresse',
      password: 'adminpassword', // À hasher en prod
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Garage Central Forteresse',
      ownerId: admin.id,
      members: { create: { userId: admin.id, role: 'owner' } }
    }
  });

  console.log({ admin, workspace });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
