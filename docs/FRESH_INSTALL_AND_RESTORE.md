# Fresh Installation and Backup Restore Guide

This guide explains how to perform a fresh installation on a remote server and restore data from a backup created on an older version of the system.

## Overview

The system has been designed to support **backward-compatible restores**, meaning you can restore backups from older versions even if the current database schema includes new fields (like `isActive`, `deactivatedAt`, etc.).

## Quick Start

```bash
# On your remote server:
cd /path/to/electricity-tokens

# 1. Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 2. Run fresh install setup
node scripts/fresh-install-setup.js

# 3. Create admin user
node scripts/seed-admin.js

# 4. Start application and restore backup via web UI
npm start
```

## Detailed Steps

### Prerequisites

1. **Node.js** (v18 or later)
2. **PostgreSQL** database (v12 or later)
3. **Backup file** from the old system (e.g., `et-backup_full_2025-11-27.json`)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url> electricity-tokens
cd electricity-tokens

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local
nano .env.local  # or use your preferred editor
```

**Required variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/electricity_tokens"

# NextAuth
NEXTAUTH_URL="http://your-server-url:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App Configuration
NODE_ENV="production"
PORT=3000
```

### Step 3: Run Fresh Install Setup

The automated setup script will:

- ✅ Verify environment variables
- ✅ Test database connection
- ✅ Run all database migrations
- ✅ Generate Prisma Client
- ✅ Verify schema compatibility with old backups
- ✅ Build the application (in production mode)

```bash
# Full setup
node scripts/fresh-install-setup.js

# Or verify-only mode (no changes)
node scripts/fresh-install-setup.js --verify-only

# Or verify with specific backup file
node scripts/fresh-install-setup.js --backup-file=/path/to/backup.json
```

### Step 4: Create Admin User

```bash
node scripts/seed-admin.js
```

Follow the prompts to create your admin account.

### Step 5: Start the Application

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

**As Windows Service (Windows only):**

```bash
npm run service:install
npm run service:start
```

### Step 6: Restore Backup

#### Option A: Via Web UI (Recommended)

1. Open the application in your browser (e.g., `http://your-server:3000`)
2. Log in with your admin account
3. Navigate to: **Admin** → **Data Management** → **Backup & Restore**
4. Click **"Restore from Backup"**
5. Select your backup file (e.g., `et-backup_full_2025-11-27.json`)
6. Click **"Restore"** and wait for completion
7. Verify the restored data

#### Option B: Via API

```bash
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d @et-backup_full_2025-11-27.json
```

## Understanding Schema Compatibility

### How Backward Compatibility Works

The migration `20250905045331_add_user_deactivation_system` adds new columns to the `users` table:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivationReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivatedBy" TEXT;
```

**Key features:**

- Uses `IF NOT EXISTS` - safe to run multiple times
- Sets `DEFAULT true` for `isActive` - old backups without this field will automatically get `true`
- New columns are nullable (except `isActive`) - no data loss

### What Happens During Restore

When restoring users from an old backup that doesn't have the `isActive` field:

```javascript
// Old backup data (doesn't have isActive)
{
  "id": "user123",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER",
  // ... other fields
  // Note: NO isActive field
}

// After restore in new database
{
  "id": "user123",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER",
  // ... other fields
  "isActive": true,  // ← Automatically set by DEFAULT constraint
  "deactivatedAt": null,
  "deactivationReason": null,
  "deactivatedBy": null
}
```

## Verification Tools

### Verify Restore Compatibility

Before attempting a restore, verify your database is ready:

```bash
# Check schema compatibility
node scripts/verify-restore-compatibility.js

# Verify with specific backup file
node scripts/verify-restore-compatibility.js /path/to/backup.json
```

This will check:

- ✅ Database connection
- ✅ Migration status
- ✅ Required columns with correct defaults
- ✅ Required indexes
- ✅ Backup file format (if provided)

### Manual Verification

Check the schema manually:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# View users table structure
\d users

# Expected output should include:
# isActive              | boolean  | not null | true
# deactivatedAt         | timestamp(3) without time zone |  |
# deactivationReason    | text     |          |
# deactivatedBy         | text     |          |
```

