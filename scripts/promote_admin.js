const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'admin' }
    });
    console.log("✅ Utilisateur admin@example.com promu au rang d'ADMIN");
  } catch (e) { 
    console.error("Erreur : L'utilisateur n'existe peut-être pas ou le champ role est manquant.");
    console.error(e.message); 
  }
  finally { await prisma.$disconnect(); }
})();
