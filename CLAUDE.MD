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