# 🔄 Upgrade Guide - Electricity Tokens Tracker

## Upgrading to Schema v1.4.0

This guide provides comprehensive instructions for upgrading existing deployments to the latest version with enhanced mobile support, theme preferences, and audit logging improvements.

---

## 📋 Pre-Upgrade Checklist

### ⚠️ CRITICAL - Complete Before Starting

- [ ] **Create full backup** of your database and application files
- [ ] **Test backup restoration** on a separate environment
- [ ] **Document current version** and configuration
- [ ] **Schedule maintenance window** (expect 30-60 minutes downtime)
- [ ] **Notify users** of scheduled maintenance
- [ ] **Verify database access** and permissions
- [ ] **Ensure adequate disk space** (at least 2GB free recommended)

### 📊 Current Version Assessment

**Check your current version:**

```bash
# Check application version in package.json
cat package.json | grep version

# Check Prisma migration status
npx prisma migrate status

# Check migration history (shows migration names, not version numbers)
psql -U username -d electricity_tokens -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC;"

# Check for existing tables to determine schema state
psql -U username -d electricity_tokens -c "\dt"
```

**Schema State Identification:**

Since Prisma doesn't store version numbers, identify your schema state by:

- **Tables present**: Check if `meter_readings` table exists
- **User fields**: Check if users table has `theme_preference` field
- **Migration names**: Look for migrations like `add_user_theme_preference`

**Current Schema Indicators:**

```bash
# Check if you have the latest schema (v1.4.0 equivalent)
psql -U username -d electricity_tokens -c "\d users" | grep theme_preference
psql -U username -d electricity_tokens -c "SELECT COUNT(*) FROM meter_readings;"

# Your current migrations show you have the latest schema:
# - 20250706132952_init (initial schema)
# - 20250706215039_add_user_theme_preference (theme support)
```

---

## 🛡️ Step 1: Backup Procedures

### 1.1 Database Backup

```bash
# Create timestamped backup using pg_dump (includes all tables including meter_readings)
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# If you get version mismatch errors, use psql instead or install matching pg_dump version
# Option 1: Direct backup (handles version mismatches better)
psql -U username -d electricity_tokens -c "COPY (SELECT * FROM meter_readings ORDER BY \"readingDate\") TO STDOUT WITH CSV HEADER" > meter_readings_backup_${BACKUP_DATE}.csv

# Option 2: Use Docker with matching PostgreSQL version
docker run --rm -e PGPASSWORD=yourpassword postgres:17-alpine pg_dump -h host.docker.internal -U username electricity_tokens > backup_${BACKUP_DATE}.sql

# Option 3: Standard pg_dump (if versions match)
pg_dump -U username -h hostname electricity_tokens > backup_${BACKUP_DATE}.sql

# Verify backup integrity
pg_dump -U username -h hostname electricity_tokens --schema-only > schema_${BACKUP_DATE}.sql

# Create compressed backup (recommended for large databases)
pg_dump -U username -h hostname electricity_tokens | gzip > backup_${BACKUP_DATE}.sql.gz

# Verify all tables are included using psql (works with any version)
psql -U username -d electricity_tokens -c "\dt" | grep meter_readings
```

**Application-Level Backup (Alternative):**

```bash
# Use the built-in backup system (via Admin Panel or API)
# This ensures all data including meter_readings is captured
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"type": "full"}' > app_backup_${BACKUP_DATE}.json
```

### 1.2 Application Files Backup

```bash
# For local hosting
cp -r /path/to/electricity-tokens /path/to/electricity-tokens-backup-${BACKUP_DATE}

# For Vercel deployment
git tag v1.3.x-backup
git push origin v1.3.x-backup

# For manual deployment
tar -czf app-backup-${BACKUP_DATE}.tar.gz /path/to/electricity-tokens
```

### 1.3 Environment Configuration Backup

