# Troubleshooting Guide - Electricity Tokens Tracker

## 🚨 Quick Diagnostics

Before diving into specific issues, run these quick checks:

1. **Health Check**: Visit `/api/health` to see overall system status
2. **System Monitoring**: Visit `/dashboard/admin/monitoring` (admin required)
3. **Browser Console**: Check for JavaScript errors (F12 → Console)
4. **Network Tab**: Check for failed API requests (F12 → Network)

## 🔧 Common Issues and Solutions

### Authentication Issues

#### Problem: "Invalid credentials" or login fails
**Symptoms:**
- Cannot log in with correct credentials
- Session expires immediately
- Redirected to login page repeatedly

**Solutions:**

1. **Check environment variables:**
```bash
# Verify these are set correctly
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here
```

2. **Clear browser data:**
- Clear cookies and localStorage
- Try incognito/private browsing mode
- Disable browser extensions

3. **Database connection:**
```bash
# Test database connectivity
npx prisma db push --preview-feature
```

4. **Session table cleanup:**
```sql
-- Remove expired sessions
DELETE FROM sessions WHERE expires < NOW();
```

#### Problem: "CSRF token mismatch"
**Symptoms:**
- Forms fail to submit
- "Invalid CSRF token" error messages

**Solutions:**

1. **Check CSRF configuration:**
```javascript
// Verify CSRF_SECRET environment variable is set
CSRF_SECRET=your-32-character-secret
```

2. **Clear browser cache:**
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Clear site data completely

3. **Check network configuration:**
- Ensure cookies are enabled
- Check for proxy/VPN interference

---

### Database Issues

#### Problem: "Database connection failed"
**Symptoms:**
- 500 errors on all pages
- "Cannot connect to database" messages
- Health check shows database as "fail"

**Solutions:**

1. **Verify DATABASE_URL:**
```bash
# Format should be:
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

2. **Connection string validation:**
```bash
# Test connection
npx prisma db push
npx prisma generate
```

3. **Check database provider status:**
- Vercel Postgres: Check Vercel dashboard
- Supabase: Check Supabase status page
- Railway: Check Railway dashboard

4. **Connection pool issues:**
```bash
# Restart the application to reset connections
# In production: redeploy or restart server
```

#### Problem: "Constraint violation" errors
**Symptoms:**
- Cannot create purchases/contributions
- "Unique constraint failed" errors
- "Foreign key constraint failed" errors

**Solutions:**

1. **Check data integrity:**
```sql
-- Verify user exists before creating purchases
SELECT id, email FROM users WHERE email = 'user@example.com';

-- Check for orphaned contributions
SELECT * FROM user_contributions uc 
LEFT JOIN token_purchases tp ON uc.purchase_id = tp.id 
WHERE tp.id IS NULL;
```

2. **Sequential meter reading issues:**
- Ensure new purchases have higher meter readings than previous ones
- Check the validation endpoint: `/api/validate-meter-reading`

3. **One-to-one contribution constraint:**
- Each purchase can only have one contribution
- Delete existing contribution before creating new one

---

### Performance Issues

#### Problem: Slow page loads
**Symptoms:**
- Pages take >5 seconds to load
- Database timeouts
- High memory usage warnings

**Solutions:**

1. **Check system monitoring:**
- Visit `/dashboard/admin/monitoring`
- Look for memory usage >500MB
- Check database connection count

2. **Database query optimization:**
```bash
# Check for slow queries in logs
# Look for queries taking >500ms
```

3. **Clear application cache:**
```bash
# Restart application
# Clear browser cache
# Check for memory leaks in browser
```

4. **Connection pool tuning:**
```javascript
// In database configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool parameters if needed
}
```

#### Problem: API timeouts
**Symptoms:**
- 504 Gateway Timeout errors
- Requests taking >30 seconds
- Function execution time exceeded

**Solutions:**

1. **Optimize database queries:**
- Add missing indexes
- Reduce data fetching in single queries
- Use pagination for large datasets

2. **Check Vercel function limits:**
- Serverless functions have 30-second limit
- Break down complex operations
- Use background processing for heavy tasks

---

### UI/UX Issues

#### Problem: Dark mode not working
**Symptoms:**
- Dark mode toggle doesn't work
- Inconsistent color schemes
- Theme not persisting

**Solutions:**

1. **Clear localStorage:**
```javascript
// In browser console
localStorage.removeItem('theme');
localStorage.clear();
```

2. **Check CSS classes:**
- Verify `dark:` classes are applied
- Check Tailwind CSS configuration
- Inspect element styles in browser

#### Problem: Mobile layout broken
**Symptoms:**
- Overlapping elements on mobile
- Buttons not responsive
- Text too small or large

**Solutions:**

1. **Viewport meta tag:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

2. **CSS responsive issues:**
- Check `sm:`, `md:`, `lg:` classes
- Test on different screen sizes
- Use browser developer tools device simulation

---

### Data Import/Export Issues

#### Problem: CSV import fails
**Symptoms:**
- "Invalid CSV format" errors
- Data not importing correctly
- Missing fields in import

**Solutions:**

1. **CSV format validation:**
```csv
# Required format for purchases:
totalTokens,totalPayment,meterReading,purchaseDate,isEmergency
100,150.50,5000,2024-01-15T10:00:00Z,false
```

2. **Date format issues:**
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Ensure timezone is included
- Check for invalid dates

3. **Encoding issues:**
- Save CSV as UTF-8
- Remove special characters
- Check for hidden characters

#### Problem: Export downloads fail
**Symptoms:**
- Export button doesn't work
- Downloaded files are empty
- Browser blocks download

**Solutions:**

1. **Browser settings:**
- Enable downloads in browser
- Check popup blocker settings
- Clear download history

2. **File size issues:**
- Large exports may timeout
- Use date range filtering
- Export smaller data sets

---

### Admin Panel Issues

#### Problem: Cannot access admin features
**Symptoms:**
- 403 Forbidden errors
- Admin menu not visible
- "Insufficient permissions" messages

**Solutions:**

1. **Check user role:**
```sql
-- Verify user has admin role
SELECT email, role FROM users WHERE email = 'your-email@example.com';

