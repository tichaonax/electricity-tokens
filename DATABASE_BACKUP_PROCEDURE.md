# Database Backup and Rollback Procedure

## Overview

This document outlines the backup and rollback procedures for the Electricity Tokens database, specifically for the ReceiptData migration (ET-100 feature). These procedures ensure safe deployment with the ability to recover if issues arise.

---

## Pre-Migration Backup

### 1. Full Database Backup (Recommended)

**Using pg_dump (PostgreSQL):**

```bash
# Production backup with timestamp
pg_dump -h localhost -U postgres -d electricity_tokens \
  --format=custom \
  --file="backups/backup-$(date +%Y%m%d-%H%M%S).dump" \
  --verbose

# Alternative: Plain SQL format (human-readable)
pg_dump -h localhost -U postgres -d electricity_tokens \
  --format=plain \
  --file="backups/backup-$(date +%Y%m%d-%H%M%S).sql" \
  --verbose
```

**Using Prisma (Alternative):**

```bash
# Generate SQL dump of current schema
npx prisma db pull
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > backups/schema-$(date +%Y%m%d-%H%M%S).sql
```

**Backup Verification:**

```bash
# Check backup file size (should be > 0 bytes)
ls -lh backups/backup-*.dump

# For SQL format, verify content
head -n 50 backups/backup-*.sql
```

---

### 2. Specific Table Backup (Quick Recovery)

**Backup TokenPurchase table (parent of ReceiptData):**

```bash
pg_dump -h localhost -U postgres -d electricity_tokens \
  --table=token_purchases \
  --data-only \
  --file="backups/token_purchases-$(date +%Y%m%d-%H%M%S).sql"
```

**Backup existing ReceiptData (if table exists):**

```bash
# Check if table exists first
psql -h localhost -U postgres -d electricity_tokens \
  -c "\dt receipt_data"

# If exists, backup data
pg_dump -h localhost -U postgres -d electricity_tokens \
  --table=receipt_data \
  --data-only \
  --file="backups/receipt_data-$(date +%Y%m%d-%H%M%S).sql"
```

---

### 3. Backup Current Migrations State

**Save migration history:**

```bash
# Backup Prisma migrations folder
cp -r prisma/migrations "backups/migrations-$(date +%Y%m%d-%H%M%S)"

# Save current migration status
npx prisma migrate status > "backups/migration-status-$(date +%Y%m%d-%H%M%S).txt"
```

**Record database schema version:**

```bash
# PostgreSQL schema version
psql -h localhost -U postgres -d electricity_tokens \
  -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;" \
  > "backups/migration-history-$(date +%Y%m%d-%H%M%S).txt"
```

---

## ReceiptData Migration Details

### Database Schema Changes

**New Table: ReceiptData**

```sql
CREATE TABLE "ReceiptData" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT UNIQUE NOT NULL,
  "tokenNumber" TEXT,
  "accountNumber" TEXT,
  "kwhPurchased" DOUBLE PRECISION NOT NULL,
  "energyCostZWG" DOUBLE PRECISION NOT NULL,
  "debtZWG" DOUBLE PRECISION NOT NULL,
  "reaZWG" DOUBLE PRECISION NOT NULL,
  "vatZWG" DOUBLE PRECISION NOT NULL,
  "totalAmountZWG" DOUBLE PRECISION NOT NULL,
  "tenderedZWG" DOUBLE PRECISION NOT NULL,
  "transactionDateTime" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReceiptData_purchaseId_fkey" 
    FOREIGN KEY ("purchaseId") 
    REFERENCES "TokenPurchase"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ReceiptData_purchaseId_key" ON "ReceiptData"("purchaseId");
```

**Relationship:**
- **Parent Table:** `TokenPurchase` (existing)
- **Child Table:** `ReceiptData` (new)
- **Relationship:** One-to-One (each purchase can have ONE receipt)
- **Foreign Key:** `purchaseId` → `TokenPurchase.id`
- **Delete Behavior:** `ON DELETE CASCADE` (deleting purchase deletes receipt)

