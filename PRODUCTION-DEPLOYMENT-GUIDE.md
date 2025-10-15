# Production Deployment Guide

## Electricity Tokens Tracker

### Professional Deployment System - Multi-Business App Model

This guide provides complete instructions for deploying Electricity Tokens Tracker in production environments using professional-grade automation and monitoring.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Fresh Installation](#fresh-installation)
4. [Update Deployment](#update-deployment)
5. [Database Setup](#database-setup)
6. [Service Management](#service-management)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)
10. [Security Configuration](#security-configuration)

---

## 🖥️ System Requirements

### Minimum Requirements

- **OS**: Windows Server 2016+ or Windows 10+
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB available space
- **Network**: Internet connectivity for package downloads

### Recommended for Production

- **OS**: Windows Server 2019+
- **CPU**: 4+ cores, 2.5+ GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: Stable broadband connection

### Required Software

- **Node.js**: v18.0.0 or later
- **NPM**: v8.0.0 or later
- **Git**: Latest version
- **Database**: PostgreSQL 12+ (or configured database)

---

## ✅ Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] Administrator access to target server
- [ ] Node.js and NPM installed
- [ ] Git configured with repository access
- [ ] Database server running and accessible
- [ ] Firewall configured (port 3000 open if needed)

### 2. Database Preparation

- [ ] Database server installed and running
- [ ] Database user created with appropriate permissions
- [ ] Network connectivity to database verified
- [ ] Backup strategy in place

### 3. Application Configuration

- [ ] Environment variables prepared (.env file)
- [ ] SSL certificates ready (if using HTTPS)
- [ ] Domain/subdomain configured
- [ ] Load balancer configuration (if applicable)

---

## 🆕 Fresh Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/tichaonax/electricity-tokens.git
cd electricity-tokens

# Set up Git hooks for automatic updates
git config core.hooksPath .githooks
```

### Step 2: Configure Environment

Create `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/electricity_tokens"

# Application Configuration
NODE_ENV="production"
PORT=3000

# Security Configuration
NEXTAUTH_SECRET="your-super-secret-key-min-32-characters"
NEXTAUTH_URL="https://your-domain.com"

# Optional: Additional Configuration
BCRYPT_ROUNDS=12
LOG_LEVEL="info"

# Optional: External Services
SENTRY_DSN="your-sentry-dsn-if-using"
```

### Step 3: Automated Installation

```bash
# Run as Administrator
npm run install:auto
```

This single command will:

- ✅ Install all Node.js dependencies
- ✅ Create database schema automatically
- ✅ Run all migrations
- ✅ Build the production application
- ✅ Install Windows service
- ✅ Set up health monitoring
- ✅ Configure Git hooks
- ✅ Start the service

### Step 4: Verify Installation

```bash
# Check overall system status
npm run install:verify

# Check service status
npm run service:diagnose

# Perform health check
npm run health:check
```

### Step 5: Access Application

- Browse to `http://localhost:3000` (or your configured domain)
- Verify all functionality works
- Check logs in `logs/` directory

---

## 🔄 Update Deployment

### Automated Updates (Recommended)

The system automatically updates when you pull changes:

```bash
# Pull latest changes (Git hooks handle the rest)
git pull origin main
```

The post-merge Git hook automatically:

- ✅ Installs updated dependencies
- ✅ Runs database migrations
- ✅ Rebuilds the application
- ✅ Restarts the service with proper timing
- ✅ Verifies health after restart

### Manual Updates

If you prefer manual control:

```bash
# Update dependencies
npm install

# Update database
npm run db:setup-auto

# Build application
npm run build

# Smart service restart (waits for proper shutdown)
npm run sync-service:restart

# Verify health
npm run health:check
```

---

## 🗃️ Database Setup

### Automatic Database Setup

The system handles database creation automatically:

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

# Run migrations only
npm run db:setup-auto migrate

# Seed database only
npm run db:setup-auto seed
```

### Database Configuration Examples

#### PostgreSQL (Recommended)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/electricity_tokens"
```

#### MySQL/MariaDB

```env
DATABASE_URL="mysql://user:password@localhost:3306/electricity_tokens"
```

#### SQLite (Development Only)

```env
DATABASE_URL="file:./electricity_tokens.db"
```

---

## 🔧 Service Management

### Core Service Commands

```bash
# Start service
npm run service:start

# Stop service
npm run service:stop

# Smart restart (proper timing)
npm run sync-service:restart

# Check service status
npm run service:diagnose

# Complete service reset
npm run service:reset
```

### Service Installation

```bash
# Install service and health monitoring
npm run setup:complete

# Uninstall everything
npm run setup:uninstall

# Verify installation
npm run setup:verify
```

### Service Features

- ✅ **Silent Operation**: No terminal windows
- ✅ **Auto-Start**: Starts with Windows
- ✅ **Auto-Recovery**: Restarts on failures
- ✅ **Health Monitoring**: Continuous health checks
- ✅ **Smart Restart**: Proper shutdown timing
- ✅ **Logging**: Comprehensive logging to files

---

## 🏥 Monitoring & Health Checks

### Health Monitoring System

The application includes comprehensive health monitoring:

```bash
# Manual health check
npm run health:check

# Health monitor status
npm run health:status

# Windows scheduled task status
npm run health:task-status
```

### Health Check Features

- ✅ **Service Status**: Windows service monitoring
- ✅ **Port Monitoring**: Ensures port 3000 is listening
- ✅ **HTTP Health**: Checks `/api/health` endpoint
- ✅ **Database Connectivity**: Verifies database access
- ✅ **Auto-Restart**: Restarts on consecutive failures
- ✅ **Cooldown Protection**: Prevents restart loops

### Health Monitoring Configuration

Located in `scripts/windows-service/health-monitor.js`:

```javascript
{
  checkInterval: 30000,        // 30 seconds between checks
  healthTimeout: 10000,        // 10 seconds health check timeout
  maxConsecutiveFailures: 3,   // Restart after 3 failures
  restartCooldown: 300000      // 5 minute cooldown between restarts
}
```

### Log Files

- `logs/installation.log` - Installation process logs
- `logs/hybrid-service.log` - Service management logs
- `logs/health-monitor.log` - Health monitoring logs
- `logs/service-wrapper-YYYY-MM-DD.log` - Daily service logs
- `logs/db-setup.log` - Database setup logs

---

## 💾 Backup & Recovery

### Database Backup

```bash
# Manual database backup
npm run db:backup

# Restore from backup
npm run db:restore backup-file.sql
```

### Application Backup

```bash
# Create complete backup
npm run backup:create

# Restore from backup
npm run backup:restore backup-name
```

### Disaster Recovery

```bash
# Complete system recovery
npm run install:fresh

# Restore configuration
# Copy your .env file back
# Restore database from backup
npm run db:restore your-backup.sql

# Verify system
npm run install:verify
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check admin privileges
npm run service:diagnose

# Force reinstall service
npm run setup:uninstall
npm run setup:complete

# Check logs
type logs\hybrid-service.log
```

#### Database Connection Issues

```bash
# Test database connection
npm run db:test

# Check .env configuration
# Verify database server is running
# Check network connectivity
```

#### Build Failures

```bash
# Clear build cache
rm -rf .next node_modules
npm install
npm run build
```

#### Port 3000 Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID [PID] /F

# Restart service
npm run service:start
```

### Health Check Failures

```bash
# Check health status
npm run health:check

# Check service logs
type logs\health-monitor.log

# Restart health monitoring
npm run health:uninstall
npm run health:install
```

### Git Hook Issues

```bash
# Reinstall Git hooks
git config core.hooksPath .githooks

# Make hooks executable (if on WSL/Git Bash)
chmod +x .githooks/*
```

---

## 🔒 Security Configuration

### Environment Security

- Use strong, unique `NEXTAUTH_SECRET` (min 32 characters)
- Configure HTTPS in production
- Set secure database passwords
- Use environment-specific database users

### Network Security

- Configure firewall rules appropriately
- Use reverse proxy (nginx/IIS) for HTTPS termination
- Implement rate limiting
- Configure CORS policies

### Database Security

- Use dedicated database user with minimal permissions
- Enable database SSL/TLS
- Regular security updates
- Database access logging

### Application Security

```env
# Production security settings
NODE_ENV="production"
NEXTAUTH_SECRET="your-super-secure-secret-key"
BCRYPT_ROUNDS=12
LOG_LEVEL="warn"  # Reduce log verbosity in production
```

---

## 📊 Performance Optimization

### Production Configuration

```env
# Performance settings
NODE_ENV="production"
NODE_OPTIONS="--max-old-space-size=2048"
```

### Database Optimization

- Configure connection pooling
- Set up database indexes
- Regular maintenance tasks
- Monitor query performance

### Application Optimization

- Enable compression
- Configure caching headers
- Optimize static asset serving
- Monitor memory usage

---

## 🔍 Monitoring & Alerts

### Built-in Monitoring

The application includes comprehensive monitoring:

- Service health checks every 30 seconds
- Automatic restart on failures
- Performance metrics logging
- Error tracking and reporting

### External Monitoring (Optional)

Configure external services:

- **Sentry**: Error tracking and performance monitoring
- **Uptime Robot**: External availability monitoring
- **New Relic**: Application performance monitoring

### Custom Alerts

Set up Windows Task Scheduler alerts for:

- Service failures
- Disk space warnings
- Memory usage alerts
- Database connection issues

---

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] System requirements verified
- [ ] Database server configured and tested
- [ ] Environment variables configured
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall rules configured
- [ ] Backup strategy implemented

### Deployment

- [ ] Repository cloned
- [ ] Environment file created and secured
- [ ] Automated installation completed (`npm run install:auto`)
- [ ] Installation verified (`npm run install:verify`)
- [ ] Service health checked (`npm run health:check`)
- [ ] Application accessibility tested

### Post-Deployment

- [ ] All functionality tested
- [ ] Performance verified under load
- [ ] Backup procedures tested
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team training completed

---

## 🎯 Professional Best Practices

### 1. **Automated Deployment**

- Use Git hooks for automatic updates
- Implement CI/CD pipeline for large environments
- Test deployments in staging environment first

### 2. **Configuration Management**

- Store secrets securely
- Use environment-specific configurations
- Version control configuration changes

### 3. **Monitoring & Alerting**

- Implement comprehensive monitoring
- Set up proactive alerting
- Regular health check audits

### 4. **Backup & Recovery**

- Automated daily backups
- Tested recovery procedures
- Offsite backup storage

### 5. **Security**

- Regular security updates
- Principle of least privilege
- Security audit trails

---

## 📞 Support & Maintenance

### Regular Maintenance

```bash
# Weekly health check
npm run service:diagnose
npm run health:status

# Monthly updates (if not automatic)
git pull origin main

# Quarterly security review
npm audit
npm run install:verify
```

### Emergency Procedures

```bash
# Emergency stop
npm run service:stop

# Emergency restart
npm run sync-service:restart

# Emergency recovery
npm run install:fresh
```

### Getting Help

1. Check logs in `logs/` directory
2. Run diagnostics: `npm run service:diagnose`
3. Verify installation: `npm run install:verify`
4. Review this documentation
5. Check Git repository issues

---

## 🎉 Deployment Complete!

Once deployed, your Electricity Tokens Tracker will operate as a professional-grade service with:

- ✅ **Silent background operation** (no terminal windows)
- ✅ **Automatic startup** with Windows
- ✅ **Self-monitoring and recovery**
- ✅ **Automated updates** via Git hooks
- ✅ **Professional service management**
- ✅ **Comprehensive logging and diagnostics**
- ✅ **Production-ready security**

Your application will be accessible at the configured URL and will maintain high availability through automated monitoring and recovery systems.

---

_This deployment model follows the same professional standards as the multi-business application, ensuring reliable, maintainable, and scalable production deployments._
