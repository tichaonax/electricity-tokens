-- Database Performance Optimization Indexes
-- Run these SQL commands to improve query performance for the purchase history page

-- Index for creator name search (case-insensitive)
CREATE INDEX IF NOT EXISTS "TokenPurchase_creator_name_idx" ON "TokenPurchase" USING gin ("createdBy", lower("User"."name"));

-- Index for purchase date sorting (most common sort)
CREATE INDEX IF NOT EXISTS "TokenPurchase_purchaseDate_idx" ON "TokenPurchase" ("purchaseDate" DESC);

-- Index for emergency filter
CREATE INDEX IF NOT EXISTS "TokenPurchase_isEmergency_idx" ON "TokenPurchase" ("isEmergency");

-- Composite index for date range queries with sorting
CREATE INDEX IF NOT EXISTS "TokenPurchase_date_range_idx" ON "TokenPurchase" ("purchaseDate" DESC, "isEmergency", "createdBy");

-- Index to optimize finding purchases without contributions (sequential logic)
CREATE INDEX IF NOT EXISTS "TokenPurchase_contribution_null_idx" ON "TokenPurchase" ("contributionId", "purchaseDate") WHERE "contributionId" IS NULL;

-- Index for total tokens and payment sorting
CREATE INDEX IF NOT EXISTS "TokenPurchase_tokens_payment_idx" ON "TokenPurchase" ("totalTokens", "totalPayment");

-- Note: These indexes should be created during a maintenance window
-- Monitor database performance after adding these indexes
-- Consider removing unused indexes if they don't improve performance