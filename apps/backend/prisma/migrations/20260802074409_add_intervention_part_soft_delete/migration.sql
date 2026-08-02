-- AlterTable
ALTER TABLE "InterventionPart" ADD COLUMN "deleted_at" DATETIME;

-- CreateIndex
CREATE INDEX "InterventionPart_deleted_at_idx" ON "InterventionPart"("deleted_at");