```bash
# Backup environment variables
cp .env.local .env.local.backup.${BACKUP_DATE}

# For Vercel - export environment variables
vercel env pull .env.backup.${BACKUP_DATE}
```

---

## 🚀 Step 2: Application Update

### 2.1 Stop Current Application

**Local Hosting:**

```bash
# Stop the application (Ctrl+C in running terminal)
# Or kill all Node.js processes
pkill -f node
```

**Vercel Deployment:**

```bash
# No action needed - will deploy automatically
```

**Docker/Container Deployment:**

```bash
docker stop electricity-tokens-container
```

### 2.2 Update Application Code

```bash
# Navigate to application directory
cd /path/to/electricity-tokens

# Fetch latest changes
git fetch origin

# Switch to new version
git checkout v1.4.0

# Update dependencies
npm install

# Or if using yarn
yarn install
```

### 2.3 Environment Configuration Updates

Add new environment variables to `.env.local`:

```env
# Schema Version (new)
DB_SCHEMA_VERSION=1.4.0

# Theme Configuration (optional)
DEFAULT_THEME=system
THEME_STORAGE_ENABLED=true

# Enhanced Audit Logging (optional)
AUDIT_IP_TRACKING=true
AUDIT_USER_AGENT_TRACKING=true
```

---

## 🗄️ Step 3: Database Migration

### 3.1 Schema Validation

```bash
# Verify current schema state
npx prisma db pull
npx prisma validate

# Check for required migrations
npx prisma migrate status
```

### 3.2 Apply Schema Changes

**Option A: Automated Migration (Recommended)**

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations safely
npx prisma migrate deploy

# Verify migration success
npx prisma migrate status
```

**Option B: Manual Schema Update (Advanced Users)**

```bash
# Push schema changes (development only)
npx prisma db push

# Or apply specific migration
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### 3.3 Data Migration (if required)

```bash
# First create the required backup as shown by the migration script
pg_dump -U postgres -h localhost electricity_tokens > backups/pre-v1.4.0-migration-$(date +%Y-%m-%dT%H-%M-%S).sql

# Create backups directory if it doesn't exist
mkdir -p backups

# Run data migration script for v1.4.0
node scripts/migrate-to-v1.4.0.js

# Or skip backup check (NOT RECOMMENDED for production)
node scripts/migrate-to-v1.4.0.js --force

# Verify data integrity
node scripts/verify-migration.js
```

### 3.4 Schema Verification

```bash
# Verify Prisma migration status
npx prisma migrate status

# Check if database schema matches Prisma schema
npx prisma db pull
npx prisma validate

# Verify all tables exist
psql -U username -d electricity_tokens -c "\dt"

# Expected tables for v1.4.0:
# - users (with themePreference and passwordResetRequired fields)
# - meter_readings (new table)
# - audit_logs (with metadata field)
# - accounts, sessions, verification_tokens
# - token_purchases, user_contributions
# - _prisma_migrations (Prisma's migration tracking table)

# Check specific new fields
psql -U username -d electricity_tokens -c "\d users"
psql -U username -d electricity_tokens -c "\d meter_readings"
psql -U username -d electricity_tokens -c "\d audit_logs"
```

---

## 🔄 Step 4: Application Restart

### 4.1 Build Application

```bash
# Build for production
npm run build

# Or with yarn
yarn build
```

### 4.2 Start Application

**Local Hosting:**

```bash
# Start production server
npm start

# Or with process manager
pm2 start npm --name "electricity-tokens" -- start
```

**Vercel Deployment:**

```bash
# Deploy to production
vercel --prod

# Or automatic deployment via git push
git push origin main
```

**Docker Deployment:**

```bash
# Rebuild and start container
docker build -t electricity-tokens .
docker run -d --name electricity-tokens-container -p 3000:3000 electricity-tokens
```

---

## ✅ Step 5: Post-Upgrade Verification

### 5.1 System Health Check

