/*
  Warnings:

  - You are about to alter the column `amount` on the `CashMovement` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `closing_amount` on the `CashRegister` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `difference` on the `CashRegister` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `expected_amount` on the `CashRegister` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `opening_amount` on the `CashRegister` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `credit_limit` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price_snapshot` on the `InterventionPart` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `refunded_amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `amount` on the `PaymentSchedule` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `total` on the `Proforma` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price_buy` on the `PurchaseOrderItem` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price_buy` on the `StockItem` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price_sell` on the `StockItem` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspace_id" TEXT NOT NULL,
    "cash_register_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "CashMovement_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "CashRegister" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CashMovement" ("amount", "cash_register_id", "created_at", "id", "method", "notes", "payment_id", "reference", "type", "user_id", "workspace_id") SELECT "amount", "cash_register_id", "created_at", "id", "method", "notes", "payment_id", "reference", "type", "user_id", "workspace_id" FROM "CashMovement";
DROP TABLE "CashMovement";
ALTER TABLE "new_CashMovement" RENAME TO "CashMovement";
CREATE INDEX "CashMovement_workspace_id_idx" ON "CashMovement"("workspace_id");
CREATE INDEX "CashMovement_cash_register_id_idx" ON "CashMovement"("cash_register_id");
CREATE INDEX "CashMovement_payment_id_idx" ON "CashMovement"("payment_id");
CREATE INDEX "CashMovement_user_id_idx" ON "CashMovement"("user_id");
CREATE INDEX "CashMovement_created_at_idx" ON "CashMovement"("created_at");
CREATE TABLE "new_CashRegister" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "opening_amount" DECIMAL NOT NULL,
    "expected_amount" DECIMAL,
    "closing_amount" DECIMAL,
    "difference" DECIMAL,
    "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    "opening_notes" TEXT,
    "closing_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    CONSTRAINT "CashRegister_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashRegister_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashRegister_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CashRegister" ("closed_at", "closed_by", "closing_amount", "closing_notes", "created_at", "difference", "expected_amount", "id", "opened_at", "opened_by", "opening_amount", "opening_notes", "status", "updated_at", "workspace_id") SELECT "closed_at", "closed_by", "closing_amount", "closing_notes", "created_at", "difference", "expected_amount", "id", "opened_at", "opened_by", "opening_amount", "opening_notes", "status", "updated_at", "workspace_id" FROM "CashRegister";
DROP TABLE "CashRegister";
ALTER TABLE "new_CashRegister" RENAME TO "CashRegister";
CREATE INDEX "CashRegister_workspace_id_idx" ON "CashRegister"("workspace_id");
CREATE INDEX "CashRegister_workspace_id_status_idx" ON "CashRegister"("workspace_id", "status");
CREATE INDEX "CashRegister_opened_by_idx" ON "CashRegister"("opened_by");
CREATE INDEX "CashRegister_closed_by_idx" ON "CashRegister"("closed_by");
CREATE INDEX "CashRegister_opened_at_idx" ON "CashRegister"("opened_at");
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_normalized" TEXT,
    "email" TEXT NOT NULL,
    "email_normalized" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "company_name" TEXT,
    "trade_name" TEXT,
    "registration_number" TEXT,
    "vat_number" TEXT,
    "address" TEXT,
    "billing_address" TEXT,
    "payment_terms_days" INTEGER NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "Client_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "billing_address", "company_name", "created_at", "credit_limit", "deleted_at", "email", "email_normalized", "id", "name", "payment_terms_days", "phone", "phone_normalized", "registration_number", "trade_name", "type", "updated_at", "vat_number", "workspace_id") SELECT "address", "billing_address", "company_name", "created_at", "credit_limit", "deleted_at", "email", "email_normalized", "id", "name", "payment_terms_days", "phone", "phone_normalized", "registration_number", "trade_name", "type", "updated_at", "vat_number", "workspace_id" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_workspace_id_idx" ON "Client"("workspace_id");
CREATE INDEX "Client_workspace_id_type_idx" ON "Client"("workspace_id", "type");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_registration_number_idx" ON "Client"("registration_number");
CREATE INDEX "Client_vat_number_idx" ON "Client"("vat_number");
CREATE UNIQUE INDEX "Client_workspace_id_email_normalized_key" ON "Client"("workspace_id", "email_normalized");
CREATE UNIQUE INDEX "Client_workspace_id_phone_normalized_key" ON "Client"("workspace_id", "phone_normalized");
CREATE TABLE "new_InterventionPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervention_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_snapshot" DECIMAL NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "InterventionPart_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "Intervention" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterventionPart_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterventionPart" ("deleted_at", "id", "intervention_id", "item_id", "price_snapshot", "quantity") SELECT "deleted_at", "id", "intervention_id", "item_id", "price_snapshot", "quantity" FROM "InterventionPart";
DROP TABLE "InterventionPart";
ALTER TABLE "new_InterventionPart" RENAME TO "InterventionPart";
CREATE INDEX "InterventionPart_intervention_id_idx" ON "InterventionPart"("intervention_id");
CREATE INDEX "InterventionPart_item_id_idx" ON "InterventionPart"("item_id");
CREATE INDEX "InterventionPart_deleted_at_idx" ON "InterventionPart"("deleted_at");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "total" DECIMAL NOT NULL,
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
INSERT INTO "new_Invoice" ("appointment_id", "client_id", "created_at", "created_by", "customer_address_snapshot", "customer_billing_address_snapshot", "customer_email_snapshot", "customer_name_snapshot", "customer_phone_snapshot", "customer_registration_number_snapshot", "customer_vat_number_snapshot", "deleted_at", "id", "original_invoice_id", "proforma_id", "reference", "status", "total", "type", "updated_at", "updated_by", "user_id", "workspace_id") SELECT "appointment_id", "client_id", "created_at", "created_by", "customer_address_snapshot", "customer_billing_address_snapshot", "customer_email_snapshot", "customer_name_snapshot", "customer_phone_snapshot", "customer_registration_number_snapshot", "customer_vat_number_snapshot", "deleted_at", "id", "original_invoice_id", "proforma_id", "reference", "status", "total", "type", "updated_at", "updated_by", "user_id", "workspace_id" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE INDEX "Invoice_workspace_id_idx" ON "Invoice"("workspace_id");
CREATE INDEX "Invoice_workspace_id_status_idx" ON "Invoice"("workspace_id", "status");
CREATE INDEX "Invoice_client_id_idx" ON "Invoice"("client_id");
CREATE INDEX "Invoice_original_invoice_id_idx" ON "Invoice"("original_invoice_id");
CREATE INDEX "Invoice_created_at_idx" ON "Invoice"("created_at");
CREATE UNIQUE INDEX "Invoice_workspace_id_reference_key" ON "Invoice"("workspace_id", "reference");
CREATE UNIQUE INDEX "Invoice_workspace_id_proforma_id_key" ON "Invoice"("workspace_id", "proforma_id");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "refunded_amount" DECIMAL NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "paid_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" DATETIME,
    "refunded_at" DATETIME,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cash_register_id" TEXT,
    CONSTRAINT "Payment_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "CashRegister" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "cancelled_at", "cash_register_id", "client_id", "created_at", "deleted_at", "id", "invoice_id", "method", "notes", "paid_at", "reference", "refunded_amount", "refunded_at", "status", "updated_at", "user_id", "workspace_id") SELECT "amount", "cancelled_at", "cash_register_id", "client_id", "created_at", "deleted_at", "id", "invoice_id", "method", "notes", "paid_at", "reference", "refunded_amount", "refunded_at", "status", "updated_at", "user_id", "workspace_id" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_workspace_id_idx" ON "Payment"("workspace_id");
CREATE INDEX "Payment_workspace_id_status_idx" ON "Payment"("workspace_id", "status");
CREATE INDEX "Payment_invoice_id_idx" ON "Payment"("invoice_id");
CREATE INDEX "Payment_client_id_idx" ON "Payment"("client_id");
CREATE INDEX "Payment_cash_register_id_idx" ON "Payment"("cash_register_id");
CREATE INDEX "Payment_paid_at_idx" ON "Payment"("paid_at");
CREATE TABLE "new_PaymentSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "workspace_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PaymentSchedule_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentSchedule_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentSchedule" ("amount", "created_at", "due_date", "id", "invoice_id", "status", "updated_at", "workspace_id") SELECT "amount", "created_at", "due_date", "id", "invoice_id", "status", "updated_at", "workspace_id" FROM "PaymentSchedule";
DROP TABLE "PaymentSchedule";
ALTER TABLE "new_PaymentSchedule" RENAME TO "PaymentSchedule";
CREATE INDEX "PaymentSchedule_invoice_id_idx" ON "PaymentSchedule"("invoice_id");
CREATE INDEX "PaymentSchedule_workspace_id_idx" ON "PaymentSchedule"("workspace_id");
CREATE TABLE "new_Proforma" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
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
    "workspace_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "case_id" TEXT,
    CONSTRAINT "Proforma_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Proforma_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Proforma_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Proforma" ("appointment_id", "case_id", "created_at", "customer_address_snapshot", "customer_billing_address_snapshot", "customer_email_snapshot", "customer_name_snapshot", "customer_phone_snapshot", "customer_registration_number_snapshot", "customer_vat_number_snapshot", "deleted_at", "id", "reference", "status", "total", "updated_at", "workspace_id") SELECT "appointment_id", "case_id", "created_at", "customer_address_snapshot", "customer_billing_address_snapshot", "customer_email_snapshot", "customer_name_snapshot", "customer_phone_snapshot", "customer_registration_number_snapshot", "customer_vat_number_snapshot", "deleted_at", "id", "reference", "status", "total", "updated_at", "workspace_id" FROM "Proforma";
DROP TABLE "Proforma";
ALTER TABLE "new_Proforma" RENAME TO "Proforma";
CREATE INDEX "Proforma_workspace_id_idx" ON "Proforma"("workspace_id");
CREATE INDEX "Proforma_appointment_id_idx" ON "Proforma"("appointment_id");
CREATE UNIQUE INDEX "Proforma_workspace_id_reference_key" ON "Proforma"("workspace_id", "reference");
CREATE TABLE "new_PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "received_quantity" INTEGER NOT NULL DEFAULT 0,
    "price_buy" DECIMAL NOT NULL,
    CONSTRAINT "PurchaseOrderItem_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrderItem" ("id", "item_id", "price_buy", "purchase_order_id", "quantity", "received_quantity") SELECT "id", "item_id", "price_buy", "purchase_order_id", "quantity", "received_quantity" FROM "PurchaseOrderItem";
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
    "price_buy" DECIMAL NOT NULL,
    "price_sell" DECIMAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "workspace_id" TEXT NOT NULL,
    "deleted_at" DATETIME,
    "unit" TEXT NOT NULL DEFAULT 'unite',
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StockItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "StockCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockItem_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockItem_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StockItem" ("category_id", "deleted_at", "description", "id", "min_stock", "name", "price_buy", "price_sell", "quantity", "reference", "supplier_id", "unit", "workspace_id") SELECT "category_id", "deleted_at", "description", "id", "min_stock", "name", "price_buy", "price_sell", "quantity", "reference", "supplier_id", "unit", "workspace_id" FROM "StockItem";
DROP TABLE "StockItem";
ALTER TABLE "new_StockItem" RENAME TO "StockItem";
CREATE INDEX "StockItem_workspace_id_idx" ON "StockItem"("workspace_id");
CREATE INDEX "StockItem_category_id_idx" ON "StockItem"("category_id");
CREATE INDEX "StockItem_supplier_id_idx" ON "StockItem"("supplier_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
