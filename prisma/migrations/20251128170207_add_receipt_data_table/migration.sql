-- DropIndex (IF EXISTS to prevent errors on fresh installs)
DROP INDEX IF EXISTS "public"."TokenPurchase_creator_name_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."TokenPurchase_date_range_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."TokenPurchase_isEmergency_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."TokenPurchase_purchaseDate_idx";

-- DropIndex
DROP INDEX IF EXISTS "public"."TokenPurchase_tokens_payment_idx";

-- CreateTable
CREATE TABLE "receipt_data" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "tokenNumber" TEXT,
    "accountNumber" TEXT,
    "kwhPurchased" DOUBLE PRECISION NOT NULL,
    "energyCostZWG" DOUBLE PRECISION NOT NULL,
    "debtZWG" DOUBLE PRECISION NOT NULL,
    "reaZWG" DOUBLE PRECISION NOT NULL,
    "vatZWG" DOUBLE PRECISION NOT NULL,
    "totalAmountZWG" DOUBLE PRECISION NOT NULL,
    "tenderedZWG" DOUBLE PRECISION NOT NULL,
    "transactionDateTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipt_data_purchaseId_key" ON "receipt_data"("purchaseId");

-- CreateIndex
CREATE INDEX "receipt_data_purchaseId_idx" ON "receipt_data"("purchaseId");

-- AddForeignKey
ALTER TABLE "receipt_data" ADD CONSTRAINT "receipt_data_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "token_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
