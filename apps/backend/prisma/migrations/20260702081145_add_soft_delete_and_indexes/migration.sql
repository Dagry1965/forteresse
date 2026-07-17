-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "Proforma" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "StockItem" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "deleted_at" DATETIME;

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN "deleted_at" DATETIME;

-- CreateIndex
CREATE INDEX "Appointment_workspace_id_idx" ON "Appointment"("workspace_id");

-- CreateIndex
CREATE INDEX "Appointment_workspace_id_status_idx" ON "Appointment"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "Appointment_workspace_id_date_idx" ON "Appointment"("workspace_id", "date");

-- CreateIndex
CREATE INDEX "Appointment_client_id_idx" ON "Appointment"("client_id");

-- CreateIndex
CREATE INDEX "Appointment_vehicle_id_idx" ON "Appointment"("vehicle_id");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entity_id_idx" ON "AuditLog"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- CreateIndex
CREATE INDEX "Client_workspace_id_idx" ON "Client"("workspace_id");

-- CreateIndex
CREATE INDEX "Client_workspace_id_type_idx" ON "Client"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Intervention_workspace_id_idx" ON "Intervention"("workspace_id");

-- CreateIndex
CREATE INDEX "Intervention_appointment_id_idx" ON "Intervention"("appointment_id");

-- CreateIndex
CREATE INDEX "InterventionPart_intervention_id_idx" ON "InterventionPart"("intervention_id");

-- CreateIndex
CREATE INDEX "InterventionPart_item_id_idx" ON "InterventionPart"("item_id");

-- CreateIndex
CREATE INDEX "Inventory_workspace_id_idx" ON "Inventory"("workspace_id");

-- CreateIndex
CREATE INDEX "InventoryItem_inventory_id_idx" ON "InventoryItem"("inventory_id");

-- CreateIndex
CREATE INDEX "InventoryItem_item_id_idx" ON "InventoryItem"("item_id");

-- CreateIndex
CREATE INDEX "Invoice_workspace_id_idx" ON "Invoice"("workspace_id");

-- CreateIndex
CREATE INDEX "Invoice_workspace_id_status_idx" ON "Invoice"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "Invoice_client_id_idx" ON "Invoice"("client_id");

-- CreateIndex
CREATE INDEX "Invoice_created_at_idx" ON "Invoice"("created_at");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoice_id_idx" ON "InvoicePayment"("invoice_id");

-- CreateIndex
CREATE INDEX "Payment_workspace_id_idx" ON "Payment"("workspace_id");

-- CreateIndex
CREATE INDEX "Payment_invoice_id_idx" ON "Payment"("invoice_id");

-- CreateIndex
CREATE INDEX "Proforma_workspace_id_idx" ON "Proforma"("workspace_id");

-- CreateIndex
CREATE INDEX "Proforma_appointment_id_idx" ON "Proforma"("appointment_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_workspace_id_idx" ON "PurchaseOrder"("workspace_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_workspace_id_status_idx" ON "PurchaseOrder"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplier_id_idx" ON "PurchaseOrder"("supplier_id");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchase_order_id_idx" ON "PurchaseOrderItem"("purchase_order_id");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_item_id_idx" ON "PurchaseOrderItem"("item_id");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_workspace_id_idx" ON "PurchaseReceipt"("workspace_id");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_purchase_order_id_idx" ON "PurchaseReceipt"("purchase_order_id");

-- CreateIndex
CREATE INDEX "RefreshToken_workspace_id_idx" ON "RefreshToken"("workspace_id");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");

-- CreateIndex
CREATE INDEX "StockCategory_workspace_id_idx" ON "StockCategory"("workspace_id");

-- CreateIndex
CREATE INDEX "StockItem_workspace_id_idx" ON "StockItem"("workspace_id");

-- CreateIndex
CREATE INDEX "StockItem_category_id_idx" ON "StockItem"("category_id");

-- CreateIndex
CREATE INDEX "StockItem_supplier_id_idx" ON "StockItem"("supplier_id");

-- CreateIndex
CREATE INDEX "StockMovement_workspace_id_idx" ON "StockMovement"("workspace_id");

-- CreateIndex
CREATE INDEX "StockMovement_item_id_idx" ON "StockMovement"("item_id");

-- CreateIndex
CREATE INDEX "StockReception_workspace_id_idx" ON "StockReception"("workspace_id");

-- CreateIndex
CREATE INDEX "StockReception_purchase_order_id_idx" ON "StockReception"("purchase_order_id");

-- CreateIndex
CREATE INDEX "Supplier_workspace_id_idx" ON "Supplier"("workspace_id");

-- CreateIndex
CREATE INDEX "TimeSlot_workspace_id_idx" ON "TimeSlot"("workspace_id");

-- CreateIndex
CREATE INDEX "TimeSlot_workspace_id_start_idx" ON "TimeSlot"("workspace_id", "start");

-- CreateIndex
CREATE INDEX "User_workspace_id_idx" ON "User"("workspace_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Vehicle_workspace_id_idx" ON "Vehicle"("workspace_id");

-- CreateIndex
CREATE INDEX "Vehicle_client_id_idx" ON "Vehicle"("client_id");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspace_id_idx" ON "WorkspaceMember"("workspace_id");
