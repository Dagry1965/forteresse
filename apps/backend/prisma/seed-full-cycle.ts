import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Début du seed complet...');

  // 1. Créer un utilisateur (admin)
  const user = await prisma.user.upsert({
    where: { email: 'admin@forteresse.local' },
    update: {},
    create: {
      email: 'admin@forteresse.local',
      name: 'Admin Forteresse',
      password: 'adminpassword',
    },
  });

  // 2. Créer un Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Garage Test Forteresse',
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'owner',
        },
      },
    },
  });

  // 3. Créer un Client
  const client = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: 'Jean Martin',
      email: 'jean.martin@test.fr',
      phone: '0612345678',
    },
  });

  // 4. Créer un Véhicule
  const vehicle = await prisma.vehicle.create({
    data: {
      workspaceId: workspace.id,
      clientId: client.id,
      vin: 'VF123456789012345',
      plateNumber: 'AB-123-CD',
      make: 'Renault',
      model: 'Clio',
    },
  });

  // 5. Créer un Rendez-vous (RDV)
  const appointment = await prisma.appointment.create({
    data: {
      user_id: user.id,
      vehicle_id: vehicle.id,
      scheduled_at: new Date('2026-06-20T09:00:00'),
      status: 'confirmed',
      initial_description: 'Problème de démarrage',
    },
  });

  // 6. Créer une Intervention à partir du RDV
  const intervention = await prisma.intervention.create({
    data: {
      appointment_id: appointment.id,
      status: 'diagnosing',
    },
  });

  // 7. Créer un Proforma avec des lignes
  const proforma = await prisma.proforma.create({
    data: {
      intervention_id: intervention.id,
      status: 'draft',
      total_amount: 0,
      lines: {
        create: [
          {
            description: 'Diagnostic complet',
            quantity: 1,
            unit_price: 80,
          },
          {
            description: 'Bougies d\'allumage (x4)',
            quantity: 4,
            unit_price: 18,
          },
          {
            description: 'Main d\'œuvre',
            quantity: 2,
            unit_price: 65,
          },
        ],
      },
    },
    include: {
      lines: true,
    },
  });

  // Mise à jour du total du Proforma
  const total = proforma.lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  await prisma.proforma.update({
    where: { id: proforma.id },
    data: { total_amount: total },
  });

  console.log('✅ Cycle complet créé avec succès !');
  console.log('-----------------------------------');
  console.log('Workspace ID :', workspace.id);
  console.log('Client ID    :', client.id);
  console.log('Vehicle ID   :', vehicle.id);
  console.log('Appointment  :', appointment.id);
  console.log('Intervention :', intervention.id);
  console.log('Proforma ID  :', proforma.id);
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
