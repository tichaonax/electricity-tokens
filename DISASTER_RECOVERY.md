# Disaster Recovery Plan - Electricity Tokens Tracker

## 🚨 Emergency Response Procedures

### Immediate Response (First 15 minutes)

1. **Assess the Situation**
   - Is the application accessible?
   - Is the database responding?
   - Are users reporting issues?

2. **Check Health Status**

   ```bash
   curl https://your-app.vercel.app/healthz
   ```

3. **Check Vercel Dashboard**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Check deployment status
   - Review function logs

4. **Check Database Status**
   - Access your database provider dashboard
   - Verify connection limits and performance

### Recovery Procedures by Incident Type

## 🔥 Application Down (Complete Outage)

### Symptoms

- Health check endpoint returns 503
- Users cannot access the application
- Vercel dashboard shows deployment failures

### Recovery Steps

1. **Check Recent Deployments**

   ```bash
   vercel --version
   vercel ls
   vercel logs
   ```

2. **Rollback to Previous Version**

   ```bash
   vercel rollback
   # Or via dashboard: Deployments → Previous deployment → Promote
   ```

3. **If Rollback Fails - Redeploy**

   ```bash
   git log --oneline -10  # Find last working commit
   git checkout <last-working-commit>
   vercel --prod
   ```

4. **Verify Recovery**
   - Check health endpoint
   - Test critical user flows
   - Monitor error rates

## 💾 Database Issues

### Symptoms

- Health check shows database connection failed
- API endpoints return 500 errors
- Users report data not loading

### Recovery Steps

