import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workspaceId = 'a1ae9e3a-2ff0-49f3-8e4d-f504f1332971';

  await prisma.supplier.upsert({
    where: { id: 'test-supplier-id' },
    update: {},
    create: {
      id: 'test-supplier-id',
      workspaceId,
      name: 'Test Supplier',
      email: 'supplier@example.test',
      phone: '+33123456789',
    },
  });

  await prisma.product.upsert({
    where: { id: 'f81d4afd-e83d-489a-8872-7566d21ec6f7' },
    update: {},
    create: {
      id: 'f81d4afd-e83d-489a-8872-7566d21ec6f7',
      workspaceId,
      reference: 'P-001',
      name: 'Test Part A',
      purchase_price: 10,
      selling_price: 15,
      description: 'PiÃ¨ce de test A',
    },
  });

  await prisma.product.upsert({
    where: { id: 'test-filter-id' },
    update: {},
    create: {
      id: 'test-filter-id',
      workspaceId,
      reference: 'P-002',
      name: 'Test Filter',
      purchase_price: 8,
      selling_price: 12,
      description: 'Filtre de test',
    },
  });

  await prisma.product.upsert({
    where: { id: 'test-pads-id' },
    update: {},
    create: {
      id: 'test-pads-id',
      workspaceId,
      reference: 'P-003',
      name: 'Test Pads',
      purchase_price: 20,
      selling_price: 30,
      description: 'Plaquettes de test',
    },
  });

  console.log('seed-po finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
