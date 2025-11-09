# Staging Deployment Guide - ET-100 ReceiptData Migration

## Overview

This guide covers deploying the ET-100 feature (ReceiptData migration) to a staging environment for testing before production deployment.

**Current Status:** Ready for staging deployment  
**Migration:** ReceiptData table (One-to-One with TokenPurchase)  
**Date:** 2025-11-08

---

## Prerequisites

### 1. Staging Environment Requirements

**Staging Server:**
- Node.js 18+ installed
- PostgreSQL 12+ installed
- Git installed
- Sufficient disk space (5GB+ recommended)

**Staging Database:**
- Separate database from production: `electricity_tokens_staging`
- Same PostgreSQL version as production (or newer)
- Database user with full permissions

**Network Access:**
- Staging server accessible via SSH or RDP
- Database port accessible from staging server
- (Optional) Staging URL for testing web interface

---

## Step 1: Environment Setup

### Create Staging Environment File

Create `.env.staging` in project root:

```bash
# Database - Staging Database (CRITICAL: Not production!)
DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/electricity_tokens_staging"

# NextAuth.js
NEXTAUTH_SECRET="staging-secret-different-from-production-2025"
# Note: NEXTAUTH_URL auto-detected from request headers

# App Configuration
NODE_ENV="staging"
APP_NAME="Electricity Tokens Tracker (STAGING)"
ADMIN_EMAIL="staging-admin@example.com"

# Optional: Email testing
EMAIL_FROM="staging-noreply@example.com"
EMAIL_SERVER="smtp://staging-smtp-server"

# Feature Flags (for staging-specific testing)
ENABLE_DEBUG_LOGS="true"
ENABLE_VERBOSE_ERRORS="true"
```

**⚠️ CRITICAL CHECKS:**

```bash
# Verify DATABASE_URL points to STAGING database
cat .env.staging | grep DATABASE_URL
# Should output: electricity_tokens_staging (NOT production DB!)

# Verify NEXTAUTH_SECRET is different from production
# Never use production secrets in staging!
```

---

## Step 2: Staging Database Setup

### Create Staging Database

**Option A: From Production Backup (Recommended for realistic testing)**

```bash
# Step 1: Backup production database (on production server)
pg_dump -h production-host -U postgres -d electricity_tokens \
  --format=custom \
  --file="production-backup-for-staging.dump" \
  --verbose

# Step 2: Transfer backup to staging server
scp production-backup-for-staging.dump staging-server:/path/to/backups/

# Step 3: Create staging database (on staging server)
psql -h localhost -U postgres << EOF
DROP DATABASE IF EXISTS electricity_tokens_staging;
CREATE DATABASE electricity_tokens_staging;
EOF

# Step 4: Restore production data to staging
pg_restore -h localhost -U postgres -d electricity_tokens_staging \
  --clean --if-exists \
  --verbose \
  production-backup-for-staging.dump

# Step 5: Verify restoration
psql -h localhost -U postgres -d electricity_tokens_staging << EOF
SELECT 
  (SELECT COUNT(*) FROM "User") AS users,
  (SELECT COUNT(*) FROM "TokenPurchase") AS purchases,
  (SELECT COUNT(*) FROM "UserContribution") AS contributions;
EOF
```

**Option B: Fresh Staging Database (Clean slate)**

```bash
# Create new staging database
psql -h localhost -U postgres << EOF
DROP DATABASE IF EXISTS electricity_tokens_staging;
CREATE DATABASE electricity_tokens_staging;
EOF

# Run Prisma migrations (before ET-100)
# This will create all tables EXCEPT ReceiptData
DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/electricity_tokens_staging" \
  npx prisma migrate deploy

# Seed with test data (optional)
DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/electricity_tokens_staging" \
  npm run db:seed
```

---

## Step 3: Pre-Deployment Backup

**⚠️ CRITICAL: Always backup before migration!**

```bash
# Windows PowerShell
$env:DB_NAME = "electricity_tokens_staging"
$env:DB_USER = "staging_user"
.\scripts\backup-before-migration.ps1

# Linux/Mac
export DB_NAME="electricity_tokens_staging"
export DB_USER="staging_user"
./scripts/backup-before-migration.sh
```

**Backup Verification:**

```bash
# Check backup file exists and is non-zero
ls -lh backups/pre-migration/backup-*.dump

# Windows
dir backups\pre-migration\backup-*.dump
```

**Backup Location:** `backups/pre-migration/backup-YYYYMMDD-HHMMSS.dump`

**Keep this backup until staging testing is complete!**

---

## Step 4: Deploy Code to Staging

### Pull Latest Code

```bash
# SSH to staging server
ssh user@staging-server

# Navigate to project directory
cd /path/to/electricity-tokens

# Fetch latest changes
git fetch origin main

# Check current branch and commits
git status
git log -5 --oneline

# Pull ET-100 changes (includes ReceiptData migration)
git pull origin main

# Verify ET-100 code is present
git log --oneline --grep="ET-100" -10
```

