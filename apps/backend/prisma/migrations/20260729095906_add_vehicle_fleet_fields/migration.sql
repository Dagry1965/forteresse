-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "cost_center" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "fleet_number" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "mileage" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN "service_name" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "usual_driver" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "vin" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "year" INTEGER;

-- CreateIndex
CREATE INDEX "Vehicle_workspace_id_registration_idx" ON "Vehicle"("workspace_id", "registration");

-- CreateIndex
CREATE INDEX "Vehicle_workspace_id_fleet_number_idx" ON "Vehicle"("workspace_id", "fleet_number");

-- CreateIndex
CREATE INDEX "Vehicle_workspace_id_vin_idx" ON "Vehicle"("workspace_id", "vin");
