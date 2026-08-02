/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,proforma_id]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_workspace_id_proforma_id_key" ON "Invoice"("workspace_id", "proforma_id");
