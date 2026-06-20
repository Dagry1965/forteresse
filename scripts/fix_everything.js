const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const email = 'admin@example.com';
    const workspaceId = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error("Erreur : L'utilisateur admin@example.com n'existe pas. Lancez d'abord seed-auth.js");
        return;
    }

    // 1. Créer le Workspace s'il n'existe pas
    const workspace = await prisma.workspace.upsert({
      where: { id: workspaceId },
      update: {},
      create: {
        id: workspaceId,
        name: "Garage Forteresse Principal",
        ownerId: user.id
      }
    });
    console.log("✅ Workspace vérifié/créé");

    // 2. Créer le lien d'appartenance (WorkspaceMember)
    // On cherche si le lien existe déjà pour éviter le crash
    const existingMember = await prisma.workspaceMember.findFirst({
        where: { userId: user.id, workspaceId: workspaceId }
    });

    if (!existingMember) {
        await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspaceId,
                role: 'admin'
            }
        });
    }
    
    console.log("✅ Utilisateur admin@example.com lié au Workspace en tant qu'admin");

  } catch (e) { 
    console.error("Erreur lors de la réparation :");
    console.error(e.message); 
  }
  finally { await prisma.$disconnect(); }
})();
