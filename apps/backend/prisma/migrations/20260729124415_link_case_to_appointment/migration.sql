-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "appointment_id" TEXT,
    CONSTRAINT "Case_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("created_at", "customer_id", "description", "id", "status", "title", "updated_at", "vehicle_id", "workspace_id") SELECT "created_at", "customer_id", "description", "id", "status", "title", "updated_at", "vehicle_id", "workspace_id" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_appointment_id_key" ON "Case"("appointment_id");
CREATE INDEX "Case_workspace_id_idx" ON "Case"("workspace_id");
CREATE INDEX "Case_workspace_id_status_idx" ON "Case"("workspace_id", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
