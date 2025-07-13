# 🚀 Electricity Tokens Tracker - Windows Service Deployment Guide

## 📋 Prerequisites

- **Windows 10/11** or **Windows Server 2016+**
- **Administrator privileges** (required for all service operations)
- **Node.js 20.15.0+** and **npm**
- **PostgreSQL** database configured
- **Git** repository access

## 🎯 Quick Deployment

### **Step 1: Deploy Code**

```bash
# Clone or pull latest code
git pull origin main

# Install dependencies
npm install
```

### **Step 2: Install Service**

```bash
# Install service (handles EBUSY errors automatically)
npm run service:install
```

### **Step 3: Start Service**

```bash
# Start service (auto-detects code changes & rebuilds)
npm run service:start
```

### **Step 4: Verify**

```bash
# Check service status and build info
npm run service:diagnose

# Test application
curl http://localhost:3000
```

## 🔧 Available Commands

| Command                         | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `npm run service:install`       | Install hybrid service (with error handling) |
| `npm run service:force-install` | Same as install (alias for compatibility)    |
| `npm run service:start`         | Start service (auto-rebuild if code changed) |
| `npm run service:stop`          | Stop service (guaranteed process cleanup)    |
| `npm run service:diagnose`      | Comprehensive diagnostics & build status     |
| `npm run service:uninstall`     | Remove service completely                    |
| `npm run service:validate`      | Validate environment before installation     |

## 🔄 Deployment Workflow

### **Regular Updates**

```bash
# Simple deployment - service handles everything!
git pull origin main
npm run service:stop
npm run service:start
```

**What happens automatically:**

1. Service detects git commit changes
2. Automatically runs `npm run build` if needed
3. Starts with fresh build
4. Logs all activities for troubleshooting

### **Force Clean Deployment**

```bash
# If you want to force a complete rebuild
git pull origin main
npm run service:stop
rm -rf .next
npm run service:start
```

## 🔍 Intelligent Build Detection

The service now uses **git commit tracking** to automatically detect when builds are stale:

- **✅ Fresh Code**: Service starts immediately with existing build
- **🔄 Stale Code**: Service auto-rebuilds when git commits differ
- **📊 Build Tracking**: Each build saves commit hash for comparison
- **🔍 Diagnostics**: Shows build status and freshness

## 🚨 Troubleshooting

### **Service Won't Start**

```bash
# Step-by-step diagnosis
npm run service:diagnose

# If service is stuck
npm run service:stop
npm run service:force-install
npm run service:start
```

### **Build Issues**

```bash
# Manual build test
npm run build

# Force rebuild by removing build directory
rm -rf .next
npm run service:start
```

### **Port Issues**

```bash
# Check what's using port 3000
npm run service:diagnose

# Manual cleanup if needed
taskkill /F /IM node.exe
```

### **Installation Errors**

```bash
# For EBUSY or locked file errors
npm run service:force-install

# For permission errors - run as Administrator
# Right-click CMD/PowerShell → "Run as Administrator"
```

## 📊 Service Features

### **Enhanced Reliability**

- ✅ **Guaranteed Process Cleanup** - No more orphaned Node.js processes
- ✅ **Auto-Build Detection** - Rebuilds when code changes detected
- ✅ **Error Recovery** - Handles EBUSY and installation errors
- ✅ **Native Windows Integration** - Uses taskkill and sc.exe

### **Smart Monitoring**

- 📊 **Build Status Tracking** - Git commit-based freshness detection
- 🔍 **Comprehensive Diagnostics** - Real-time status and health checks
- 📝 **Detailed Logging** - Service wrapper and process logs
- ⚡ **Performance Optimized** - Direct Next.js execution (no npm layer)

### **Production Ready**

- 🚀 **Auto-Start** - Starts on system boot
- 🔄 **Crash Recovery** - Automatic restart on failures
- 🛡️ **Security** - Runs as LocalSystem service
- 📈 **Scalable** - Optimized for production workloads

## 🎯 Migration from Old Service

If you have an old service installation:

```bash
# Remove old service
npm run service:uninstall

# Install new hybrid service
npm run service:install

# Start with auto-build detection
npm run service:start
```

## 📝 Logs and Diagnostics

**Key Log Files:**

- `logs/service-wrapper.log` - Service startup and build logs
- `logs/service.pid` - Current process PID tracking
- `logs/hybrid-service.log` - Service management operations

**Build Information:**

- `.next/build-info.json` - Git commit and build metadata
- Automatic staleness detection and rebuild triggers

## ⚙️ Advanced Configuration

The service automatically detects your environment settings from:

- `.env.local` - Local environment overrides
- `.env` - Default environment configuration
- `package.json` - Service metadata and scripts

No manual configuration required - the service adapts to your setup automatically.

## 🆘 Support

For issues:

1. Run `npm run service:diagnose` and share output
2. Check logs in `logs/` directory
3. Verify Administrator privileges
4. Test manual build: `npm run build`

**Common Solutions:**

- **EBUSY errors**: Use `npm run service:force-install`
- **Port conflicts**: Check `npm run service:diagnose`
- **Build failures**: Verify `npm install` and dependencies
- **Permission errors**: Run as Administrator
