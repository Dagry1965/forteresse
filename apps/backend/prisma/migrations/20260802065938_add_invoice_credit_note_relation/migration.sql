-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'PROFORMA',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "customer_name_snapshot" TEXT,
    "customer_address_snapshot" TEXT,
    "customer_billing_address_snapshot" TEXT,
    "customer_registration_number_snapshot" TEXT,
    "customer_vat_number_snapshot" TEXT,
    "customer_email_snapshot" TEXT,
    "customer_phone_snapshot" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "workspace_id" TEXT NOT NULL,
    "proforma_id" TEXT,
    "original_invoice_id" TEXT,
    "appointment_id" TEXT,
    "user_id" TEXT,
    "client_id" TEXT,
    CONSTRAINT "Invoice_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "Proforma" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_original_invoice_id_fkey" FOREIGN KEY ("original_invoice_id") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("appointment_id", "client_id", "created_at", "created_by", "customer_address_snapshot", "customer_billing_address_snapshot", "customer_email_snapshot", "customer_name_snapshot", "customer_phone_snapshot", "customer_registration_number_snapshot", "customer_vat_number_snapshot", "deleted_at", "id", "proforma_id", "reference", "status", "total", "type", "updated_at", "updated_by", "user_id", "workspace_id") SELECT "appointment_id", "client_id", "created_at", "created_by", "customer_address_snapshot", "customer_billing_address_snapshot", "customer_email_snapshot", "customer_name_snapshot", "customer_phone_snapshot", "customer_registration_number_snapshot", "customer_vat_number_snapshot", "deleted_at", "id", "proforma_id", "reference", "status", "total", "type", "updated_at", "updated_by", "user_id", "workspace_id" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE INDEX "Invoice_workspace_id_idx" ON "Invoice"("workspace_id");
CREATE INDEX "Invoice_workspace_id_status_idx" ON "Invoice"("workspace_id", "status");
CREATE INDEX "Invoice_client_id_idx" ON "Invoice"("client_id");
CREATE INDEX "Invoice_original_invoice_id_idx" ON "Invoice"("original_invoice_id");
CREATE INDEX "Invoice_created_at_idx" ON "Invoice"("created_at");
CREATE UNIQUE INDEX "Invoice_workspace_id_reference_key" ON "Invoice"("workspace_id", "reference");
CREATE UNIQUE INDEX "Invoice_workspace_id_proforma_id_key" ON "Invoice"("workspace_id", "proforma_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
