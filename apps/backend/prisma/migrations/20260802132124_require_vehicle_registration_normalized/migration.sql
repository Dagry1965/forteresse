/*
  Warnings:

  - Made the column `registration_normalized` on table `Vehicle` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill normalized values before making registration_normalized required
UPDATE "Client"
SET
  "email_normalized" = CASE
    WHEN TRIM(COALESCE("email", '')) = '' THEN NULL
    ELSE LOWER(TRIM("email"))
  END,
  "phone_normalized" = CASE
    WHEN TRIM(COALESCE("phone", '')) = '' THEN NULL
    ELSE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM("phone"), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '/', ''), CHAR(9), '')
  END;

UPDATE "Vehicle"
SET
  "registration_normalized" = UPPER(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM("registration"), ' ', ''), '-', ''), '.', ''), '/', ''), '_', '')
  ),
  "vin_normalized" = CASE
    WHEN TRIM(COALESCE("vin", '')) = '' THEN NULL
    ELSE UPPER(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM("vin"), ' ', ''), '-', ''), '.', ''), '/', ''), '_', '')
    )
  END;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration" TEXT NOT NULL,
    "registration_normalized" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "fleet_number" TEXT,
    "vin" TEXT,
    "vin_normalized" TEXT,
    "year" INTEGER,
    "mileage" INTEGER,
    "usual_driver" TEXT,
    "cost_center" TEXT,
    "service_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    CONSTRAINT "Vehicle_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "client_id", "cost_center", "created_at", "deleted_at", "fleet_number", "id", "mileage", "model", "registration", "registration_normalized", "service_name", "status", "updated_at", "usual_driver", "vin", "vin_normalized", "workspace_id", "year") SELECT "brand", "client_id", "cost_center", "created_at", "deleted_at", "fleet_number", "id", "mileage", "model", "registration", "registration_normalized", "service_name", "status", "updated_at", "usual_driver", "vin", "vin_normalized", "workspace_id", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE INDEX "Vehicle_workspace_id_idx" ON "Vehicle"("workspace_id");
CREATE INDEX "Vehicle_client_id_idx" ON "Vehicle"("client_id");
CREATE INDEX "Vehicle_workspace_id_registration_idx" ON "Vehicle"("workspace_id", "registration");
CREATE INDEX "Vehicle_workspace_id_fleet_number_idx" ON "Vehicle"("workspace_id", "fleet_number");
CREATE INDEX "Vehicle_workspace_id_vin_idx" ON "Vehicle"("workspace_id", "vin");
CREATE UNIQUE INDEX "Vehicle_workspace_id_registration_normalized_key" ON "Vehicle"("workspace_id", "registration_normalized");
CREATE UNIQUE INDEX "Vehicle_workspace_id_vin_normalized_key" ON "Vehicle"("workspace_id", "vin_normalized");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