```bash
# Test application startup
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "1.4.0",
#   "schemaVersion": "1.4.0",
#   ...
# }
```

### 5.2 Database Integrity Check

```bash
# Verify Prisma migration status
npx prisma migrate status

# Check database schema is up to date
npx prisma db pull
npx prisma validate

# Verify table record counts
psql -U username -d electricity_tokens -c "SELECT COUNT(*) FROM users;"
psql -U username -d electricity_tokens -c "SELECT COUNT(*) FROM meter_readings;"
psql -U username -d electricity_tokens -c "SELECT COUNT(*) FROM audit_logs;"

# Check for new fields
psql -U username -d electricity_tokens -c "SELECT theme_preference FROM users LIMIT 1;"

# Verify Prisma migration tracking
psql -U username -d electricity_tokens -c "SELECT migration_name, applied_steps_count FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### 5.3 Feature Testing

**Core Functionality:**

- [ ] User login/logout works
- [ ] Purchase creation works
- [ ] Contribution creation works
- [ ] Reports generate correctly

**New Features (v1.4.0):**

- [ ] Theme switching works (light/dark/system)
- [ ] Theme preferences persist across sessions
- [ ] Meter reading creation works
- [ ] Mobile layouts display correctly
- [ ] Audit information shows creator/modifier
- [ ] Running balance uses latest meter readings

**Mobile Testing:**

- [ ] No horizontal scrolling on mobile devices
- [ ] Card layouts work properly on small screens
- [ ] Touch interactions work correctly
- [ ] PWA installation works

### 5.4 User Account Verification

```bash
# Verify user accounts are intact
psql -U username -d electricity_tokens -c "SELECT id, email, role, theme_preference FROM users;"

# Check if admin users retained permissions
psql -U username -d electricity_tokens -c "SELECT email, role FROM users WHERE role = 'ADMIN';"
```

---

## 🛠️ Step 6: User Communication

### 6.1 Notify Users of Upgrade

**Email Template:**

```
Subject: Electricity Tokens Tracker - System Upgrade Complete ✅

Dear [Household/Team Name],

The Electricity Tokens Tracker has been successfully upgraded to version 1.4.0!

🆕 NEW FEATURES:
• Mobile-optimized design - perfect for phones and tablets
• Personal theme preferences - choose light, dark, or system theme
• Enhanced meter reading tracking
• Improved audit trails showing who made changes
• Better mobile navigation with no horizontal scrolling

📱 MOBILE IMPROVEMENTS:
The app now works even better on mobile devices with card-based layouts optimized for touch screens.

🎨 THEME PREFERENCES:
Your theme choice (light/dark/system) will now save automatically and persist across all your sessions.

✅ WHAT YOU NEED TO DO:
1. Clear your browser cache for the best experience
2. Try the new theme options in your profile settings
3. Test the mobile experience on your phone/tablet
4. Continue using the app as normal - all your data is safe

If you experience any issues, please contact [Admin Contact].

Best regards,
[Admin Name]
```

### 6.2 User Training (Optional)

Create a quick training session covering:

- New mobile interface
- Theme preference settings
- Enhanced meter reading features
- Audit trail visibility

---

## 🚨 Rollback Procedures

### If Upgrade Fails

**Immediate Rollback Steps:**

1. **Stop the application**

   ```bash
   pkill -f node  # or container stop command
   ```

2. **Restore database from backup**

   ```bash
   # Create rollback backup first
   pg_dump -U username -d electricity_tokens > rollback_backup_$(date +%Y%m%d_%H%M%S).sql

   # Drop current database
   dropdb -U username electricity_tokens

   # Recreate database
   createdb -U username electricity_tokens

   # Restore from backup
   psql -U username -d electricity_tokens < backup_${BACKUP_DATE}.sql
   ```

3. **Restore application files**

   ```bash
   # Switch back to previous version
   git checkout v1.3.x-backup

   # Or restore from file backup
   rm -rf /path/to/electricity-tokens
   cp -r /path/to/electricity-tokens-backup-${BACKUP_DATE} /path/to/electricity-tokens
   ```

4. **Restart application**

   ```bash
   npm install
   npm run build
   npm start
   ```

5. **Verify rollback success**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 📊 Common Upgrade Issues & Solutions

### Issue: PostgreSQL Version Mismatch

**Symptoms:**

- `pg_dump: error: server version: X.X; pg_dump version: Y.Y`
- "aborting because of server version mismatch" error
- Cannot create backups using pg_dump

**Solutions:**

```bash
# Option 1: Install matching PostgreSQL client tools
brew install postgresql@17  # Match your server version
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# Option 2: Use Docker with matching version
docker run --rm -e PGPASSWORD=yourpassword postgres:17-alpine pg_dump -h host.docker.internal -U postgres electricity_tokens > backup.sql

