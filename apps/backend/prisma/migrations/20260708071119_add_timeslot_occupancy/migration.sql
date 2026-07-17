-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Intervention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "new_TimeSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "occupancy" INTEGER NOT NULL DEFAULT 0,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "TimeSlot_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TimeSlot" ("created_at", "deleted_at", "end", "id", "start", "status", "updated_at", "workspace_id") SELECT "created_at", "deleted_at", "end", "id", "start", "status", "updated_at", "workspace_id" FROM "TimeSlot";
DROP TABLE "TimeSlot";
ALTER TABLE "new_TimeSlot" RENAME TO "TimeSlot";
CREATE INDEX "TimeSlot_workspace_id_idx" ON "TimeSlot"("workspace_id");
CREATE INDEX "TimeSlot_workspace_id_start_idx" ON "TimeSlot"("workspace_id", "start");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
