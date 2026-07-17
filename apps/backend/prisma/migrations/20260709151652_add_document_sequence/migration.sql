-- CreateTable
CREATE TABLE "ProformaLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proforma_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL NOT NULL DEFAULT 1,
    "unit_price" DECIMAL NOT NULL,
    "vat_rate" DECIMAL NOT NULL,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProformaLine_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "Proforma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL NOT NULL,
    "unit_price" DECIMAL NOT NULL,
    "vat_rate" DECIMAL NOT NULL,
    "discount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceLine_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "DocumentSequence_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProformaLine_proforma_id_idx" ON "ProformaLine"("proforma_id");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoice_id_idx" ON "InvoiceLine"("invoice_id");

-- CreateIndex
CREATE INDEX "DocumentSequence_workspace_id_idx" ON "DocumentSequence"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_workspace_id_document_type_year_key" ON "DocumentSequence"("workspace_id", "document_type", "year");
