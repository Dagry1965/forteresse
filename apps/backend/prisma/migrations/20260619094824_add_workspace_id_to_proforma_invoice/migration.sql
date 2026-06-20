-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proforma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "workspaceId" TEXT NOT NULL DEFAULT 'a1ae9e3a-2ff0-49f3-8e4d-f504f1332971',
    CONSTRAINT "Proforma_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "Intervention" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proforma" ("id", "intervention_id", "status", "total_amount") SELECT "id", "intervention_id", "status", "total_amount" FROM "Proforma";
DROP TABLE "Proforma";
ALTER TABLE "new_Proforma" RENAME TO "Proforma";
CREATE UNIQUE INDEX "Proforma_intervention_id_key" ON "Proforma"("intervention_id");
CREATE INDEX "Proforma_workspaceId_idx" ON "Proforma"("workspaceId");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proforma_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "due_date" DATETIME NOT NULL,
    "total_paid" REAL NOT NULL DEFAULT 0,
    "lastReminderSentAt" DATETIME,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "workspaceId" TEXT NOT NULL DEFAULT 'a1ae9e3a-2ff0-49f3-8e4d-f504f1332971',
    CONSTRAINT "Invoice_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "Proforma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("due_date", "id", "lastReminderSentAt", "proforma_id", "reminderCount", "status", "total_paid") SELECT "due_date", "id", "lastReminderSentAt", "proforma_id", "reminderCount", "status", "total_paid" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_proforma_id_key" ON "Invoice"("proforma_id");
CREATE INDEX "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
