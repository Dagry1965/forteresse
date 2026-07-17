import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting initial seed...');

  // 1. Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'seed-workspace-1' },
    update: {},
    create: {
      id: 'seed-workspace-1',
      name: 'Garage Test',
    },
  });
  console.log(`✅ Workspace: ${workspace.name}`);

  // 2. Utilisateur Admin
  const hashedPassword = await argon2.hash('password123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: hashedPassword, workspace_id: workspace.id },
    create: {
      email: 'admin@test.com',
      name: 'Admin Test',
      password: hashedPassword,
      workspace_id: workspace.id,
    },
  });
  console.log(`✅ Utilisateur Admin: ${admin.email}`);

  // 3. WorkspaceMember
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: admin.id,
      workspace_id: workspace.id,
    },
  });

  if (!existingMember) {
    await prisma.workspaceMember.create({
      data: {
        user_id: admin.id,
        workspace_id: workspace.id,
        role: 'ADMIN',
      },
    });
    console.log('✅ WorkspaceMember créé');
  } else {
    console.log('ℹ️  WorkspaceMember déjà existant');
  }

  // 4. Clients de test
  let jeanClient = await prisma.client.findFirst({
    where: { name: 'Jean Dupont', workspace_id: workspace.id },
  });

  let garageClient = await prisma.client.findFirst({
    where: { name: 'Garage Pro SARL', workspace_id: workspace.id },
  });

  if (!jeanClient || !garageClient) {
    await prisma.client.createMany({
      data: [
        {
          name: 'Jean Dupont',
          email: 'jean.dupont@email.com',
          phone: '0612345678',
          type: 'INDIVIDUAL',
          workspace_id: workspace.id,
        },
        {
          name: 'Garage Pro SARL',
          email: 'contact@garagepro.fr',
          phone: '0298765432',
          type: 'COMPANY',
          workspace_id: workspace.id,
        },
      ],
    });
    console.log('✅ Clients de test créés');

    // Récupérer les clients après création
    jeanClient = await prisma.client.findFirst({
      where: { name: 'Jean Dupont', workspace_id: workspace.id },
    });
    garageClient = await prisma.client.findFirst({
      where: { name: 'Garage Pro SARL', workspace_id: workspace.id },
    });
  } else {
    console.log('ℹ️  Clients déjà existants');
  }

  // 5. Véhicules rattachés aux clients
  if (jeanClient && garageClient) {
    const existingVehicles = await prisma.vehicle.count({
      where: { workspace_id: workspace.id },
    });

    if (existingVehicles === 0) {
      await prisma.vehicle.createMany({
        data: [
          // Véhicules de Jean Dupont
          {
            registration: 'AB-123-CD',
            brand: 'Renault',
            model: 'Clio',
            client_id: jeanClient.id,
            workspace_id: workspace.id,
          },
          {
            registration: 'EF-456-GH',
            brand: 'Peugeot',
            model: '308',
            client_id: jeanClient.id,
            workspace_id: workspace.id,
          },
          // Véhicules de Garage Pro SARL
          {
            registration: 'IJ-789-KL',
            brand: 'Mercedes',
            model: 'Sprinter',
            client_id: garageClient.id,
            workspace_id: workspace.id,
          },
          {
            registration: 'MN-012-OP',
            brand: 'Ford',
            model: 'Transit',
            client_id: garageClient.id,
            workspace_id: workspace.id,
          },
          {
            registration: 'QR-345-ST',
            brand: 'Volkswagen',
            model: 'Crafter',
            client_id: garageClient.id,
            workspace_id: workspace.id,
          },
        ],
      });
      console.log('✅ Véhicules créés et rattachés aux clients');
    } else {
      console.log('ℹ️  Véhicules déjà existants');
    }
  }

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('Email: admin@test.com | Mot de passe: password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });