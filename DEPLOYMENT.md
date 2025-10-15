# 🚀 Deployment Guide

## Electricity Tokens Tracker - Professional Installation & Upgrades

This comprehensive guide covers fresh installations, upgrades, and deployment options including professional Windows service deployment and cloud hosting.

---

## � Table of Contents

1. [Fresh Installation - Windows Service](#fresh-installation---windows-service)
2. [Cloud Deployment - Vercel](#cloud-deployment---vercel)
3. [Upgrade Procedures](#upgrade-procedures)
4. [Environment Configuration](#environment-configuration)
5. [Service Management](#service-management)
6. [Database Setup](#database-setup)
7. [Troubleshooting](#troubleshooting)
8. [Production Best Practices](#production-best-practices)

---

## 🏢 Fresh Installation - Windows Service

### System Requirements

#### Minimum Requirements

- **OS**: Windows Server 2016+ or Windows 10+
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB available space
- **Database**: PostgreSQL 12+ or MySQL 8.0+

#### Recommended for Production

- **OS**: Windows Server 2019+
- **CPU**: 4+ cores, 2.5+ GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: Stable broadband connection

### Quick Installation (One Command)

**Run as Administrator:**

```bash
git clone https://github.com/tichaonax/electricity-tokens.git
cd electricity-tokens
npm run install:auto
```

This automatically handles:

- ✅ **Dependencies**: All Node.js packages and build tools
- ✅ **Database**: Schema creation, migrations, and seeding
- ✅ **Build**: Production-optimized application build
- ✅ **Service**: Windows service installation (silent operation)
- ✅ **Monitoring**: Health monitoring with auto-restart
- ✅ **Git Hooks**: Automatic updates on git pull

### Detailed Installation Steps

#### Step 1: Prerequisites

```bash
# Verify required software
node --version  # Should be v18.0.0+
npm --version   # Should be v8.0.0+
git --version   # Any recent version
```

#### Step 2: Database Setup

Create production database:

```sql
-- PostgreSQL (Recommended)
CREATE DATABASE electricity_tokens;
CREATE USER electricity_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE electricity_tokens TO electricity_user;
```

#### Step 3: Environment Configuration

Create `.env` file in root directory:

```env
# Database Configuration (REQUIRED)
DATABASE_URL="postgresql://electricity_user:secure_password@localhost:5432/electricity_tokens"

# Security Configuration (REQUIRED)
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# Production Configuration
NODE_ENV="production"
PORT=3000
APP_NAME="Electricity Tokens Tracker"
ADMIN_EMAIL="admin@your-domain.com"

# Optional: Enhanced Security
BCRYPT_ROUNDS=12
LOG_LEVEL="warn"
AUDIT_IP_TRACKING=true
AUDIT_USER_AGENT_TRACKING=true

# Database Schema Version
DB_SCHEMA_VERSION="1.4.0"
```

#### Step 4: Installation Verification

```bash
# Verify complete installation
npm run install:verify

# Check service status
npm run service:diagnose

# Test health monitoring
npm run health:check

# Create admin user
node scripts/create-admin.js admin@your-domain.com "SecurePassword123"
```

### Windows Service Features

- ✅ **Silent Operation**: No terminal windows
- ✅ **Auto-Start**: Starts with Windows
- ✅ **Auto-Recovery**: Restarts on failures
- ✅ **Health Monitoring**: Continuous monitoring every 30 seconds
- ✅ **Smart Restart**: Proper shutdown timing
- ✅ **Professional Logging**: Comprehensive logs

---

## ☁️ Cloud Deployment - Vercel

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
- Enhanced audit logging with metadata field for IP tracking
- Meter readings table for consumption tracking
- Mobile-responsive design optimizations
- **One-to-one purchase-contribution constraints** (enforced at database level)
- Last login tracking for users
- Account balance permission system with restricted default access

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
- [ ] Audit trail showing creation/modification info with metadata
- [ ] Running balance calculations using latest meter readings
- [ ] Permission system with restricted dashboard access (test with regular user)
- [ ] One-to-one purchase-contribution constraint enforcement
- [ ] Backup system with audit log inclusion option

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

- Backup API: `/api/backup` (GET to download, POST to restore)
- Backup types: `full`, `users`, `purchase-data`
- Optional audit log inclusion: `includeAuditLogs=true` parameter
- Automatic constraint validation during backup and restore
- Automatic balance recalculation after restore

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

## 🔄 Upgrade Procedures

### Automatic Upgrades (Windows Service)

The Windows service includes **Git hooks** that automatically handle upgrades:

```bash
# Simply pull changes - everything else is automatic
git pull origin main
```

**What happens automatically:**

1. ✅ **Dependency Check**: Updates Node.js packages if needed
2. ✅ **Database Migration**: Runs new database migrations
3. ✅ **Build Process**: Rebuilds application with optimizations
4. ✅ **Service Restart**: Smart restart with proper timing
5. ✅ **Health Verification**: Confirms successful upgrade

### Manual Upgrade Process

For manual control or if automatic upgrades fail:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update dependencies
npm install

# 3. Run database migrations
npm run db:setup-auto

# 4. Build application
npm run build

# 5. Smart service restart
npm run sync-service:restart

# 6. Verify upgrade
npm run install:verify
npm run health:check
```

### Major Version Upgrades

For major version changes (e.g., v1.3.x → v1.4.x):

```bash
# 1. Create backup before upgrade
npm run backup:create

# 2. Stop service temporarily
npm run service:stop

# 3. Pull changes and run upgrade
git pull origin main
npm run install:auto

# 4. Verify database schema version
npm run db:verify-schema

# 5. Test application functionality
npm run install:verify
```

### Cloud Upgrade (Vercel)

Cloud deployments upgrade automatically on git push:

```bash
# Push changes to trigger deployment
git push origin main

# Monitor deployment in Vercel dashboard
# Verify deployment success
```

---

## ⚙️ Environment Configuration

### Critical Environment Variables

#### Windows Service Production

```env
# Database - PostgreSQL (Recommended)
DATABASE_URL="postgresql://user:password@localhost:5432/electricity_tokens"

# Security - Generate strong random string (32+ chars)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Local Production
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="production"
```

#### Cloud Production (Vercel)

```env
# Database - Cloud database
DATABASE_URL="postgresql://user:password@host:5432/electricity_tokens?sslmode=require"

# Security
NEXTAUTH_SECRET="your-32-character-secret"

# Cloud Domain
NEXTAUTH_URL="https://your-app.vercel.app"

# Environment
NODE_ENV="production"
```

### Optional Configuration

```env
# Application Configuration
PORT=3000
APP_NAME="Electricity Tokens Tracker"
ADMIN_EMAIL="admin@your-domain.com"

# Enhanced Security
BCRYPT_ROUNDS=12
LOG_LEVEL="warn"
AUDIT_IP_TRACKING=true
AUDIT_USER_AGENT_TRACKING=true

# Email Configuration
EMAIL_FROM="noreply@your-domain.com"
EMAIL_SERVER="smtp://user:pass@smtp.provider.com:587"

# Error Tracking
SENTRY_DSN="your-sentry-dsn"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database Schema Version
DB_SCHEMA_VERSION="1.4.0"

# Theme Configuration
DEFAULT_THEME="system"
THEME_STORAGE_ENABLED=true
```

---

## 🔧 Service Management

### Windows Service Commands

```bash
# Service Status and Control
npm run service:start           # Start the service
npm run service:stop            # Stop the service (guaranteed cleanup)
npm run sync-service:restart    # Smart restart with proper timing
npm run service:diagnose        # Complete status and health check

# Service Installation
npm run service:install         # Install Windows service
npm run service:uninstall       # Remove Windows service
npm run service:force-install   # Force install (handles locked files)

# Health Monitoring
npm run health:check            # Manual health verification
npm run health:status           # Health monitor status
npm run health:install          # Install health monitoring
npm run health:uninstall        # Remove health monitoring
```

### Service Architecture

The application uses a **Hybrid Service Architecture**:

1. **Primary Service**: Node.js application as Windows service
2. **Health Monitor**: Separate monitoring process with auto-restart
3. **Process Management**: Advanced PID tracking and cleanup
4. **Logging System**: Comprehensive logging to files

### Service Logs

- `logs/installation.log` - Installation process logs
- `logs/hybrid-service.log` - Service management logs
- `logs/health-monitor.log` - Health monitoring logs
- `logs/service-wrapper-YYYY-MM-DD.log` - Daily service logs
- `logs/db-setup.log` - Database setup logs

---

## 🗃️ Database Setup

### Automatic Database Setup

```bash
# Complete database setup from scratch
npm run db:setup-auto
```

This handles:

- ✅ Database creation (if not exists)
- ✅ Schema migrations
- ✅ Data seeding (if configured)
- ✅ Prisma client generation
- ✅ Connection verification

### Manual Database Commands

```bash
# Test database connection
npm run db:test

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# Open database browser
npx prisma studio
```

### Database Maintenance

```bash
# Check schema version
npm run db:version

# Verify schema integrity
npm run db:verify-schema

# Fix data constraints (if needed)
npm run db:fix-constraints

# Create backup
npm run db:backup

# Restore from backup
npm run db:restore backup-file.sql
```

---

## 🛠️ Troubleshooting

### Common Installation Issues

#### 1. Service Installation Fails

```bash
# Check administrator privileges
npm run service:diagnose

# Force reinstall service
npm run service:force-install

# Check logs
type logs\hybrid-service.log
```

#### 2. Database Connection Issues

```bash
# Test database connection
npm run db:test

# Verify .env configuration
# Check DATABASE_URL format
# Ensure database server is running
```

#### 3. Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 4. Port 3000 Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual PID)
taskkill /PID [PID] /F

# Restart service
npm run service:start
```

### Common Upgrade Issues

#### 1. Git Hooks Not Working

```bash
# Reinstall Git hooks
git config core.hooksPath .githooks

# Make hooks executable (if needed)
chmod +x .githooks/*
```

#### 2. Database Migration Failures

```bash
# Check current schema version
npm run db:version

# Reset and rebuild database (caution: data loss)
npm run db:reset
npm run db:setup-auto
```

#### 3. Service Won't Restart After Upgrade

```bash
# Force stop and restart
npm run service:stop
npm run service:force-install
npm run service:start

# Check service status
npm run service:diagnose
```

### Diagnostic Commands

```bash
# Complete system diagnosis
npm run install:verify

# Service-specific diagnosis
npm run service:diagnose

# Health monitoring diagnosis
npm run health:status

# Database diagnosis
npm run db:test
```

---

## 🚀 Production Best Practices

### 1. Pre-Deployment Checklist

- [ ] **System Requirements**: Verified hardware and software requirements
- [ ] **Database Setup**: Database server installed and configured
- [ ] **Environment Variables**: All required variables configured securely
- [ ] **SSL Certificates**: HTTPS certificates installed (if applicable)
- [ ] **Firewall Rules**: Network access configured appropriately
- [ ] **Backup Strategy**: Backup procedures planned and tested

### 2. Security Configuration

```env
# Use strong, unique secrets
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Configure production environment
NODE_ENV="production"
BCRYPT_ROUNDS=12
LOG_LEVEL="warn"

# Enable security tracking
AUDIT_IP_TRACKING=true
AUDIT_USER_AGENT_TRACKING=true
```

### 3. Performance Optimization

```env
# Performance settings
NODE_OPTIONS="--max-old-space-size=2048"
BCRYPT_ROUNDS=12

# Database optimization
# Configure connection pooling in DATABASE_URL
# Set up database indexes (handled automatically)
```

### 4. Monitoring and Alerting

- **Built-in Health Monitoring**: Continuous health checks every 30 seconds
- **Log Monitoring**: Comprehensive logging to files
- **External Monitoring**: Configure uptime monitoring services
- **Error Tracking**: Set up Sentry or similar error tracking

### 5. Backup and Recovery

```bash
# Daily automated backups
npm run backup:create

# Test recovery procedures
npm run backup:restore test-backup

# Database-specific backups
npm run db:backup
```

---

## 📊 Deployment Verification

### Post-Deployment Checklist

#### Windows Service Deployment

- [ ] **Service Running**: `npm run service:diagnose` shows "RUNNING"
- [ ] **Health Monitoring**: `npm run health:status` shows "Active"
- [ ] **Application Access**: Browse to http://localhost:3000 successfully
- [ ] **Database Connection**: Database queries working correctly
- [ ] **Admin User**: Admin user created and login tested
- [ ] **Git Hooks**: Automatic updates configured and tested
- [ ] **Logs**: Log files being created and rotated properly

#### Cloud Deployment (Vercel)

- [ ] **Deployment Success**: Vercel dashboard shows successful deployment
- [ ] **Health Check**: `https://your-app.vercel.app/api/health` responds
- [ ] **Database Connection**: Production database accessible
- [ ] **Environment Variables**: All required variables configured
- [ ] **HTTPS**: SSL certificate working correctly
- [ ] **Performance**: Application responding within acceptable timeframes

### Success Indicators

✅ **Service Status**: Service shows as "RUNNING" in diagnostics  
✅ **Health Monitor**: Health checks passing consistently  
✅ **Application Response**: HTTP requests return expected responses  
✅ **Database Connectivity**: Database operations complete successfully  
✅ **Automatic Updates**: Git pull triggers automatic update process  
✅ **Log Generation**: Logs being written to files correctly

---

## 📞 Support Resources

### Documentation

- **[QUICK-START.md](QUICK-START.md)** - Quick setup guide
- **[PRODUCTION-DEPLOYMENT-GUIDE.md](PRODUCTION-DEPLOYMENT-GUIDE.md)** - Detailed production guide
- **[USER_MANUAL.md](USER_MANUAL.md)** - Complete user guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

### Diagnostic Tools

- `npm run install:verify` - Complete system verification
- `npm run service:diagnose` - Service status and health
- `npm run health:check` - Manual health verification
- `npm run db:test` - Database connectivity test

### Getting Help

1. **Check Logs**: Review log files in `logs/` directory
2. **Run Diagnostics**: Use the diagnostic commands above
3. **Review Documentation**: Check the comprehensive guides
4. **Create Issues**: Document problems with reproduction steps

---

**Need Help?**

### Windows Service

- Check service status: `npm run service:diagnose`
- View health monitoring: `npm run health:status`
- Review logs: `type logs\hybrid-service.log`
- Consult TROUBLESHOOTING.md for common issues

### Cloud Deployment

- Check the health endpoint: `https://your-app.vercel.app/api/health`
- View system monitoring: `https://your-app.vercel.app/dashboard/admin/monitoring`
- Review error logs in Sentry dashboard
- Monitor deployment in Vercel dashboard