-- Update user to admin if needed
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

2. **Session refresh:**
- Log out and log back in
- Clear browser cookies
- Restart browser

#### Problem: User management functions not working
**Symptoms:**
- Cannot lock/unlock users
- Role changes don't save
- User list doesn't load

**Solutions:**

1. **Database permissions:**
```sql
-- Check user table constraints
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

2. **Audit log issues:**
```sql
-- Check if audit logging is working
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

---

### Backup and Recovery Issues

#### Problem: Backup creation fails
**Symptoms:**
- "Backup failed" error messages
- Empty backup files
- Verification errors

**Solutions:**

1. **Check backup permissions:**
- Ensure admin user is logged in
- Verify database access permissions
- Check available disk space

2. **Database connectivity:**
```bash
# Test database queries
npx prisma studio
```

3. **Backup size issues:**
- Large databases may timeout
- Use incremental backups for large datasets
- Check memory usage during backup

#### Problem: Restore operation fails
**Symptoms:**
- "Restore failed" errors
- Data corruption after restore
- Incomplete restoration

**Solutions:**

1. **Backup verification:**
- Always verify backup integrity first
- Use the `/api/admin/backup/verify` endpoint
- Check checksums match

2. **Dry run testing:**
```javascript
// Always test restore with dry run first
{
  "dryRun": true,
  "backupData": {...}
}
```

---

### Production Environment Issues

#### Problem: Environment variables not loading
**Symptoms:**
- 500 errors after deployment
- "Missing environment variable" errors
- Features not working in production

**Solutions:**

1. **Vercel environment variables:**
- Check Vercel dashboard → Settings → Environment Variables
- Ensure variables are set for "Production" environment
- Redeploy after adding variables

2. **Variable validation:**
```bash
# Check which variables are missing
vercel env ls
```

3. **Case sensitivity:**
- Environment variable names are case-sensitive
- Check for typos in variable names

#### Problem: Build failures
**Symptoms:**
- Deployment fails during build
- TypeScript compilation errors
- Missing dependencies

**Solutions:**

1. **Check build logs:**
- Review detailed error messages in Vercel dashboard
- Look for specific file/line causing issues

2. **Dependencies:**
```bash
# Ensure all dependencies are installed
npm install
npm run build
```

3. **TypeScript errors:**
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

---

## 🛠 Advanced Troubleshooting

### Database Debugging

#### Enable query logging:
```javascript
// In Prisma client initialization
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

#### Check database statistics:
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### Performance Profiling

#### Client-side debugging:
```javascript
// In browser console
// Check for memory leaks
performance.memory

// Monitor network requests
console.log(performance.getEntriesByType('navigation'));
```

#### Server-side monitoring:
```bash
# Check function execution times in Vercel dashboard
# Monitor database connection pool usage
# Review Sentry error reports
```

### Security Debugging

#### Check session management:
```sql
-- Active sessions
SELECT * FROM sessions WHERE expires > NOW();

-- Session cleanup
DELETE FROM sessions WHERE expires < NOW();
```

#### CSRF token debugging:
```javascript
// In browser console
// Check CSRF token in forms
document.querySelector('input[name="csrfToken"]').value
```

---

## 📞 Getting Help

### Before Contacting Support

1. **Check system health**: `/api/health`
2. **Review error logs**: Browser console + Sentry
3. **Verify environment**: Development vs Production
4. **Document steps**: How to reproduce the issue

### Information to Provide

- **Error message**: Exact text and screenshot
- **Browser/Device**: Version and type
- **User role**: Admin or regular user
- **Environment**: Development or production URL
- **Steps to reproduce**: Detailed sequence
- **Expected vs actual behavior**

### Self-Help Resources

- **Health Check**: `/api/health`
- **System Monitoring**: `/dashboard/admin/monitoring`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Database Schema**: `DATABASE_SCHEMA.md`
- **Deployment Guide**: `DEPLOYMENT.md`

### Emergency Procedures

#### System Down
1. Check health endpoint immediately
2. Review Vercel deployment status
3. Check database provider status
4. Restart application if needed

#### Data Loss Prevention
1. Stop all write operations
2. Create immediate backup
3. Verify backup integrity
4. Document the issue
5. Contact support with details

#### Security Incident
1. Immediately lock affected user accounts
2. Review audit logs for suspicious activity
3. Rotate sensitive keys/secrets
4. Document incident details
5. Report if data breach suspected

---

Remember: When in doubt, check the system monitoring dashboard first. Many issues can be diagnosed from the real-time health and performance metrics available there.