# Option 3: Use psql for table-specific backups (version independent)
psql -U postgres -d electricity_tokens -c "\dt" | grep meter_readings
psql -U postgres -d electricity_tokens -c "SELECT COUNT(*) FROM meter_readings;"
psql -U postgres -d electricity_tokens -c "SELECT * FROM meter_readings ORDER BY \"readingDate\" DESC LIMIT 5;"

# Option 4: Use application backup system instead
# Access Admin Panel → Data Management → Create Backup
```

### Issue: Migration Fails - P3005 Database Not Empty

**Symptoms:**

- `prisma migrate deploy` fails with P3005 error
- "The database schema is not empty" message
- Database has tables but no migration history

**Solutions:**

```bash
# Option 1: Baseline existing production database (RECOMMENDED)
# This marks all existing migrations as applied without running them
npx prisma migrate resolve --applied "20250706132952_init"
npx prisma migrate resolve --applied "20250706215039_add_user_theme_preference"
npx prisma migrate deploy

# Option 2: Initialize migration baseline
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > baseline.sql
# Review baseline.sql, then apply future migrations normally

# Option 3: Reset and start fresh (WARNING: DELETES ALL DATA)
npx prisma migrate reset --force
npx prisma migrate deploy

# Verify final state
npx prisma migrate status
```

**For Production Deployment:**

```bash
# First check what migrations exist
npx prisma migrate status

# If database exists but no migration history, baseline it
npx prisma migrate resolve --applied "20250706132952_init"
npx prisma migrate resolve --applied "20250706215039_add_user_theme_preference"

# Then deploy any new migrations
npx prisma migrate deploy
```

### Issue: Theme Preferences Not Working

**Symptoms:**

- Theme doesn't persist
- Users see default theme always

**Solutions:**

```bash
# Verify theme field exists
psql -U username -d electricity_tokens -c "\d users"

# Add missing field manually if needed
psql -U username -d electricity_tokens -c "ALTER TABLE users ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'system';"

# Clear browser cache
# Restart application
```

### Issue: Mobile Layout Problems

**Symptoms:**

- Horizontal scrolling on mobile
- Layout doesn't adapt

**Solutions:**

- Clear browser cache completely
- Verify Tailwind CSS build includes mobile classes
- Check viewport meta tag in HTML
- Test in different mobile browsers

### Issue: Next.js 15 Build Errors

**Symptoms:**

- useSearchParams() missing suspense boundary error
- Viewport metadata warnings
- Build fails during prerendering

**Solutions:**

```bash
# Fix useSearchParams with Suspense boundary
# Wrap components using useSearchParams in <Suspense>
# Move viewport from metadata to separate viewport export

# Example fix:
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentUsingSearchParams />
    </Suspense>
  );
}

# For viewport metadata, create separate export:
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

### Issue: Audit Logs Missing Data

**Symptoms:**

- Old entries show no creator info
- Metadata field empty

**Solutions:**

```bash
# This is expected - old entries won't have audit info
# New entries will have complete audit trails
# No action required unless specific data recovery needed
```

---

## 📈 Performance Considerations

### Expected Performance Impact

**Positive Changes:**

- Mobile performance improvements
- Better responsive design
- Optimized database queries

**Resource Usage:**

- Slightly increased storage for audit metadata
- Minimal additional memory usage
- No significant CPU impact

### Monitoring Post-Upgrade

```bash
# Monitor database size
psql -U username -d electricity_tokens -c "SELECT pg_size_pretty(pg_database_size('electricity_tokens'));"

# Check Prisma migration status
npx prisma migrate status

# Monitor application memory
ps aux | grep node

# Check disk space
df -h

# Verify database health
npx prisma db pull
npx prisma validate
```

---

## 🎯 Success Metrics

### Upgrade is Successful When:

- [ ] All users can log in normally
- [ ] All existing data is preserved and accessible
- [ ] New theme preferences work and persist
- [ ] Mobile interface works without horizontal scrolling
- [ ] Meter readings can be created and viewed
- [ ] Audit trails show creator/modifier information
- [ ] Running balance calculations are accurate
- [ ] Reports generate correctly with new data
- [ ] Admin functions work properly
- [ ] Backup and restore capabilities are functional

### Performance Benchmarks:

- [ ] Page load times remain under 3 seconds
- [ ] Database queries complete within normal timeframes
- [ ] Mobile interface is responsive and touch-friendly
- [ ] Theme switching happens instantly
- [ ] No memory leaks or performance degradation after 24 hours

---

## 📞 Support & Troubleshooting

### Getting Help

1. **Check application logs** for specific error messages
2. **Verify environment variables** are correctly set
3. **Test database connectivity** independently
4. **Review this guide** for common issues
5. **Contact support** with detailed error information

### Log Locations

```bash
# Application logs
tail -f logs/app.log

# Database logs (PostgreSQL)
tail -f /var/log/postgresql/postgresql-*.log

# Vercel deployment logs
vercel logs [deployment-url]
```

### Emergency Contacts

- **Technical Issues**: [Admin Email/Phone]
- **Database Problems**: [Database Admin Contact]
- **User Account Issues**: [System Administrator]

---

## 📝 Upgrade Completion Checklist

### Final Verification

- [ ] **Application Status**: ✅ Running v1.4.0
- [ ] **Database Schema**: ✅ v1.4.0 with all new tables/fields
- [ ] **User Access**: ✅ All users can log in and access features
- [ ] **New Features**: ✅ Theme preferences, mobile design, audit trails working
- [ ] **Data Integrity**: ✅ All existing data preserved and accessible
- [ ] **Performance**: ✅ System performance meets expectations
- [ ] **Backup System**: ✅ Backups working with new schema
- [ ] **Documentation**: ✅ Updated for new version
- [ ] **User Communication**: ✅ Users notified and trained if necessary
- [ ] **Monitoring**: ✅ System monitoring updated for new version

### Post-Upgrade Tasks

- [ ] Schedule regular backups with new schema
- [ ] Update monitoring alerts for new features
- [ ] Plan user training sessions if needed
- [ ] Document any custom configurations or modifications
- [ ] Schedule follow-up check in 1 week to ensure stability

---

**Upgrade Date**: **\*\***\_\_\_**\*\***  
**Performed By**: **\*\***\_\_\_**\*\***  
**Version Before**: **\*\***\_\_\_**\*\***  
**Version After**: 1.4.0  
**Rollback Plan Tested**: ☐ Yes ☐ No  
**Users Notified**: ☐ Yes ☐ No

---

**🎉 Congratulations! Your Electricity Tokens Tracker is now running v1.4.0 with enhanced mobile support, theme preferences, and comprehensive audit logging.**

For ongoing maintenance and support, refer to [MAINTENANCE_PLAN.md](./MAINTENANCE_PLAN.md) and [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