### CASCADE Delete Implications

**⚠️ CRITICAL UNDERSTANDING:**

When a `TokenPurchase` is deleted:
1. Associated `ReceiptData` record is **AUTOMATICALLY DELETED**
2. No orphaned receipt records will exist
3. **Cannot recover receipt data if purchase is deleted** (unless backup exists)

**Impact Analysis:**

| Action | TokenPurchase | ReceiptData | UserContribution |
|--------|---------------|-------------|------------------|
| DELETE TokenPurchase | ✅ Deleted | ✅ Auto-deleted (CASCADE) | ✅ Auto-deleted (CASCADE) |
| DELETE ReceiptData | ❌ Remains | ✅ Deleted | ❌ Remains |
| DELETE UserContribution | ❌ Remains | ❌ Remains | ✅ Deleted |

**Safety Recommendations:**

1. **Never delete TokenPurchase records in production** without backup
2. **Soft delete pattern:** Add `deletedAt` timestamp instead of hard delete
3. **Archive instead of delete:** Move old records to archive table
4. **Backup before bulk delete operations**

---

## Rollback Procedures

### Scenario 1: Migration Failed (Error During Apply)

**If migration fails mid-execution:**

```bash
# Step 1: Check migration status
npx prisma migrate status

# Step 2: Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Step 3: Verify database state
psql -h localhost -U postgres -d electricity_tokens \
  -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;"

# Step 4: Drop ReceiptData table if partially created
psql -h localhost -U postgres -d electricity_tokens \
  -c "DROP TABLE IF EXISTS \"ReceiptData\" CASCADE;"

# Step 5: Restore from backup (if needed)
pg_restore -h localhost -U postgres -d electricity_tokens \
  --clean --if-exists \
  --verbose \
  backups/backup-<timestamp>.dump
```

---

### Scenario 2: Migration Succeeded but Application Errors

**If migration applied but application has runtime errors:**

```bash
# Step 1: Stop application
pm2 stop electricity-tokens
# or
systemctl stop electricity-tokens

# Step 2: Create emergency backup of current state
pg_dump -h localhost -U postgres -d electricity_tokens \
  --format=custom \
  --file="backups/emergency-backup-$(date +%Y%m%d-%H%M%S).dump"

# Step 3: Option A - Drop ReceiptData table (keep existing data)
psql -h localhost -U postgres -d electricity_tokens << EOF
-- Remove foreign key constraint first
ALTER TABLE "ReceiptData" DROP CONSTRAINT IF EXISTS "ReceiptData_purchaseId_fkey";

-- Drop table
DROP TABLE IF EXISTS "ReceiptData" CASCADE;

-- Mark migration as rolled back in Prisma
DELETE FROM "_prisma_migrations" 
WHERE migration_name LIKE '%receipt_data%'
ORDER BY finished_at DESC LIMIT 1;
EOF

# Step 4: Option B - Full database restore from pre-migration backup
pg_restore -h localhost -U postgres -d electricity_tokens \
  --clean --if-exists \
  backups/backup-<pre-migration-timestamp>.dump

# Step 5: Restart application with old code version
git checkout <previous-commit-hash>
npm install
npm run build
pm2 start ecosystem.config.js
```

---

### Scenario 3: Data Corruption in ReceiptData

**If receipt data is corrupted but purchases are intact:**

```bash
# Step 1: Backup current state
pg_dump -h localhost -U postgres -d electricity_tokens \
  --table=receipt_data \
  --data-only \
  --file="backups/corrupted-receipt-data-$(date +%Y%m%d-%H%M%S).sql"

# Step 2: Clear corrupted receipt data
psql -h localhost -U postgres -d electricity_tokens << EOF
-- Count records before deletion
SELECT COUNT(*) AS total_receipts FROM "ReceiptData";

-- Delete all receipt data (preserves table structure)
TRUNCATE TABLE "ReceiptData" CASCADE;

-- Verify deletion
SELECT COUNT(*) AS remaining_receipts FROM "ReceiptData";
EOF

# Step 3: Restore from pre-corruption backup
psql -h localhost -U postgres -d electricity_tokens \
  < backups/receipt_data-<clean-backup-timestamp>.sql

# Step 4: Verify restoration
psql -h localhost -U postgres -d electricity_tokens << EOF
SELECT 
  COUNT(*) AS total_receipts,
  MIN("transactionDateTime") AS earliest_receipt,
  MAX("transactionDateTime") AS latest_receipt,
  SUM("totalAmountZWG") AS total_zwg_amount
FROM "ReceiptData";
EOF
```

