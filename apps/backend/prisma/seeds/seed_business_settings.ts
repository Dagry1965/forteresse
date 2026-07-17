import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Récupère tous les workspaces existants
  const workspaces = await prisma.workspace.findMany();

  for (const workspace of workspaces) {
    const existing = await prisma.businessSettings.findUnique({
      where: { workspace_id: workspace.id },
    });

    if (!existing) {
      await prisma.businessSettings.create({
  data: {
    workspace_id: workspace.id,
    openingTime: "08:00",
    closingTime: "18:00",
    slotDuration: 30,
    maxConcurrent: 2,
    workingDays: "1,2,3,4,5,6", // ← Format string
  },
});
      console.log(`BusinessSettings créé pour le workspace: ${workspace.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });