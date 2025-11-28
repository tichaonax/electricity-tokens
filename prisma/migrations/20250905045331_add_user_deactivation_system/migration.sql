-- User Deactivation System Migration v0.2.0
-- Adds the ability to deactivate/disable user logins with reason tracking
-- RERUNNABLE: Safe to execute multiple times without issues
-- All existing users will remain active by default

-- Add user deactivation columns (only if they don't already exist)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivatedBy" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivationReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create performance index for filtering active users (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive");
