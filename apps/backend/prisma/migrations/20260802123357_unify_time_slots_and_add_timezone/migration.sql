/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,start,end]` on the table `TimeSlot` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openingTime" TEXT NOT NULL DEFAULT '08:00',
    "closingTime" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "maxConcurrent" INTEGER NOT NULL DEFAULT 2,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "workingDays" TEXT NOT NULL DEFAULT '1,2,3,4,5,6',
    "workspace_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "BusinessSettings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BusinessSettings" ("closingTime", "created_at", "id", "maxConcurrent", "openingTime", "slotDuration", "updated_at", "workingDays", "workspace_id") SELECT "closingTime", "created_at", "id", "maxConcurrent", "openingTime", "slotDuration", "updated_at", "workingDays", "workspace_id" FROM "BusinessSettings";
DROP TABLE "BusinessSettings";
ALTER TABLE "new_BusinessSettings" RENAME TO "BusinessSettings";
CREATE UNIQUE INDEX "BusinessSettings_workspace_id_key" ON "BusinessSettings"("workspace_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_workspace_id_start_end_key" ON "TimeSlot"("workspace_id", "start", "end");