1. **Check Database Provider Status**
   - Vercel Postgres: Check Vercel dashboard
   - Supabase: Check [Supabase Status](https://status.supabase.com)
   - Railway: Check Railway dashboard

2. **Verify Connection Strings**

   ```bash
   vercel env ls
   # Ensure DATABASE_URL is correct
   ```

3. **Test Database Connection**

   ```bash
   npx prisma db push --preview-feature
   npx prisma studio  # Test locally
   ```

4. **Check Connection Pool Limits**
   - Review active connections in database dashboard
   - Consider temporarily scaling down if pool is exhausted

### Database Corruption Recovery (v1.4.0 Schema)

1. **Stop Application Traffic**

   ```bash
   # Temporary maintenance mode
   vercel env add MAINTENANCE_MODE true
   vercel --prod
   ```

2. **Assess Damage (v1.4.0 Critical Tables)**

   ```bash
   # Check schema integrity
   npx prisma studio

   # Manual inspection of critical v1.4.0 tables
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE theme_preference IS NULL;"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM meter_readings WHERE reading IS NULL;"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_contributions WHERE purchase_id IS NOT NULL;"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs WHERE timestamp IS NULL;"

   # Verify schema version
   psql $DATABASE_URL -c "\\d users" | grep theme_preference
   psql $DATABASE_URL -c "\\dt" | grep meter_readings
   ```

3. **Restore from v1.4.0 Compatible Backup**

   ```bash
   # Use admin backup/restore with schema validation
   curl -X POST https://your-app.vercel.app/api/admin/restore \
     -H "Content-Type: application/json" \
     -d '{"backupFile": "backup-v1.4.0.json", "validateSchema": true}'

   # Or restore database snapshot with migration verification
   node scripts/verify-migration.js --post-restore
   ```

4. **Verify v1.4.0 Schema Integrity**

   ```bash
   # Verify theme preferences are intact
   psql $DATABASE_URL -c "SELECT COUNT(*) as users_with_themes FROM users WHERE theme_preference IS NOT NULL;"

   # Verify meter readings continuity
   psql $DATABASE_URL -c "SELECT COUNT(*) as meter_readings_total FROM meter_readings;"

   # Verify audit log completeness
   psql $DATABASE_URL -c "SELECT COUNT(*) as audit_entries FROM audit_logs WHERE timestamp > NOW() - INTERVAL '30 days';"

   # Verify one-to-one purchase constraints
   psql $DATABASE_URL -c "SELECT COUNT(*) as unique_contributions FROM user_contributions;"
   ```

5. **Re-enable Application**

   ```bash
   vercel env rm MAINTENANCE_MODE
   vercel --prod

   # Verify v1.4.0 features work
   curl https://your-app.vercel.app/api/health
   curl https://your-app.vercel.app/api/user/theme
   ```

## 🔐 Security Incident Response

### Data Breach Suspected

1. **Immediate Actions**
   - Change all admin passwords
   - Rotate JWT secrets
   - Review audit logs for suspicious activity

2. **Lock Down System**

   ```bash
   # Temporarily restrict access
   vercel env add EMERGENCY_LOCKDOWN true
   vercel --prod
   ```

3. **Investigate**
   - Check Sentry for unusual error patterns
   - Review audit trail for unauthorized access
   - Check rate limiting logs

4. **Recovery**
   - Patch security vulnerabilities
   - Update all secrets and keys
   - Notify affected users if necessary

### Unauthorized Access

1. **Lock Affected Accounts**
   - Use admin panel to lock suspicious accounts
   - Force password resets for all admin users

2. **Review Permissions**
   - Audit user roles and permissions
   - Remove unnecessary admin privileges

3. **Monitor Activity**
   - Increase audit logging level
   - Monitor authentication attempts

## 🗄️ Data Recovery Procedures

### Full Data Loss Recovery (v1.4.0)

1. **Assess Available v1.4.0 Backups**
   - Check most recent backup timestamps with schema version tags
   - Verify backup includes all 8 tables: users, accounts, sessions, verification_tokens, token_purchases, user_contributions, audit_logs, meter_readings
   - Validate theme preferences and meter readings data

2. **Prepare Clean v1.4.0 Environment**

   ```bash
   # Deploy fresh application instance with v1.4.0 schema
   git checkout v1.4.0  # or main if updated
   vercel --prod

   # Verify environment variables for v1.4.0
   vercel env add DB_SCHEMA_VERSION 1.4.0
   vercel env add DEFAULT_THEME system
   ```

3. **Restore v1.4.0 Database Schema**

   ```bash
   # Reset to clean v1.4.0 schema
   npx prisma db push --force-reset
   npx prisma generate

   # Verify v1.4.0 schema is properly deployed
   npx prisma studio
   psql $DATABASE_URL -c "\\d users" | grep theme_preference
   psql $DATABASE_URL -c "\\dt" | grep meter_readings
   ```

4. **Restore Data from v1.4.0 Backup**

   ```bash
   # Use admin backup restore with v1.4.0 validation
   curl -X POST https://your-app.vercel.app/api/admin/restore \
     -H "Content-Type: application/json" \
     -d '{"backupFile": "backup-v1.4.0-full.json", "validateSchema": true, "verifyMeterReadings": true}'

   # Run post-restore verification
   node scripts/verify-migration.js --verify-v1.4.0
   ```

5. **Verify v1.4.0 Data Integrity**

   ```bash
   # Test critical v1.4.0 functions
   curl https://your-app.vercel.app/api/health
   curl https://your-app.vercel.app/api/user/theme
   curl https://your-app.vercel.app/api/meter-readings

   # Verify theme preferences work
   curl -X PUT https://your-app.vercel.app/api/user/theme \
     -H "Content-Type: application/json" \
     -d '{"theme": "dark"}'

   # Verify meter readings functionality
   curl https://your-app.vercel.app/api/meter-readings/latest

   # Test one-to-one purchase constraint
   # (attempt to create duplicate contribution should fail)
   ```

### Partial Data Recovery

1. **Identify Missing Data**
   - Compare current state with backups
   - Identify specific tables or records affected

2. **Selective Restore**
   - Use incremental backup if available
   - Manually restore specific records if needed

3. **Data Validation**
   - Run data consistency checks
   - Verify business rule compliance

## 📊 Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Health**
   - Response time (< 2 seconds)
   - Error rate (< 1%)
   - Uptime (> 99.9%)

2. **Database Performance**
   - Connection count (< 80% of limit)
   - Query response time (< 500ms)
   - Storage usage (< 90% of limit)

3. **User Activity**
   - Failed login attempts
   - Unusual access patterns
   - Data modification rates

### Automated Alerts Setup

```javascript
// Example monitoring script
const healthCheck = async () => {
  try {
    const response = await fetch('https://your-app.vercel.app/healthz');
    const data = await response.json();

    if (data.status !== 'healthy') {
      // Send alert (email, Slack, etc.)
      console.error('Health check failed:', data);
    }
  } catch (error) {
    // Send alert
    console.error('Health check error:', error);
  }
};

// Run every 5 minutes
setInterval(healthCheck, 5 * 60 * 1000);
```

## 🔄 Backup Strategy

### Schema v1.4.0 Backup Considerations

The v1.4.0 schema includes new critical tables and fields that must be included in all backup procedures:

**New Schema Elements to Backup:**

- **Theme Preferences**: `users.themePreference` field (user experience continuity)
- **Meter Readings**: Complete `meter_readings` table (consumption tracking history)
- **Enhanced Audit Logs**: `audit_logs` table with metadata (compliance and security)
- **One-to-One Purchase Constraints**: Enforced unique relationships in `user_contributions`

### Backup Schedule

- **Full Backup**: Weekly (Sundays at 2 AM UTC)
  - Includes all 8 tables: users, accounts, sessions, verification_tokens, token_purchases, user_contributions, audit_logs, meter_readings
- **Incremental Backup**: Daily (2 AM UTC)
  - Focuses on transactional data: token_purchases, user_contributions, meter_readings, audit_logs
- **Critical Data Snapshot**: Before major deployments
  - Schema validation backup before migrations
- **Theme Preferences Backup**: Before user management changes
  - Ensures user experience settings are preserved

### Backup Verification

```bash
# Weekly backup verification with v1.4.0 schema
curl -X POST https://your-app.vercel.app/api/admin/backup/verify \
  -H "Content-Type: application/json" \
  -d @latest-backup.json

# Verify theme preferences are included
curl -X GET https://your-app.vercel.app/api/admin/backup/validate-schema \
  -H "Authorization: Bearer [admin-token]"

# Verify meter readings data integrity
curl -X POST https://your-app.vercel.app/api/admin/backup/verify-meter-readings \
  -H "Content-Type: application/json" \
  -d @backup-file.json
```

### Backup Storage

1. **Primary**: Local admin download with schema version tags
2. **Secondary**: Cloud storage (S3, Google Drive) with v1.4.0 schema documentation
3. **Tertiary**: Offline storage for critical backups with migration scripts
4. **Schema Documentation**: Backup procedures documented with v1.4.0 table structure

### v1.4.0 Migration Backup Protocol

**Before Schema Migration:**

```bash
# Create pre-migration backup
curl -X POST https://your-app.vercel.app/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"type": "full", "tag": "pre-v1.4.0-migration", "includeAuditLogs": true}'

# Verify backup includes all legacy data
node scripts/verify-migration.js --backup-file=pre-migration-backup.json
```

**After Schema Migration:**

```bash
# Create post-migration verification backup
curl -X POST https://your-app.vercel.app/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"type": "full", "tag": "post-v1.4.0-migration", "includeThemePreferences": true}'

# Verify new schema elements are captured
node scripts/verify-migration.js --verify-v1.4.0
```

## 🚀 Recovery Testing

### Monthly Recovery Drills

1. **Test Health Checks**
   - Verify all monitoring endpoints
   - Test alert notifications

2. **Practice Rollback**
   - Deploy test version
   - Practice rollback procedure
   - Measure recovery time

3. **Backup Restore Test**
   - Test backup integrity verification
   - Practice restore procedure (dry run)
   - Validate restored data

### Annual Disaster Simulation

1. **Full System Failure**
   - Simulate complete application failure
   - Practice full recovery procedure
   - Document lessons learned

2. **Data Loss Simulation**
   - Test backup and restore procedures
   - Verify data integrity post-recovery
   - Measure recovery time objectives

## 📞 Emergency Contacts

### Technical Contacts

- **Admin Users**: [List admin email addresses]
- **Database Provider Support**: [Provider support contact]
- **Hosting Provider Support**: [Vercel support]

### Communication Plan

1. **Internal Team**: Slack/Email notification
2. **Users**: Application banner + email notification
3. **Stakeholders**: Status page update

## 📝 Recovery Documentation

### Incident Report Template

```markdown
# Incident Report: [Date] - [Brief Description]

## Timeline

- **Detection**: [Time and method]
- **Response Started**: [Time and first actions]
- **Resolution**: [Time and final actions]

## Impact

- **Duration**: [Total downtime]
- **Users Affected**: [Number/percentage]
- **Data Impact**: [Any data loss or corruption]

## Root Cause

[Detailed analysis of what caused the incident]

## Resolution

[Steps taken to resolve the issue]

## Prevention

[Actions to prevent similar incidents]

## Lessons Learned

[Key takeaways and improvements]
```

### Recovery Time Objectives (RTO)

- **Application Recovery**: < 30 minutes
- **Database Recovery**: < 2 hours
- **Full System Recovery**: < 4 hours
- **Data Recovery**: < 24 hours

### Recovery Point Objectives (RPO)

- **Incremental Data Loss**: < 24 hours
- **Full Data Loss**: < 1 week
- **Critical Data**: < 1 hour (with real-time backup)

## 🔧 Tools and Resources

### Essential Tools

- **Vercel CLI**: Deployment and rollback
- **Prisma CLI**: Database management
- **curl/Postman**: API testing
- **Database client**: Direct database access

### Useful Commands (v1.4.0)

```bash
# Check application status
vercel ls
vercel logs [deployment-url]

# Database operations with v1.4.0 schema
npx prisma studio
npx prisma db push --preview-feature
npx prisma migrate reset
npx prisma migrate status

# Verify v1.4.0 schema integrity
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'theme_preference';"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM meter_readings;"

# Environment variables for v1.4.0
vercel env ls
vercel env pull .env.local
vercel env add DB_SCHEMA_VERSION 1.4.0
vercel env add DEFAULT_THEME system

# v1.4.0 Backup operations
curl -X GET https://your-app.vercel.app/api/admin/backup
curl -X POST https://your-app.vercel.app/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"type": "full", "includeThemePreferences": true, "includeMeterReadings": true}'

# v1.4.0 Migration and verification
node scripts/migrate-to-v1.4.0.js --dry-run
node scripts/verify-migration.js --verify-v1.4.0
node scripts/verify-migration.js --backup-file=backup.json

# Theme preference recovery
curl -X GET https://your-app.vercel.app/api/user/theme
curl -X PUT https://your-app.vercel.app/api/user/theme \
  -H "Content-Type: application/json" \
  -d '{"theme": "system"}'

# Meter readings recovery verification
curl -X GET https://your-app.vercel.app/api/meter-readings/latest
curl -X GET https://your-app.vercel.app/api/meter-readings?limit=10
```

---

**Remember**: Always test recovery procedures in a non-production environment first!

**Emergency Hotline**: This document should be easily accessible during emergencies.
