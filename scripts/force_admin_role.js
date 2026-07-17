const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    // 1. Vérifier si la colonne role existe, sinon la créer
    try {
      await p.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN role TEXT DEFAULT 'user'`);
      console.log("✅ Colonne 'role' ajoutée à la table User");
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log("ℹ️ Colonne 'role' existe déjà");
      } else {
        throw e;
      }
    }

    // 2. Mettre à jour l'utilisateur admin
    const updated = await p.user.update({
      where: { email: 'admin@example.com' },
      data: { role: 'admin' }
    });

    console.log("✅ Utilisateur promu ADMIN :", updated.email, "→", updated.role);

  } catch (e) {
    console.error("ERREUR:", e.message);
  } finally {
    await p.$disconnect();
  }
})();
