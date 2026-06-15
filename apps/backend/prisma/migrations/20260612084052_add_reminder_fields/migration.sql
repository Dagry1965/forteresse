-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proforma_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "due_date" DATETIME NOT NULL,
    "total_paid" REAL NOT NULL DEFAULT 0,
    "lastReminderSentAt" DATETIME,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Invoice_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "Proforma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("due_date", "id", "proforma_id", "status", "total_paid") SELECT "due_date", "id", "proforma_id", "status", "total_paid" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_proforma_id_key" ON "Invoice"("proforma_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
