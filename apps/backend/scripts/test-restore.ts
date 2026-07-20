import Database from "better-sqlite3";
import { copyFile, stat, unlink } from "fs/promises";
import { resolve } from "path";

async function main() {
  const source = process.argv[2];

  if (!source) {
    throw new Error(
      "Usage : ts-node scripts/test-restore.ts <chemin-vers-la-sauvegarde.db>",
    );
  }

  const sourcePath = resolve(source);
  const testPath = resolve(
    process.cwd(),
    "restore-test.db",
  );

  await stat(sourcePath);
  await copyFile(sourcePath, testPath);

  const database = new Database(testPath, {
    readonly: true,
    fileMustExist: true,
  });

  try {
    const integrity = database
      .prepare("PRAGMA integrity_check")
      .all() as Array<{ integrity_check: string }>;

    if (
      integrity.length !== 1 ||
      integrity[0]?.integrity_check !== "ok"
    ) {
      throw new Error(
        `Sauvegarde invalide : ${JSON.stringify(integrity)}`,
      );
    }

    const tables = database
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
      `)
      .all();

    console.log("Restauration de test réussie.");
    console.log("Intégrité SQLite : OK");
    console.log("Tables trouvées :", tables.length);
  } finally {
    database.close();
    await unlink(testPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
