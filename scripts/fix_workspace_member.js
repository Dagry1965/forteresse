const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    const workspaceId = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

    if (user) {
      // On crée ou met à jour l'appartenance au workspace
      await prisma.workspaceMember.upsert({
        where: { id: user.id }, // ou une autre clé unique si définie
        create: {
          userId: user.id,
          workspaceId: workspaceId,
          role: 'admin'
        },
        update: {
          workspaceId: workspaceId,
          role: 'admin'
        }
      });
      console.log("✅ Lien WorkspaceMember vérifié pour admin@example.com");
    }
  } catch (e) { console.error("Erreur lien:", e.message); }
  finally { await prisma.$disconnect(); }
})();
