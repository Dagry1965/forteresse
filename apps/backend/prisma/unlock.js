const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlock() {
  console.log("ðŸ”“ Nettoyage des verrous financiers...");
  
  // On supprime dans l'ordre pour ne pas avoir d'erreur de lien
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.lineItem.deleteMany({});
  await prisma.proforma.deleteMany({});
  
  console.log("âœ… TerminÃ© ! Toutes les interventions sont maintenant libres.");
  console.log("Tu peux maintenant gÃ©nÃ©rer un nouveau proforma sur le web.");
}

unlock().catch(e => console.error(e)).finally(() => prisma.$disconnect());

