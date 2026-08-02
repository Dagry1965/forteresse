-- CreateTable
CREATE TABLE "CashRegister" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "opening_amount" REAL NOT NULL,
    "expected_amount" REAL,
    "closing_amount" REAL,
    "difference" REAL,
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

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "refunded_amount" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_Payment" ("amount", "client_id", "created_at", "deleted_at", "id", "invoice_id", "method", "notes", "paid_at", "reference", "updated_at", "user_id", "workspace_id") SELECT "amount", "client_id", "created_at", "deleted_at", "id", "invoice_id", "method", "notes", "paid_at", "reference", "updated_at", "user_id", "workspace_id" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_workspace_id_idx" ON "Payment"("workspace_id");
CREATE INDEX "Payment_workspace_id_status_idx" ON "Payment"("workspace_id", "status");
CREATE INDEX "Payment_invoice_id_idx" ON "Payment"("invoice_id");
CREATE INDEX "Payment_client_id_idx" ON "Payment"("client_id");
CREATE INDEX "Payment_cash_register_id_idx" ON "Payment"("cash_register_id");
CREATE INDEX "Payment_paid_at_idx" ON "Payment"("paid_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CashRegister_workspace_id_idx" ON "CashRegister"("workspace_id");

-- CreateIndex
CREATE INDEX "CashRegister_workspace_id_status_idx" ON "CashRegister"("workspace_id", "status");

-- Une seule caisse ouverte par workspace
CREATE UNIQUE INDEX "CashRegister_one_open_per_workspace"
ON "CashRegister"("workspace_id")
WHERE "status" = 'OPEN';

-- CreateIndex
CREATE INDEX "CashRegister_opened_by_idx" ON "CashRegister"("opened_by");

-- CreateIndex
CREATE INDEX "CashRegister_closed_by_idx" ON "CashRegister"("closed_by");

-- CreateIndex
CREATE INDEX "CashRegister_opened_at_idx" ON "CashRegister"("opened_at");

-- CreateIndex
CREATE INDEX "CashMovement_workspace_id_idx" ON "CashMovement"("workspace_id");

-- CreateIndex
CREATE INDEX "CashMovement_cash_register_id_idx" ON "CashMovement"("cash_register_id");

-- CreateIndex
CREATE INDEX "CashMovement_payment_id_idx" ON "CashMovement"("payment_id");

-- CreateIndex
CREATE INDEX "CashMovement_user_id_idx" ON "CashMovement"("user_id");

-- CreateIndex
CREATE INDEX "CashMovement_created_at_idx" ON "CashMovement"("created_at");
