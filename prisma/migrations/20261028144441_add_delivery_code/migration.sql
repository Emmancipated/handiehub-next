-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryCode" VARCHAR(12),
ADD COLUMN     "deliveryCodeAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryCodeExpiresAt" TIMESTAMP(3);
