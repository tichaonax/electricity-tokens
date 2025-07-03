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

### Database Corruption Recovery

1. **Stop Application Traffic**

   ```bash
   # Temporary maintenance mode
   vercel env add MAINTENANCE_MODE true
   vercel --prod
   ```

2. **Assess Damage**

   ```bash
   npx prisma studio
   # Manual inspection of critical tables
   ```

3. **Restore from Backup** (if available)
   - Use admin backup/restore functionality
   - Or restore database snapshot from provider

4. **Re-enable Application**
   ```bash
   vercel env rm MAINTENANCE_MODE
   vercel --prod
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

### Full Data Loss Recovery

1. **Assess Available Backups**
   - Check most recent backup timestamps
   - Verify backup integrity

2. **Prepare Clean Environment**

   ```bash
   # Deploy fresh application instance
   git checkout main
   vercel --prod
   ```

3. **Restore Database Schema**

   ```bash
   npx prisma db push --force-reset
   npx prisma generate
   ```

4. **Restore Data from Backup**
   - Use admin backup restore functionality
   - Verify data integrity after restore
   - Test critical application functions

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

### Backup Schedule

- **Full Backup**: Weekly (Sundays at 2 AM UTC)
- **Incremental Backup**: Daily (2 AM UTC)
- **Critical Data Snapshot**: Before major deployments

### Backup Verification

```bash
# Weekly backup verification
curl -X POST https://your-app.vercel.app/api/admin/backup/verify \
  -H "Content-Type: application/json" \
  -d @latest-backup.json
```

### Backup Storage

1. **Primary**: Local admin download
2. **Secondary**: Cloud storage (S3, Google Drive)
3. **Tertiary**: Offline storage for critical backups

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

### Useful Commands

```bash
# Check application status
vercel ls
vercel logs [deployment-url]

# Database operations
npx prisma studio
npx prisma db push --preview-feature
npx prisma migrate reset

# Environment variables
vercel env ls
vercel env pull .env.local

# Backup operations
curl -X GET https://your-app.vercel.app/api/admin/backup
curl -X POST https://your-app.vercel.app/api/admin/backup \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

---

**Remember**: Always test recovery procedures in a non-production environment first!

**Emergency Hotline**: This document should be easily accessible during emergencies.
