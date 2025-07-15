# Windows Service Deployment Guide

This guide covers deploying updates to the Electricity Tokens Tracker Windows service, including automated upgrades, manual deployments, and rollback procedures.

## 🚀 Quick Upgrade (Recommended)

For routine deployments with minimal downtime:

```bash
# Open PowerShell or Command Prompt as Administrator
npm run service:upgrade
```

This automated process will:

- ✅ Create a backup of the current application
- ✅ Stop the service gracefully
- ✅ Update dependencies and rebuild the application
- ✅ Start the service and verify it's working
- ✅ Clean up old backups (keeps 5 most recent)

**Total Downtime**: Typically 2-5 minutes depending on build time.

## 📋 Deployment Scenarios

### Scenario 1: Code Updates Only

_Updates to application code, no dependency changes_

```bash
# Automated upgrade (recommended)
npm run service:upgrade

# Manual process
npm run service:stop
git pull origin main
npm run build
npm run service:start
```

### Scenario 2: Dependency Updates

_New npm packages, dependency version changes_

```bash
# Always use automated upgrade for dependency changes
npm run service:upgrade
```

The automated upgrade handles:

- Dependency installation with `npm install`
- Clean rebuilds with `npm run build`
- Service restart with verification

### Scenario 3: Database Schema Changes

_Prisma schema updates, migrations_

```bash
# Before upgrade, ensure migration scripts exist
ls scripts/migrate-db.js  # Should exist if migrations needed

# Run automated upgrade (includes migration step)
npm run service:upgrade
```

The upgrade process automatically runs database migrations if `scripts/migrate-db.js` exists.

### Scenario 4: Environment Variable Changes

_New environment variables, configuration updates_

1. **Update environment variables first**:

   ```bash
   # Edit .env.local file
   notepad .env.local
   ```

2. **Run upgrade**:

   ```bash
   npm run service:upgrade
   ```

3. **Verify configuration**:
   ```bash
   npm run service:validate
   ```

## 🔄 Manual Deployment Process

When you need more control or the automated upgrade fails:

### Step 1: Pre-deployment Checks

```bash
# Verify current service status
npm run service:status

# Validate environment configuration
npm run service:validate

# Run diagnostics
npm run service:diagnose
```

### Step 2: Create Backup (Optional but Recommended)

```bash
# Manual backup - automated upgrade does this automatically
mkdir backups\manual-backup-$(Get-Date -Format "yyyy-MM-dd-HH-mm-ss")
# Copy important files manually if needed
```

### Step 3: Stop Service

```bash
npm run service:stop

# Verify service stopped
npm run service:status
```

### Step 4: Update Application

```bash
# Pull latest code
git pull origin main

# Install/update dependencies
npm install

# Run any database migrations
# (Create scripts/migrate-db.js if you have migrations)

# Build application
npm run build
```

### Step 5: Start Service

```bash
npm run service:start

# Verify service started
npm run service:status

# Test application response
npm run service:diagnose
```

### Step 6: Verify Deployment

```bash
# Check service status
npm run service:status

# Full diagnostic check
npm run service:diagnose

# Manual application test
# Open browser to http://localhost:3000 (or your configured port)
```

## 🆘 Rollback Procedures

### Automatic Rollback

If the automated upgrade creates a backup, you can rollback:

```bash
# Find backup directory (example path)
dir backups\

# Rollback to specific backup
npm run service:rollback "C:\path\to\your\app\backups\backup-2024-01-15T10-30-00-123Z"
```

### Manual Rollback

If you need to rollback without a backup:

```bash
# Stop current service
npm run service:stop

# Revert code changes
git reset --hard HEAD~1  # Go back one commit
# OR
git checkout previous-working-tag

# Clean install
rmdir /S /Q node_modules
npm install

# Rebuild
npm run build

# Start service
npm run service:start

# Verify
npm run service:status
```

## 📊 Monitoring Deployment

### Health Checks

```bash
# Service status
npm run service:status

# Comprehensive diagnostics
npm run service:diagnose

# Application logs
type logs\service.log | findstr /C:"ERROR"
type logs\service.log | findstr /C:"WARN"
```

### Windows Event Viewer

1. Open Event Viewer (`eventvwr.msc`)
2. Navigate to: Windows Logs → Application
3. Filter by Source: "ElectricityTracker"

### Application Health Check

```bash
# Test application response
powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing"

# Or open browser to check manually
start http://localhost:3000
```

## ⚠️ Common Deployment Issues

