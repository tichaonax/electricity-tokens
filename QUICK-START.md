# Quick Start Guide

## Electricity Tokens Tracker - Professional Deployment

### 🚀 One-Command Setup

For **fresh installations** (run as Administrator):

```bash
git clone https://github.com/tichaonax/electricity-tokens.git
cd electricity-tokens
npm run install:auto
```

That's it! The system automatically:

- ✅ Installs all dependencies
- ✅ Creates database from scratch
- ✅ Builds the application
- ✅ Installs Windows service (no terminal windows!)
- ✅ Sets up health monitoring
- ✅ Configures Git hooks for auto-updates

### 🔄 Updates

Simply pull changes - everything else is automatic:

```bash
git pull origin main
# Git hooks handle dependencies, database, build, and service restart
```

### 📋 Essential Commands

```bash
# Service Management
npm run service:start           # Start service
npm run service:stop            # Stop service
npm run sync-service:restart    # Smart restart
npm run service:diagnose        # Check status

# Health Monitoring
npm run health:check            # Manual health check
npm run health:status           # Monitor status

# Installation
npm run install:auto            # Auto-detect and install
npm run install:fresh           # Force fresh install
npm run install:verify          # Verify installation
```

### ⚙️ Configuration

Create `.env` file in root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/electricity_tokens"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
PORT=3000
```

### 🆘 Troubleshooting

- **Service issues**: `npm run service:diagnose`
- **Database issues**: `npm run db:test`
- **Build issues**: Delete `.next` and `node_modules`, then `npm run install:auto`
- **Complete reset**: `npm run setup:uninstall && npm run install:auto`

### 📊 Success Indicators

✅ Service running: `npm run service:diagnose` shows "RUNNING"  
✅ Health monitoring: `npm run health:status` shows "Active"  
✅ Application accessible: Browse to `http://localhost:3000`

---

**Professional deployment complete! 🎉**

No more terminal windows, automatic updates, self-monitoring service - just like the multi-business app model.

See `PRODUCTION-DEPLOYMENT-GUIDE.md` for complete documentation.
