/*
  Warnings:

  - A unique constraint covering the columns `[workspace_id,email_normalized]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,phone_normalized]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,registration_normalized]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspace_id,vin_normalized]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN "email_normalized" TEXT;
ALTER TABLE "Client" ADD COLUMN "phone_normalized" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "registration_normalized" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "vin_normalized" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_workspace_id_email_normalized_key" ON "Client"("workspace_id", "email_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "Client_workspace_id_phone_normalized_key" ON "Client"("workspace_id", "phone_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_workspace_id_registration_normalized_key" ON "Vehicle"("workspace_id", "registration_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_workspace_id_vin_normalized_key" ON "Vehicle"("workspace_id", "vin_normalized");
