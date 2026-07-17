/*
  Warnings:

  - You are about to drop the `DocumentSequence` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "DocumentSequence_workspace_id_document_type_year_key";

-- DropIndex
DROP INDEX "DocumentSequence_workspace_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DocumentSequence";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "NumberSequence_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "received_quantity" INTEGER NOT NULL DEFAULT 0,
    "price_buy" REAL NOT NULL,
    CONSTRAINT "PurchaseOrderItem_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrderItem" ("id", "item_id", "price_buy", "purchase_order_id", "quantity") SELECT "id", "item_id", "price_buy", "purchase_order_id", "quantity" FROM "PurchaseOrderItem";
DROP TABLE "PurchaseOrderItem";
ALTER TABLE "new_PurchaseOrderItem" RENAME TO "PurchaseOrderItem";
CREATE INDEX "PurchaseOrderItem_purchase_order_id_idx" ON "PurchaseOrderItem"("purchase_order_id");
CREATE INDEX "PurchaseOrderItem_item_id_idx" ON "PurchaseOrderItem"("item_id");
CREATE TABLE "new_StockItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "category_id" TEXT,
    "supplier_id" TEXT,
    "price_buy" REAL NOT NULL,
    "price_sell" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "workspace_id" TEXT NOT NULL,
    "deleted_at" DATETIME,
    "unit" TEXT NOT NULL DEFAULT 'unite',
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StockItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "StockCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockItem_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockItem_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StockItem" ("category_id", "deleted_at", "description", "id", "name", "price_buy", "price_sell", "quantity", "reference", "supplier_id", "workspace_id") SELECT "category_id", "deleted_at", "description", "id", "name", "price_buy", "price_sell", "quantity", "reference", "supplier_id", "workspace_id" FROM "StockItem";
DROP TABLE "StockItem";
ALTER TABLE "new_StockItem" RENAME TO "StockItem";
CREATE INDEX "StockItem_workspace_id_idx" ON "StockItem"("workspace_id");
CREATE INDEX "StockItem_category_id_idx" ON "StockItem"("category_id");
CREATE INDEX "StockItem_supplier_id_idx" ON "StockItem"("supplier_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NumberSequence_workspace_id_idx" ON "NumberSequence"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_workspace_id_prefix_year_key" ON "NumberSequence"("workspace_id", "prefix", "year");
