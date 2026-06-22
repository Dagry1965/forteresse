-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "assignedDriver" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proforma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "total_amount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "Proforma_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "Intervention" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proforma" ("id", "intervention_id", "status", "total_amount", "workspaceId") SELECT "id", "intervention_id", "status", "total_amount", "workspaceId" FROM "Proforma";
DROP TABLE "Proforma";
ALTER TABLE "new_Proforma" RENAME TO "Proforma";
CREATE UNIQUE INDEX "Proforma_intervention_id_key" ON "Proforma"("intervention_id");
CREATE INDEX "Proforma_workspaceId_idx" ON "Proforma"("workspaceId");
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "vatNumber" TEXT,
    "siret" TEXT,
    "contactPerson" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("createdAt", "email", "id", "name", "phone", "updatedAt", "workspaceId") SELECT "createdAt", "email", "id", "name", "phone", "updatedAt", "workspaceId" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_workspaceId_idx" ON "Client"("workspaceId");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proforma_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "due_date" DATETIME NOT NULL,
    "total_paid" REAL NOT NULL DEFAULT 0,
    "lastReminderSentAt" DATETIME,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "Invoice_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "Proforma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("due_date", "id", "lastReminderSentAt", "proforma_id", "reminderCount", "status", "total_paid", "workspaceId") SELECT "due_date", "id", "lastReminderSentAt", "proforma_id", "reminderCount", "status", "total_paid", "workspaceId" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_proforma_id_key" ON "Invoice"("proforma_id");
CREATE INDEX "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