### Issue: Service Won't Stop

**Symptoms**: `npm run service:stop` hangs or fails

**Solutions**:

```bash
# Force stop via Windows
sc.exe stop "ElectricityTracker"

# If still running, find and kill process
tasklist | findstr node
taskkill /PID <pid> /F

# Check for port conflicts
netstat -ano | findstr :3000
```

### Issue: Service Won't Start After Update

**Symptoms**: Service starts but application doesn't respond

**Diagnostics**:

```bash
# Check service status
npm run service:status

# Check logs
npm run service:diagnose

# Verify environment
npm run service:validate

# Check Windows Event Viewer for detailed errors
```

**Common Fixes**:

- Verify environment variables are set correctly
- Check database connectivity
- Ensure port is available
- Verify file permissions
- Check Node.js version compatibility

### Issue: Build Failures During Upgrade

**Symptoms**: `npm run build` fails during upgrade

**Solutions**:

```bash
# Clear build cache
rmdir /S /Q .next
rmdir /S /Q node_modules
npm install
npm run build

# If still failing, check for:
# - TypeScript errors
# - Missing environment variables
# - File permission issues
```

### Issue: Database Connection Errors

**Symptoms**: Service starts but database operations fail

**Diagnostics**:

```bash
# Test database connection
npm run db:setup

# Check DATABASE_URL
echo %DATABASE_URL%

# Verify database server is running
```

## 🎯 Best Practices

### Pre-deployment

- [ ] Test changes in development environment
- [ ] Verify all environment variables are configured
- [ ] Ensure database migrations are prepared
- [ ] Check disk space for backups and builds
- [ ] Schedule deployment during maintenance window

### During Deployment

- [ ] Use automated upgrade process when possible
- [ ] Monitor deployment progress
- [ ] Verify each step completes successfully
- [ ] Keep deployment window short

### Post-deployment

- [ ] Verify service status and health
- [ ] Test critical application functionality
- [ ] Monitor logs for first 15-30 minutes
- [ ] Document any issues or changes
- [ ] Clean up old backups if needed

### Rollback Planning

- [ ] Always have a rollback plan ready
- [ ] Keep automated backups enabled
- [ ] Test rollback procedures in non-production
- [ ] Document rollback steps for your team

## 🔧 Customization

### Custom Migration Script

Create `scripts/migrate-db.js` for automatic database migrations:

```javascript
// scripts/migrate-db.js
const { execSync } = require('child_process');

async function runMigrations() {
  console.log('Running database migrations...');

  try {
    // Example: Prisma migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Example: Custom SQL scripts
    // execSync('node scripts/run-sql-migrations.js', { stdio: 'inherit' });

    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
```

### Custom Health Checks

Modify the upgrade script's `verifyUpgrade()` method for custom health checks:

```javascript
// In upgrade-service.js, customize the verification
async verifyUpgrade() {
  // Your custom health check logic
  // - Check specific API endpoints
  // - Verify database connectivity
  // - Test critical functionality
}
```

## 📞 Support and Troubleshooting

### Getting Help

1. **Check this documentation**
2. **Run diagnostics**: `npm run service:diagnose`
3. **Check logs**: Application logs and Windows Event Viewer
4. **Test manually**: Stop service and run `npm run build && npm start`
5. **Check GitHub issues** for similar problems

### Emergency Contacts

- Service fails to start: Check Windows Event Viewer
- Application not responding: Check application logs
- Database issues: Verify DATABASE_URL and connectivity
- Port conflicts: Check what's using the port

### Recovery Procedures

```bash
# Complete service reinstall (last resort)
npm run service:uninstall
npm run service:install

# Reset to clean state
npm run service:stop
rmdir /S /Q .next
rmdir /S /Q node_modules
npm install
npm run build
npm run service:start
```

---

## 📋 Quick Reference

| Task                  | Command                                                |
| --------------------- | ------------------------------------------------------ |
| **Automated Upgrade** | `npm run service:upgrade`                              |
| **Manual Stop**       | `npm run service:stop`                                 |
| **Manual Start**      | `npm run service:start`                                |
| **Check Status**      | `npm run service:status`                               |
| **Run Diagnostics**   | `npm run service:diagnose`                             |
| **Validate Config**   | `npm run service:validate`                             |
| **Rollback**          | `npm run service:rollback <backup-path>`               |
| **Reinstall Service** | `npm run service:uninstall && npm run service:install` |

**Remember**: Always run as Administrator for service operations!
