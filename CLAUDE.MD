2

## Unified Build Tracking System
This project uses a **unified build tracking system** that harmonizes build detection across all workflows:

### How It Works:
- When any workflow builds the app (`npm run build`), it creates a `.next/.build-complete` marker file
- This marker contains the git commit hash, BUILD_ID, and completion timestamp
- The service checks this marker on startup and **skips rebuild** if the build is current
- This prevents duplicate builds when git hooks, install scripts, or service build the app

### Build Recognition:
- ✅ **Service builds** → Git hooks recognize it
- ✅ **Git hook builds** → Service recognizes it
- ✅ **Install script builds** → Service recognizes it
- ✅ **Manual builds** → All workflows recognize it

### Files Involved:
- `scripts/generate-build-info.js` - Creates build metadata (runs pre-build)
- `scripts/post-build.js` - Updates tracking after successful build (runs post-build)
- `.next/build-info.json` - Build metadata (git commit, version, timestamp)
- `.next/.build-complete` - Build completion marker (proves build succeeded)

**See** `docs/UNIFIED_BUILD_TRACKING.md` for detailed documentation.

## Windows Service Management
This project uses a **Hybrid Service Architecture** for reliable Windows service deployment:

### Service Commands (Always run as Administrator):
- `npm run service:validate` - Validate environment before installation
- `npm run service:install` - Install the hybrid service
- `npm run service:force-install` - Force install (handles EBUSY/locked file errors)
- `npm run service:start` - Start the service 
- `npm run service:stop` - Stop the service (guaranteed process cleanup)
- `npm run service:diagnose` - Comprehensive diagnostics and health check
- `npm run service:uninstall` - Remove the service

### Key Features:
- **Enhanced Process Management**: Direct Next.js execution without npm layer
- **Guaranteed Cleanup**: Eliminates orphaned processes on port 3000
- **Auto-Build**: Automatically runs production build when needed
- **Force Installation**: Handles installation errors gracefully
- **Native Integration**: Uses Windows taskkill and sc.exe commands

### Service Architecture Files:
- `hybrid-service-manager.js` - Core service management logic
- `service-wrapper-hybrid.js` - Service wrapper for Next.js execution
- `force-install-hybrid.js` - Handles problematic installations
- `start-service-hybrid.js` - Enhanced service starting
- `stop-service-hybrid.js` - Guaranteed service stopping
- `diagnose-hybrid.js` - Comprehensive diagnostics

### When Making Service Changes:
Always test on the deployment machine with Administrator privileges. The hybrid service solves the critical issue where `npm run service:stop` would report success but leave Node.js processes running on port 3000.

## Database Management
**CRITICAL RULE: Never modify the database manually. Always create migrations.**

### Database Change Process:
1. **Never make manual database changes** - Always use Prisma migrations
2. **Create migrations for all schema changes** - Use `npx prisma migrate dev --name descriptive_name`
3. **Test migrations thoroughly** - Ensure they work on clean databases and existing ones
4. **Consolidate related changes** - Before production deployment, consolidate multiple related migrations into a single migration if needed
5. **Migrations must be idempotent** - They should handle cases where changes already exist

### Migration Commands:
- `npx prisma migrate dev --name migration_name` - Create and apply new migration (development)
- `npx prisma migrate deploy` - Apply pending migrations (production)
- `npx prisma migrate status` - Check migration status
- `npx prisma migrate resolve --applied migration_name` - Mark migration as applied
- `npx prisma migrate resolve --rolled-back migration_name` - Mark failed migration as rolled back

## Backup and Restore System
This project supports **backward-compatible restores**, allowing you to restore backups from older system versions even if the current database schema includes new fields.

### Fresh Installation and Restore (Remote Servers)
When setting up a new server and restoring from an old backup:

```bash
# 1. Run automated fresh install setup (applies migrations + creates temp admin)
npm run restore:setup

# 2. Start application
npm start  # Production
npm run dev  # Development

# 3. Restore via web UI:
#    - Log in with temporary admin (admin@temp.local / temppass123)
#    - Go to: Admin > Data Management > Restore
#    - Upload backup file and restore
#    - Temp admin will be overwritten by backup data
#    - Log in again with your real admin account from backup

# Optional: Verify-only mode (no changes, just checks)
npm run restore:setup-verify
```

### Restore Verification
Before restoring a backup, verify compatibility:

```bash
# Check if database is ready for restore
npm run restore:verify

# Verify specific backup file
node scripts/verify-restore-compatibility.js /path/to/backup.json
```

The verification checks:
- ✅ Database connection
- ✅ All migrations applied
- ✅ Required columns with correct defaults (e.g., `isActive`)
- ✅ Required indexes
- ✅ Backup file format and compatibility

### How Backward Compatibility Works
The migration `20250905045331_add_user_deactivation_system` adds new columns (`isActive`, `deactivatedAt`, etc.) with default values:
- Old backups **without** these fields → Restored successfully with defaults
- `isActive` defaults to `true` for all restored users
- Uses `IF NOT EXISTS` - safe to run multiple times
- No data loss or corruption

### Restore Process
**Via Web UI (Recommended):**
1. Log in as admin
2. Navigate to: Admin → Data Management → Restore
3. Upload backup file (e.g., `et-backup_full_2025-11-27.json`)
4. Click "Restore" and wait for completion
5. Verify restored data

**Via API:**
```bash
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d @backup-file.json
```

### Key Scripts
- `scripts/verify-restore-compatibility.js` - Verify database is ready for restore
- `scripts/fresh-install-setup.js` - Automated setup for new servers
- `src/app/api/backup/route.ts` - Backup/restore API endpoint

**See** `docs/FRESH_INSTALL_AND_RESTORE.md` for detailed documentation.

### Troubleshooting
- **"Column isActive does not exist"** → Run `npx prisma migrate deploy`
- **"Environment variable not found: DATABASE_URL"** → Check `.env.local` file
- **"current transaction is aborted"** → Expected during restore errors, check logs for root cause