---

### Scenario 4: Need to Revert to Pre-ReceiptData State

**Complete rollback to before ET-100 feature:**

```bash
# Step 1: Full backup of current state (safety)
pg_dump -h localhost -U postgres -d electricity_tokens \
  --format=custom \
  --file="backups/pre-rollback-$(date +%Y%m%d-%H%M%S).dump"

# Step 2: Restore from pre-migration backup
pg_restore -h localhost -U postgres -d electricity_tokens \
  --clean --if-exists \
  --verbose \
  backups/backup-<pre-migration-timestamp>.dump

# Step 3: Reset Prisma migrations
rm -rf prisma/migrations/<receipt-data-migration-folder>
npx prisma migrate resolve --rolled-back <migration_name>

# Step 4: Regenerate Prisma client from old schema
git checkout <pre-ET-100-commit> -- prisma/schema.prisma
npx prisma generate

# Step 5: Rebuild application
npm run build

# Step 6: Restart application
pm2 restart electricity-tokens
```

---

## Testing Backup and Restore

### Pre-Deployment Test Procedure

**1. Create test backup:**

```bash
# Backup current development database
pg_dump -h localhost -U postgres -d electricity_tokens \
  --format=custom \
  --file="backups/test-backup-$(date +%Y%m%d-%H%M%S).dump"
```

**2. Create test database:**

```bash
# Create test restore database
psql -h localhost -U postgres << EOF
DROP DATABASE IF EXISTS electricity_tokens_test;
CREATE DATABASE electricity_tokens_test;
EOF
```

**3. Test restore:**

```bash
# Restore to test database
pg_restore -h localhost -U postgres -d electricity_tokens_test \
  --clean --if-exists \
  --verbose \
  backups/test-backup-*.dump
```

**4. Verify restoration:**

```bash
# Compare table counts
psql -h localhost -U postgres << EOF
-- Original database
\c electricity_tokens
SELECT 
  'electricity_tokens' AS database,
  (SELECT COUNT(*) FROM "TokenPurchase") AS purchases,
  (SELECT COUNT(*) FROM "User") AS users;

-- Test database
\c electricity_tokens_test
SELECT 
  'electricity_tokens_test' AS database,
  (SELECT COUNT(*) FROM "TokenPurchase") AS purchases,
  (SELECT COUNT(*) FROM "User") AS users;
EOF
```

**5. Cleanup test database:**

```bash
psql -h localhost -U postgres -c "DROP DATABASE electricity_tokens_test;"
```

---

## Backup Storage Recommendations

### Local Backups

```bash
# Create backups directory structure
mkdir -p backups/{daily,weekly,pre-migration,emergency}

# Set proper permissions (Linux/Mac)
chmod 700 backups
chmod 600 backups/*.dump
```

### Automated Daily Backups (Cron Job)

**Linux/Mac crontab:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/electricity-tokens && pg_dump -h localhost -U postgres -d electricity_tokens --format=custom --file="backups/daily/backup-$(date +\%Y\%m\%d).dump" 2>&1 | logger -t db-backup

# Weekly backup on Sundays at 3 AM
0 3 * * 0 cd /path/to/electricity-tokens && pg_dump -h localhost -U postgres -d electricity_tokens --format=custom --file="backups/weekly/backup-$(date +\%Y\%m\%d).dump" 2>&1 | logger -t db-backup-weekly
```

**Windows Task Scheduler:**

```powershell
# Create PowerShell backup script: backup-db.ps1
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = "backups\daily\backup-$timestamp.dump"

& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" `
  -h localhost -U postgres -d electricity_tokens `
  --format=custom `
  --file=$backupFile

# Schedule with Task Scheduler
# Action: Start a program
# Program: powershell.exe
# Arguments: -File "C:\electricity-app\electricity-tokens\backup-db.ps1"
# Trigger: Daily at 2:00 AM
```

### Backup Retention Policy

```bash
# Keep backups for:
# - Daily backups: 7 days
# - Weekly backups: 4 weeks
# - Pre-migration backups: 90 days (permanent)
# - Emergency backups: Manual review

# Cleanup script (Linux/Mac)
#!/bin/bash
# cleanup-old-backups.sh

# Remove daily backups older than 7 days
find backups/daily -name "backup-*.dump" -mtime +7 -delete

# Remove weekly backups older than 28 days
find backups/weekly -name "backup-*.dump" -mtime +28 -delete

# List pre-migration backups (manual review)
echo "Pre-migration backups (review manually):"
ls -lh backups/pre-migration/
```

---

## Deployment Checklist

### Before Migration

- [ ] **Full database backup completed**
  ```bash
  ls -lh backups/backup-<timestamp>.dump
  ```

- [ ] **Backup verified (non-zero size)**
  ```bash
  stat backups/backup-<timestamp>.dump
  ```

- [ ] **Test restore completed successfully**
  ```bash
  # Tested on separate database
  ```

- [ ] **Current migration state recorded**
  ```bash
  npx prisma migrate status > backups/pre-migration-status.txt
  ```

- [ ] **Database connection string confirmed**
  ```bash
  echo $DATABASE_URL | grep -o "^[^:]*://[^@]*@[^/]*"
  ```

- [ ] **Rollback procedure reviewed and understood**

- [ ] **Team notified of deployment window**

### During Migration

- [ ] **Application stopped (zero downtime not possible)**
  ```bash
  pm2 stop all
  ```

- [ ] **Migration applied**
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Migration status verified**
  ```bash
  npx prisma migrate status
  ```

- [ ] **New table exists**
  ```bash
  psql -h localhost -U postgres -d electricity_tokens -c "\dt ReceiptData"
  ```

### After Migration

- [ ] **Application restarted successfully**
  ```bash
  pm2 start all
  pm2 status
  ```

- [ ] **Health check passed**
  ```bash
  curl http://localhost:3000/api/health
  ```

- [ ] **Basic CRUD operations tested**
  - Create receipt data
  - Read receipt data
  - Update receipt data
  - Delete receipt data

- [ ] **No errors in application logs**
  ```bash
  pm2 logs --lines 100 | grep -i error
  ```

- [ ] **Post-migration backup created**
  ```bash
  pg_dump -h localhost -U postgres -d electricity_tokens \
    --format=custom \
    --file="backups/post-migration-$(date +%Y%m%d-%H%M%S).dump"
  ```

---

## Emergency Contacts

**Database Issues:**
- Database Administrator: [contact info]
- DevOps Lead: [contact info]

**Application Issues:**
- Lead Developer: [contact info]
- On-call Engineer: [contact info]

**Escalation Path:**
1. Attempt automated rollback (see procedures above)
2. Contact Database Administrator
3. If critical: Restore from last known good backup
4. Notify team leads
5. Post-mortem after resolution

---

## Additional Resources

**PostgreSQL Documentation:**
- pg_dump: https://www.postgresql.org/docs/current/app-pgdump.html
- pg_restore: https://www.postgresql.org/docs/current/app-pgrestore.html

**Prisma Documentation:**
- Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Troubleshooting: https://www.prisma.io/docs/guides/migrate/troubleshooting

**Project Documentation:**
- DATABASE_SCHEMA.md - Full schema documentation
- DEPLOYMENT.md - Deployment procedures
- DISASTER_RECOVERY.md - Disaster recovery plans

---

## Document Version

- **Version:** 1.0
- **Created:** 2025-11-08
- **Last Updated:** 2025-11-08
- **Maintainer:** Development Team
- **Review Schedule:** Quarterly or after major migrations
