/*
  Warnings:

  - Added the required column `price_snapshot` to the `InterventionPart` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InterventionPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_snapshot" REAL NOT NULL,
    CONSTRAINT "InterventionPart_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "Intervention" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterventionPart_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterventionPart" ("id", "intervention_id", "item_id", "quantity") SELECT "id", "intervention_id", "item_id", "quantity" FROM "InterventionPart";
DROP TABLE "InterventionPart";
ALTER TABLE "new_InterventionPart" RENAME TO "InterventionPart";
CREATE INDEX "InterventionPart_intervention_id_idx" ON "InterventionPart"("intervention_id");
CREATE INDEX "InterventionPart_item_id_idx" ON "InterventionPart"("item_id");
CREATE TABLE "new_Proforma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "case_id" TEXT,
    CONSTRAINT "Proforma_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Proforma_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Proforma_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Proforma" ("appointment_id", "created_at", "deleted_at", "id", "reference", "status", "total", "updated_at", "workspace_id") SELECT "appointment_id", "created_at", "deleted_at", "id", "reference", "status", "total", "updated_at", "workspace_id" FROM "Proforma";
DROP TABLE "Proforma";
ALTER TABLE "new_Proforma" RENAME TO "Proforma";
CREATE INDEX "Proforma_workspace_id_idx" ON "Proforma"("workspace_id");
CREATE INDEX "Proforma_appointment_id_idx" ON "Proforma"("appointment_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
