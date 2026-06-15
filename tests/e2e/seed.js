const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage du seed...");
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@forteresse.local' },
    update: {},
    create: {
      email: 'admin@forteresse.local',
      name: 'Admin Forteresse',
      password: 'adminpassword', 
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Garage Central Forteresse',
      ownerId: admin.id,
      members: {
        create: {
          userId: admin.id,
          role: 'owner'
        }
      }
    }
  });

  console.log("Seed terminé avec succès !");
  console.log("Admin ID:", admin.id);
  console.log("Workspace ID:", workspace.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
