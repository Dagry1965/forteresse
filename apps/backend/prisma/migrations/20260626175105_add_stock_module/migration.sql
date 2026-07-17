/*
  Warnings:

  - You are about to drop the column `product_id` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `PurchaseOrder` table. All the data in the column will be lost.
  - Added the required column `item_id` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "StockCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "StockCategory_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockItem" (
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
    CONSTRAINT "StockItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "StockCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockItem_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockItem_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_buy" REAL NOT NULL,
    CONSTRAINT "PurchaseOrderItem_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockReception" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_order_id" TEXT NOT NULL,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "StockReception_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockReception_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "Inventory_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventory_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "counted" INTEGER NOT NULL,
    "expected" INTEGER NOT NULL,
    CONSTRAINT "InventoryItem_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterventionPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "InterventionPart_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "Intervention" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterventionPart_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,
    CONSTRAINT "StockMovement_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("created_at", "id", "quantity", "type", "workspace_id") SELECT "created_at", "id", "quantity", "type", "workspace_id" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE TABLE "new_Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "Supplier_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Supplier" ("email", "id", "name", "phone", "workspace_id") SELECT "email", "id", "name", "phone", "workspace_id" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrder_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("created_at", "id", "reference", "status", "supplier_id", "workspace_id") SELECT "created_at", "id", "reference", "status", "supplier_id", "workspace_id" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
