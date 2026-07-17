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
    "created_by" TEXT,
    "updated_by" TEXT,
    "workspace_id" TEXT NOT NULL,
    "proforma_id" TEXT,
    "appointment_id" TEXT,
    "user_id" TEXT,
    "client_id" TEXT,
    CONSTRAINT "Invoice_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "Proforma" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("appointment_id", "client_id", "created_at", "created_by", "deleted_at", "id", "proforma_id", "reference", "status", "total", "updated_at", "updated_by", "user_id", "workspace_id") SELECT "appointment_id", "client_id", "created_at", "created_by", "deleted_at", "id", "proforma_id", "reference", "status", "total", "updated_at", "updated_by", "user_id", "workspace_id" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE INDEX "Invoice_workspace_id_idx" ON "Invoice"("workspace_id");
CREATE INDEX "Invoice_workspace_id_status_idx" ON "Invoice"("workspace_id", "status");
CREATE INDEX "Invoice_client_id_idx" ON "Invoice"("client_id");
CREATE INDEX "Invoice_created_at_idx" ON "Invoice"("created_at");
CREATE TABLE "new_TimeSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "TimeSlot_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TimeSlot" ("created_at", "end", "id", "start", "updated_at", "workspace_id") SELECT "created_at", "end", "id", "start", "updated_at", "workspace_id" FROM "TimeSlot";
DROP TABLE "TimeSlot";
ALTER TABLE "new_TimeSlot" RENAME TO "TimeSlot";
CREATE INDEX "TimeSlot_workspace_id_idx" ON "TimeSlot"("workspace_id");
CREATE INDEX "TimeSlot_workspace_id_start_idx" ON "TimeSlot"("workspace_id", "start");
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    CONSTRAINT "Vehicle_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "client_id", "created_at", "deleted_at", "id", "model", "registration", "updated_at", "workspace_id") SELECT "brand", "client_id", "created_at", "deleted_at", "id", "model", "registration", "updated_at", "workspace_id" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE INDEX "Vehicle_workspace_id_idx" ON "Vehicle"("workspace_id");
CREATE INDEX "Vehicle_client_id_idx" ON "Vehicle"("client_id");
CREATE TABLE "new_WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "WorkspaceMember_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkspaceMember" ("created_at", "deleted_at", "id", "role", "updated_at", "user_id", "workspace_id") SELECT "created_at", "deleted_at", "id", "role", "updated_at", "user_id", "workspace_id" FROM "WorkspaceMember";
DROP TABLE "WorkspaceMember";
ALTER TABLE "new_WorkspaceMember" RENAME TO "WorkspaceMember";
CREATE INDEX "WorkspaceMember_workspace_id_idx" ON "WorkspaceMember"("workspace_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
