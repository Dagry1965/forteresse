-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Intervention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DIAGNOSIS',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    CONSTRAINT "Intervention_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Intervention_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Intervention" ("appointment_id", "created_at", "deleted_at", "description", "id", "status", "updated_at", "workspace_id") SELECT "appointment_id", "created_at", "deleted_at", "description", "id", "status", "updated_at", "workspace_id" FROM "Intervention";
DROP TABLE "Intervention";
ALTER TABLE "new_Intervention" RENAME TO "Intervention";
CREATE INDEX "Intervention_workspace_id_idx" ON "Intervention"("workspace_id");
CREATE INDEX "Intervention_appointment_id_idx" ON "Intervention"("appointment_id");
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    CONSTRAINT "Vehicle_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "client_id", "created_at", "deleted_at", "id", "model", "registration", "status", "updated_at", "workspace_id") SELECT "brand", "client_id", "created_at", "deleted_at", "id", "model", "registration", "status", "updated_at", "workspace_id" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE INDEX "Vehicle_workspace_id_idx" ON "Vehicle"("workspace_id");
CREATE INDEX "Vehicle_client_id_idx" ON "Vehicle"("client_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
