-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "intervention_part_id" TEXT,
    "purchase_receipt_id" TEXT,
    CONSTRAINT "StockMovement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_intervention_part_id_fkey" FOREIGN KEY ("intervention_part_id") REFERENCES "InterventionPart" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_purchase_receipt_id_fkey" FOREIGN KEY ("purchase_receipt_id") REFERENCES "PurchaseReceipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("created_at", "created_by", "id", "item_id", "quantity", "type", "workspace_id") SELECT "created_at", "created_by", "id", "item_id", "quantity", "type", "workspace_id" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE INDEX "StockMovement_workspace_id_idx" ON "StockMovement"("workspace_id");
CREATE INDEX "StockMovement_item_id_idx" ON "StockMovement"("item_id");
CREATE INDEX "StockMovement_intervention_part_id_idx" ON "StockMovement"("intervention_part_id");
CREATE INDEX "StockMovement_purchase_receipt_id_idx" ON "StockMovement"("purchase_receipt_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