### Install Dependencies

```bash
# Install/update Node packages
npm ci

# Verify critical packages
npm list @prisma/client prisma next react
```

### Build Application

```bash
# Set staging environment
export NODE_ENV=staging  # Linux/Mac
# or
set NODE_ENV=staging     # Windows

# Build Next.js application
npm run build

# Verify build success
ls -la .next/
```

---

## Step 5: Apply Database Migration

### Review Migration Files

```bash
# List Prisma migrations
ls -la prisma/migrations/

# Find ReceiptData migration
find prisma/migrations -name "*receipt*" -o -name "*receiptdata*"

# Review migration SQL (if found)
cat prisma/migrations/YYYYMMDD_HHMMSS_add_receipt_data/migration.sql
```

### Check Current Migration Status

```bash
# Check what migrations are pending
DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/electricity_tokens_staging" \
  npx prisma migrate status

# Expected output:
# The following migration(s) have not yet been applied:
# YYYYMMDD_HHMMSS_add_receipt_data
```

### Apply Migration

```bash
# Apply ReceiptData migration to staging database
DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/electricity_tokens_staging" \
  npx prisma migrate deploy

# Expected output:
# Applying migration `YYYYMMDD_HHMMSS_add_receipt_data`
# The following migration(s) have been applied:
# migrations/
#   └─ YYYYMMDD_HHMMSS_add_receipt_data/
#      └─ migration.sql
```

### Verify Migration Success

```bash
# Check migration status again
DATABASE_URL="postgresql://staging_user:staging_password@localhost:5432/electricity_tokens_staging" \
  npx prisma migrate status

# Expected output:
# Database schema is up to date!

# Verify ReceiptData table exists
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
-- List ReceiptData table
\dt "ReceiptData"

-- Show table structure
\d "ReceiptData"

-- Check constraints
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'ReceiptData';

-- Verify foreign key to TokenPurchase
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public."ReceiptData"'::regclass;
EOF
```

**Expected ReceiptData Table Structure:**

```sql
Table "public.ReceiptData"
       Column        |            Type             | Nullable
---------------------+-----------------------------+----------
 id                  | text                        | not null
 purchaseId          | text                        | not null
 tokenNumber         | text                        |
 accountNumber       | text                        |
 kwhPurchased        | double precision            | not null
 energyCostZWG       | double precision            | not null
 debtZWG             | double precision            | not null
 reaZWG              | double precision            | not null
 vatZWG              | double precision            | not null
 totalAmountZWG      | double precision            | not null
 tenderedZWG         | double precision            | not null
 transactionDateTime | timestamp without time zone | not null
 createdAt           | timestamp without time zone | not null
 updatedAt           | timestamp without time zone | not null

Indexes:
    "ReceiptData_pkey" PRIMARY KEY, btree (id)
    "ReceiptData_purchaseId_key" UNIQUE CONSTRAINT, btree ("purchaseId")

Foreign-key constraints:
    "ReceiptData_purchaseId_fkey" FOREIGN KEY ("purchaseId") 
      REFERENCES "TokenPurchase"(id) ON UPDATE CASCADE ON DELETE CASCADE
```

---

## Step 6: Start Staging Application

### Using Development Server (Quick Testing)

```bash
# Set staging environment
cp .env.staging .env

# Start development server
npm run dev

# Application runs on http://localhost:3000
```

### Using Production Build (Realistic Testing)

```bash
# Build for production
npm run build

# Start production server
npm start

# Application runs on http://localhost:3000
```

### Using PM2 (Recommended for persistent staging)

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.staging.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'electricity-tokens-staging',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001  // Different port from production
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.staging.config.js

# Check status
pm2 status

# View logs
pm2 logs electricity-tokens-staging

# Monitor
pm2 monit
```

---

## Step 7: Post-Deployment Verification

### Health Check

```bash
# Check application is running
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-08T...",
  "database": "connected",
  "environment": "staging"
}
```

### Database Connection Test

```bash
# Test database connectivity from application
curl http://localhost:3000/api/health/db

# Or check in browser
open http://localhost:3000/api/health
```

### Migration Verification

```bash
# Check _prisma_migrations table
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
SELECT 
  migration_name,
  finished_at,
  applied_steps_count
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 5;
EOF

