const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlock() {
  console.log("🔓 Nettoyage des verrous financiers...");
  
  // On supprime dans l'ordre pour ne pas avoir d'erreur de lien
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.lineItem.deleteMany({});
  await prisma.proforma.deleteMany({});
  
  console.log("✅ Terminé ! Toutes les interventions sont maintenant libres.");
  console.log("Tu peux maintenant générer un nouveau proforma sur le web.");
}

unlock().catch(e => console.error(e)).finally(() => prisma.$disconnect());
