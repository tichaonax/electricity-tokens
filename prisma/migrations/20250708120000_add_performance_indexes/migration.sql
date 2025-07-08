-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenPurchase_purchaseDate_idx" ON "token_purchases" ("purchaseDate" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenPurchase_creator_name_idx" ON "token_purchases" ("createdBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenPurchase_isEmergency_idx" ON "token_purchases" ("isEmergency");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenPurchase_date_range_idx" ON "token_purchases" ("purchaseDate" DESC, "isEmergency", "createdBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TokenPurchase_tokens_payment_idx" ON "token_purchases" ("totalTokens", "totalPayment");