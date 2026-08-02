-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Intervention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "diagnostic" TEXT,
    "planned_minutes" INTEGER,
    "actual_minutes" INTEGER,
    "hourly_rate" DECIMAL,
    "quality_control_status" TEXT NOT NULL DEFAULT 'PENDING',
    "quality_control_notes" TEXT,
    "quality_control_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "case_id" TEXT,
    "mechanic_id" TEXT,
    CONSTRAINT "Intervention_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Intervention_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Intervention_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Intervention" ("case_id", "created_at", "deleted_at", "description", "id", "status", "updated_at", "workspace_id") SELECT "case_id", "created_at", "deleted_at", "description", "id", "status", "updated_at", "workspace_id" FROM "Intervention";
DROP TABLE "Intervention";
ALTER TABLE "new_Intervention" RENAME TO "Intervention";
CREATE INDEX "Intervention_workspace_id_idx" ON "Intervention"("workspace_id");
CREATE INDEX "Intervention_case_id_idx" ON "Intervention"("case_id");
CREATE INDEX "Intervention_mechanic_id_idx" ON "Intervention"("mechanic_id");
CREATE INDEX "Intervention_priority_idx" ON "Intervention"("priority");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
