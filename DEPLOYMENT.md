# Deployment Guide - Electricity Tokens Tracker

## 🚀 Vercel Deployment (Recommended)

### Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL Database**: Set up a production database (recommended providers below)

### Recommended Database Providers

#### Option 1: Vercel Postgres (Easiest)

- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- Create a new Postgres database
- Copy the connection string for `DATABASE_URL`

#### Option 2: Supabase (Free tier available)

- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Go to Settings → Database → Connection string
- Use the connection pooling URL for better performance

#### Option 3: Railway (Simple setup)

- Sign up at [railway.app](https://railway.app)
- Add a PostgreSQL service
- Copy the connection string

### Step-by-Step Deployment

#### 1. Connect GitHub Repository

```bash
# Push your code to GitHub first
git add .
git commit -m "Ready for production deployment"
git push origin main
```

#### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### 3. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

**Required Variables:**

```
DATABASE_URL=postgresql://username:password@host:5432/electricity_tokens_prod?sslmode=require
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-32-character-secret-here
```

**Security Variables:**

```
CSRF_SECRET=your-csrf-secret-32-chars
ENCRYPTION_KEY=your-encryption-key-32-chars
RATE_LIMIT_SECRET=your-rate-limit-secret
```

**Monitoring Variables (Optional):**

```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-organization
SENTRY_PROJECT=electricity-tokens-tracker
```

**App Configuration:**

```
NODE_ENV=production
APP_NAME=Electricity Tokens Tracker
ADMIN_EMAIL=admin@yourdomain.com
DB_SCHEMA_VERSION=1.4.0
```

**Theme Configuration (Optional):**

```
DEFAULT_THEME=system
THEME_STORAGE_ENABLED=true
```

#### 4. Deploy Database Schema

After first deployment, initialize the database:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Initialize database (one time only)
npm run db:init

# Alternative manual commands if above fails:
# npx prisma generate
# npx prisma db push --accept-data-loss
```

**⚠️ Important**: If you get a 500 error on first sign-in, it means the database tables weren't created. Run the database initialization:

```bash
npm run db:init
```

**Schema Version**: This deployment uses Database Schema v1.4.0 which includes:

- User theme preferences
- Enhanced audit logging with metadata
- Meter readings table for consumption tracking
- Mobile-responsive design optimizations
- One-to-one purchase-contribution constraints

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed troubleshooting.

#### 5. Create Admin User

After deployment, create your first admin user:

```bash
# Using the web interface (recommended)
# Visit: https://your-app.vercel.app/auth/register
# Register with your admin email
# Then promote to admin in database or via script

# Or via database query
# Connect to your production database and run:
# UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

### Post-Deployment Checklist

**Core Functionality:**

- [ ] Health check works: `https://your-app.vercel.app/api/health`
- [ ] Admin user created and can login
- [ ] Database schema v1.4.0 deployed correctly
- [ ] All environment variables configured
- [ ] HTTPS redirects working

**New Features (v1.4.0):**

- [ ] Theme preferences working (test light/dark/system modes)
- [ ] Theme persistence across user sessions
- [ ] Meter readings interface functional
- [ ] Mobile responsive design working on various devices
- [ ] Audit trail showing creation/modification info
- [ ] Running balance calculations using latest meter readings

**Mobile Experience:**

- [ ] PWA functionality works on mobile devices
- [ ] Card-based layouts display correctly on mobile
- [ ] No horizontal scrolling on mobile viewports
- [ ] Touch interactions work properly
- [ ] Mobile navigation accessible

**System Monitoring:**

- [ ] System monitoring dashboard accessible: `/dashboard/admin/monitoring`
- [ ] Backup system configured and tested
- [ ] Error tracking (Sentry) working correctly
- [ ] Audit logs accessible to admin users
- [ ] Theme API endpoints responding correctly

## 🔒 Security Configuration

### SSL/TLS

- Vercel automatically provides SSL certificates
- Force HTTPS redirects are configured in `vercel.json`

### Security Headers

Security headers are configured in:

- `next.config.js` (application level)
- `vercel.json` (deployment level)

### Database Security

- Always use connection pooling in production
- Enable SSL mode (`sslmode=require`)
- Use strong passwords and rotate regularly

## 📊 Monitoring Setup

### Health Monitoring

- Health endpoint: `/api/health`
- System monitoring dashboard: `/dashboard/admin/monitoring`
- Monitor database connectivity, performance, and memory usage
- Check environment variables and system integrity
- Real-time error tracking via Sentry integration

### Performance Monitoring

```bash
# Install Vercel Analytics (optional)
npm install @vercel/analytics
```

Add to your `_app.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

## 🔄 Continuous Deployment

### Automatic Deployments

- Production: Deploys automatically from `main` branch
- Preview: Deploys automatically from pull requests

### Branch Strategy

```
main → Production deployment
develop → Preview deployment
feature/* → Preview deployment on PR
```

## 🛠 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check environment variables
vercel env ls

# Test database connection
npx prisma db push --preview-feature
```

#### Build Failures

```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies
```

#### Performance Issues

```bash
# Check function execution time
# API routes should complete within 30 seconds
# Consider database query optimization
```

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment/production)

## 🔧 Advanced Configuration

### Custom Domain

1. Add domain in Vercel dashboard
2. Configure DNS records
3. Update `NEXTAUTH_URL` environment variable

### Database Backups

The application includes built-in backup and recovery capabilities:

**Built-in Backup System:**

- Admin backup API: `/api/admin/backup`
- Backup verification: `/api/admin/backup/verify`
- Restore functionality: `/api/admin/backup/restore`
- Automated backup recommendations based on system activity

**Schema v1.4.0 Backup Considerations:**

- Includes user theme preferences in backup
- Preserves meter reading history
- Maintains comprehensive audit trail with metadata
- Backup format compatible with upgrade procedures

**External Database Backups:**

- Vercel Postgres: Automatic backups included
- Supabase: Configure backup schedule in dashboard
- Railway: Enable automatic backups in project settings

**Backup Best Practices:**

- Test backup integrity regularly via the admin dashboard
- Store backups in multiple locations
- Document disaster recovery procedures (see DISASTER_RECOVERY.md)
- Create backup before upgrading from earlier schema versions

### Error Tracking

Consider adding Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

## 📈 Scaling Considerations

### Performance Optimization

- Enable Vercel Edge Functions for global distribution
- Use Vercel KV for session storage (high traffic)
- Implement Redis caching for reports
- Optimize meter reading queries with proper indexing
- Cache theme preferences to reduce database calls
- Use responsive image optimization for mobile devices

### Database Optimization

- Connection pooling (already configured)
- Read replicas for reporting queries
- Database indexing for frequently queried columns

---

**Need Help?**

- Check the health endpoint: `https://your-app.vercel.app/api/health`
- View system monitoring: `https://your-app.vercel.app/dashboard/admin/monitoring`
- Review error logs in Sentry dashboard
- Consult TROUBLESHOOTING.md for common issues
