/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,reference]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,reference]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,reference]` on the table `Proforma` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,reference]` on the table `PurchaseOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,reference]` on the table `PurchaseReceipt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "appointment_id" TEXT,
    CONSTRAINT "Case_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TEMP TABLE "_CaseReferenceBackfill" AS
WITH ranked_cases AS (
    SELECT
        "id",
        "workspace_id",
        CAST(strftime('%Y', "created_at" / 1000, 'unixepoch') AS INTEGER) AS "reference_year",
        ROW_NUMBER() OVER (
            PARTITION BY
                "workspace_id",
                CAST(strftime('%Y', "created_at" / 1000, 'unixepoch') AS INTEGER)
            ORDER BY "created_at", "id"
        ) AS "reference_number"
    FROM "Case"
)
SELECT
    "id",
    "workspace_id",
    "reference_year",
    "reference_number",
    printf(
        'DOS-%04d-%04d',
        "reference_year",
        "reference_number"
    ) AS "reference"
FROM ranked_cases;

INSERT INTO "new_Case" (
    "appointment_id",
    "created_at",
    "customer_id",
    "description",
    "id",
    "reference",
    "status",
    "title",
    "updated_at",
    "vehicle_id",
    "workspace_id"
)
SELECT
    old_case."appointment_id",
    old_case."created_at",
    old_case."customer_id",
    old_case."description",
    old_case."id",
    backfill."reference",
    old_case."status",
    old_case."title",
    old_case."updated_at",
    old_case."vehicle_id",
    old_case."workspace_id"
FROM "Case" AS old_case
INNER JOIN "_CaseReferenceBackfill" AS backfill
    ON backfill."id" = old_case."id";

DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_appointment_id_key" ON "Case"("appointment_id");
CREATE INDEX "Case_workspace_id_idx" ON "Case"("workspace_id");
CREATE INDEX "Case_workspace_id_status_idx" ON "Case"("workspace_id", "status");
CREATE UNIQUE INDEX "Case_workspace_id_reference_key" ON "Case"("workspace_id", "reference");

INSERT OR IGNORE INTO "NumberSequence" (
    "id",
    "workspace_id",
    "prefix",
    "year",
    "last_number",
    "created_at",
    "updated_at"
)
SELECT
    'migration-dos-' || "workspace_id" || '-' || "reference_year",
    "workspace_id",
    'DOS',
    "reference_year",
    MAX("reference_number"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "_CaseReferenceBackfill"
GROUP BY "workspace_id", "reference_year";

UPDATE "NumberSequence"
SET
    "last_number" = (
        SELECT MAX(backfill."reference_number")
        FROM "_CaseReferenceBackfill" AS backfill
        WHERE
            backfill."workspace_id" = "NumberSequence"."workspace_id"
            AND backfill."reference_year" = "NumberSequence"."year"
    ),
    "updated_at" = CURRENT_TIMESTAMP
WHERE
    "prefix" = 'DOS'
    AND EXISTS (
        SELECT 1
        FROM "_CaseReferenceBackfill" AS backfill
        WHERE
            backfill."workspace_id" = "NumberSequence"."workspace_id"
            AND backfill."reference_year" = "NumberSequence"."year"
            AND backfill."reference_number" > "NumberSequence"."last_number"
    );

DROP TABLE "_CaseReferenceBackfill";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_workspace_id_reference_key" ON "Inventory"("workspace_id", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_workspace_id_reference_key" ON "Invoice"("workspace_id", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_workspace_id_reference_key" ON "Proforma"("workspace_id", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_workspace_id_reference_key" ON "PurchaseOrder"("workspace_id", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceipt_workspace_id_reference_key" ON "PurchaseReceipt"("workspace_id", "reference");
