-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "customer_address_snapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customer_billing_address_snapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customer_email_snapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customer_name_snapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customer_phone_snapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customer_registration_number_snapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customer_vat_number_snapshot" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "customer_address_snapshot" TEXT;
ALTER TABLE "User" ADD COLUMN "customer_billing_address_snapshot" TEXT;
ALTER TABLE "User" ADD COLUMN "customer_email_snapshot" TEXT;
ALTER TABLE "User" ADD COLUMN "customer_name_snapshot" TEXT;
ALTER TABLE "User" ADD COLUMN "customer_phone_snapshot" TEXT;
ALTER TABLE "User" ADD COLUMN "customer_registration_number_snapshot" TEXT;
ALTER TABLE "User" ADD COLUMN "customer_vat_number_snapshot" TEXT;
