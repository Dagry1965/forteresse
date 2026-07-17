import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const workspaceId = 'seed-workspace-1'; // ← Ton workspace ID

  console.log(`🌱 Création de créneaux de test pour le workspace: ${workspaceId}`);

  const now = new Date();
  const slotsToCreate = [];

  // Créer des créneaux sur les 7 prochains jours
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() + day);

    // Créneaux du matin
    slotsToCreate.push({
      workspace_id: workspaceId,
      start: new Date(new Date(currentDate).setHours(8, 0, 0, 0)),
      end: new Date(new Date(currentDate).setHours(9, 0, 0, 0)),
      status: 'OPEN',
    });

    slotsToCreate.push({
      workspace_id: workspaceId,
      start: new Date(new Date(currentDate).setHours(9, 30, 0, 0)),
      end: new Date(new Date(currentDate).setHours(10, 30, 0, 0)),
      status: 'OPEN',
    });

    // Créneaux de l'après-midi
    slotsToCreate.push({
      workspace_id: workspaceId,
      start: new Date(new Date(currentDate).setHours(13, 0, 0, 0)),
      end: new Date(new Date(currentDate).setHours(14, 0, 0, 0)),
      status: 'OPEN',
    });

    slotsToCreate.push({
      workspace_id: workspaceId,
      start: new Date(new Date(currentDate).setHours(14, 30, 0, 0)),
      end: new Date(new Date(currentDate).setHours(15, 30, 0, 0)),
      status: 'OPEN',
    });
  }

  // Supprimer les anciens créneaux de ce workspace (optionnel mais propre)
  await prisma.timeSlot.deleteMany({
    where: { workspace_id: workspaceId },
  });

  // Créer les nouveaux créneaux
  const result = await prisma.timeSlot.createMany({
    data: slotsToCreate,
  });

  console.log(`✅ ${result.count} créneaux créés avec succès !`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });