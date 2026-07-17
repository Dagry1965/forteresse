/*
  Warnings:

  - You are about to drop the column `appointment_id` on the `Intervention` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    CONSTRAINT "Case_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "case_id" TEXT,
    CONSTRAINT "Intervention_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Intervention_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Intervention" ("created_at", "deleted_at", "description", "id", "status", "updated_at", "workspace_id") SELECT "created_at", "deleted_at", "description", "id", "status", "updated_at", "workspace_id" FROM "Intervention";
DROP TABLE "Intervention";
ALTER TABLE "new_Intervention" RENAME TO "Intervention";
CREATE INDEX "Intervention_workspace_id_idx" ON "Intervention"("workspace_id");
CREATE INDEX "Intervention_case_id_idx" ON "Intervention"("case_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Case_workspace_id_idx" ON "Case"("workspace_id");

-- CreateIndex
CREATE INDEX "Case_workspace_id_status_idx" ON "Case"("workspace_id", "status");
