/*
  Warnings:

  - You are about to drop the column `customer_address_snapshot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customer_billing_address_snapshot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customer_email_snapshot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customer_name_snapshot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customer_phone_snapshot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customer_registration_number_snapshot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customer_vat_number_snapshot` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proforma" ADD COLUMN "customer_address_snapshot" TEXT;
ALTER TABLE "Proforma" ADD COLUMN "customer_billing_address_snapshot" TEXT;
ALTER TABLE "Proforma" ADD COLUMN "customer_email_snapshot" TEXT;
ALTER TABLE "Proforma" ADD COLUMN "customer_name_snapshot" TEXT;
ALTER TABLE "Proforma" ADD COLUMN "customer_phone_snapshot" TEXT;
ALTER TABLE "Proforma" ADD COLUMN "customer_registration_number_snapshot" TEXT;
ALTER TABLE "Proforma" ADD COLUMN "customer_vat_number_snapshot" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "User_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("created_at", "deleted_at", "email", "id", "name", "password", "updated_at", "workspace_id") SELECT "created_at", "deleted_at", "email", "id", "name", "password", "updated_at", "workspace_id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_workspace_id_idx" ON "User"("workspace_id");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