## Troubleshooting

### Issue: "Column isActive does not exist"

**Cause:** Migrations haven't been applied.

**Solution:**

```bash
npx prisma migrate deploy
node scripts/verify-restore-compatibility.js
```

### Issue: "current transaction is aborted"

**Cause:** Previous error in transaction caused rollback mode.

**Solution:** This is expected - the restore process will handle it. If restoring via API, check the error logs for the root cause.

### Issue: "Environment variable not found: DATABASE_URL"

**Cause:** Environment variables not loaded.

**Solution:**

```bash
# Make sure .env.local exists
ls -la .env.local

# Load environment and retry
source <(cat .env.local | sed 's/^/export /')
npx prisma migrate deploy
```

### Issue: Restore succeeds but some records fail

**Cause:** Foreign key constraints (e.g., user not found for contribution).

**Solution:** The restore process will log which records failed. Check the error messages to identify missing dependencies. The restore is transactional, so either all records restore successfully or none do.

## Best Practices

### Before Restore

1. **Backup current database** (if any data exists):

   ```bash
   pg_dump $DATABASE_URL > pre-restore-backup.sql
   ```

2. **Run verification**:

   ```bash
   node scripts/verify-restore-compatibility.js
   ```

3. **Stop the application** (to avoid conflicts):
   ```bash
   npm run service:stop  # If running as service
   # or kill the process if running manually
   ```

### After Restore

1. **Verify data integrity**:
   - Check user count matches backup
   - Verify token purchases and contributions
   - Check meter readings
   - Test user login

2. **Run balance fix** (runs automatically but verify):

   ```bash
   # Check logs for: "✅ Balance fix completed automatically"
   ```

3. **Test critical features**:
   - User authentication
   - Token purchase creation
   - Reports generation
   - Data export

### For Production Deployments

1. **Use a staging environment first**
2. **Test the restore process** with production backup
3. **Document any issues** and their solutions
4. **Plan for downtime** during restore
5. **Have rollback plan** (database backup)

## Migration Details

### Current Migration Version

- **Migration**: `20250905045331_add_user_deactivation_system`
- **Purpose**: Add user deactivation/activation system
- **Backward Compatible**: ✅ Yes
- **Rerunnable**: ✅ Yes (uses `IF NOT EXISTS`)

### All Migrations

```bash
# List all migrations
ls -la prisma/migrations/

# Output should include:
# 20250706132952_init
# 20250706215039_add_user_theme_preference
# 20250707201336_add_last_login_at
# 20250708004551_add_metadata_to_audit_log
# 20250708005417_add_cascade_delete_to_audit_logs
# 20250708120000_add_performance_indexes
# 20250905045331_add_user_deactivation_system  ← Critical for old backups
```

### Checking Migration Status

```bash
# View which migrations have been applied
npx prisma migrate status

# Expected output for fresh install after setup:
# "Database schema is up to date!"
```

## Additional Resources

- **Unified Build Tracking**: See `docs/UNIFIED_BUILD_TRACKING.md`
- **Windows Service**: See `CLAUDE.md` - Windows Service Management section
- **Database Management**: See `CLAUDE.md` - Database Management section
- **Admin User Creation**: Run `node scripts/seed-admin.js --help`

## Support

If you encounter issues:

1. **Check logs**:
   - Application: `logs/` directory
   - Service: `scripts/windows-service/daemon/service.log`

2. **Verify prerequisites**:

   ```bash
   node --version  # Should be v18+
   psql --version  # Should be v12+
   npm --version
   ```

3. **Run diagnostics**:

   ```bash
   node scripts/verify-restore-compatibility.js
   node scripts/fresh-install-setup.js --verify-only
   ```

4. **Common commands**:

   ```bash
   # Reset database (⚠️ DESTROYS ALL DATA)
   npx prisma migrate reset --force

   # Regenerate Prisma Client
   npx prisma generate

   # View database contents
   npx prisma studio
   ```

---

**Last Updated**: 2025-11-28
**Migration Version**: 20250905045331
**Prisma Version**: 6.17.1