# Verify ReceiptData table is empty (fresh deployment)
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
SELECT COUNT(*) AS receipt_count FROM "ReceiptData";
-- Should return 0 for fresh deployment
EOF
```

---

## Step 8: Update Project Plan

Mark Task 9.9 as complete:

```bash
# Update projectplan-et-100-meter-reading-support-2025-11-08.md
# Change Task 9.9 checkbox from [ ] to [x]
```

---

## Staging Testing Checklist

After deployment, verify these items before proceeding to production:

### Application Access
- [ ] Staging application accessible via URL/IP
- [ ] Login functionality works
- [ ] Dashboard loads without errors
- [ ] No console errors in browser

### Database
- [ ] ReceiptData table exists
- [ ] Foreign key to TokenPurchase is correct
- [ ] Indexes created (purchaseId unique index)
- [ ] Migration recorded in _prisma_migrations

### ET-100 Features (Task 9.10 - Smoke Testing)
- [ ] Can create purchase with receipt data
- [ ] Can add receipt data to existing purchase
- [ ] Can update receipt data
- [ ] Can delete receipt data
- [ ] Bulk import preview works
- [ ] Dual-currency analysis returns data
- [ ] Historical analysis generates insights
- [ ] Rate history shows exchange rates

### Error Handling
- [ ] Validation errors display properly
- [ ] Database errors don't expose sensitive info
- [ ] 404 pages work
- [ ] 500 errors logged correctly

---

## Rollback Procedure (If Issues Found)

### Scenario: Migration Failed or Application Errors

```bash
# Step 1: Stop application
pm2 stop electricity-tokens-staging
# or
# Press Ctrl+C if using npm start

# Step 2: Restore from backup
pg_restore -h localhost -U staging_user -d electricity_tokens_staging \
  --clean --if-exists \
  backups/pre-migration/backup-YYYYMMDD-HHMMSS.dump

# Step 3: Verify restoration
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
-- Check ReceiptData table is gone (rollback successful)
\dt "ReceiptData"
-- Should show "Did not find any relation named ReceiptData"

-- Verify other tables intact
SELECT COUNT(*) FROM "TokenPurchase";
SELECT COUNT(*) FROM "User";
EOF

# Step 4: Checkout previous code version (if needed)
git log --oneline -10
git checkout <commit-hash-before-ET-100>

# Step 5: Rebuild application
npm ci
npm run build

# Step 6: Restart application
npm start
# or
pm2 start ecosystem.staging.config.js
```

**See:** DATABASE_BACKUP_PROCEDURE.md for detailed rollback scenarios

---

## Monitoring Staging Deployment

### Application Logs

```bash
# PM2 logs (if using PM2)
pm2 logs electricity-tokens-staging --lines 100

# Node.js logs (if using npm start)
# Check console output

# Application log files (if configured)
tail -f logs/staging-app.log
```

### Database Queries

```bash
# Monitor database connections
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
SELECT 
  count(*) AS total_connections,
  state,
  application_name
FROM pg_stat_activity
WHERE datname = 'electricity_tokens_staging'
GROUP BY state, application_name;
EOF

# Monitor table sizes
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
EOF
```

### Error Monitoring

```bash
# Check for errors in logs
pm2 logs electricity-tokens-staging | grep -i error

# Check database errors
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
SELECT * FROM pg_stat_database 
WHERE datname = 'electricity_tokens_staging';
EOF
```

---

## Next Steps

After successful staging deployment:

1. **Proceed to Task 9.10:** Smoke Testing on Staging
   - Test all ET-100 features
   - Bulk import CSV testing
   - Dual-currency analysis verification
   - Performance testing

2. **Document Issues:** Record any bugs or issues found

3. **Fix Issues:** Apply fixes to staging, re-test

4. **Production Deployment:** Once staging validated, proceed to Task 9.11

---

## Staging Environment Cleanup (After Production Deployment)

```bash
# Option 1: Keep staging for ongoing testing
# - Periodically sync from production
# - Use for feature testing before production

# Option 2: Tear down staging
# Stop application
pm2 delete electricity-tokens-staging

# Remove staging database (CAREFUL!)
psql -h localhost -U postgres << EOF
DROP DATABASE IF EXISTS electricity_tokens_staging;
EOF

# Archive backups
mkdir -p backups/staging-archived
mv backups/pre-migration/backup-*.dump backups/staging-archived/
```

---

## Troubleshooting

### Issue: Migration Failed with "relation already exists"

**Solution:**
```bash
# ReceiptData table partially created
# Drop table and retry
psql -h localhost -U staging_user -d electricity_tokens_staging << EOF
DROP TABLE IF EXISTS "ReceiptData" CASCADE;
EOF

# Retry migration
npx prisma migrate deploy
```

### Issue: Cannot connect to staging database

**Solution:**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT version();"

# Check PostgreSQL is running
pg_isready -h localhost
```

### Issue: Port already in use

**Solution:**
```bash
# Check what's using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
PORT=3001 npm start
```

---

## References

- **DATABASE_BACKUP_PROCEDURE.md** - Complete backup and rollback guide
- **DEPLOYMENT.md** - Production deployment procedures
- **TESTING_GUIDE_ET-100.md** - Comprehensive testing guide
- **DATABASE_SCHEMA.md** - Database schema documentation

---

## Document Version

- **Version:** 1.0
- **Created:** 2025-11-08
- **For:** ET-100 ReceiptData Migration
- **Environment:** Staging
- **Status:** Ready for deployment
