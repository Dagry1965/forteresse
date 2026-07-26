-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "receives_proforma" BOOLEAN NOT NULL DEFAULT false,
    "receives_invoice" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    CONSTRAINT "ClientContact_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientContact_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT,
    "status" TEXT NOT NULL,
    "destination" TEXT,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "company_name" TEXT,
    "trade_name" TEXT,
    "registration_number" TEXT,
    "vat_number" TEXT,
    "address" TEXT,
    "billing_address" TEXT,
    "payment_terms_days" INTEGER NOT NULL DEFAULT 0,
    "credit_limit" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "Client_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("created_at", "deleted_at", "email", "id", "name", "phone", "type", "updated_at", "workspace_id") SELECT "created_at", "deleted_at", "email", "id", "name", "phone", "type", "updated_at", "workspace_id" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_workspace_id_idx" ON "Client"("workspace_id");
CREATE INDEX "Client_workspace_id_type_idx" ON "Client"("workspace_id", "type");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_registration_number_idx" ON "Client"("registration_number");
CREATE INDEX "Client_vat_number_idx" ON "Client"("vat_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClientContact_workspace_id_idx" ON "ClientContact"("workspace_id");

-- CreateIndex
CREATE INDEX "ClientContact_client_id_idx" ON "ClientContact"("client_id");

-- CreateIndex
CREATE INDEX "ClientContact_client_id_is_primary_idx" ON "ClientContact"("client_id", "is_primary");

-- CreateIndex
CREATE INDEX "BackupLog_status_idx" ON "BackupLog"("status");

-- CreateIndex
CREATE INDEX "BackupLog_created_at_idx" ON "BackupLog"("created_at");
