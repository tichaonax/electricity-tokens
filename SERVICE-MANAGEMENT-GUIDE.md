# Electricity Tracker Service Management Guide

## Overview

Your Electricity Tokens Tracker now runs as a **background Windows service** without any visible terminal windows, just like professional applications. The system includes automatic health monitoring and recovery.

## 🚀 Quick Setup (New Installation)

### Complete Installation (Recommended)

Run this **once** as Administrator to set up everything:

```bash
# Install EVERYTHING (main service + health monitoring)
npm run setup:complete
```

This single command will:

- ✅ Install the Windows service (no more terminal windows!)
- ✅ Set up continuous health monitoring
- ✅ Configure auto-restart on failures
- ✅ Start everything and verify it's working

## 📋 Available Commands

### Main Service Management

```bash
npm run service:start          # Start the service
npm run service:stop           # Stop the service
npm run service:diagnose       # Check service status
npm run sync-service:restart   # Smart restart (waits properly)
```

### Health Monitoring

```bash
npm run health:check           # Single health check
npm run health:status          # Health monitor status
npm run health:task-status     # Windows task status
```

### Complete Setup

```bash
npm run setup:complete         # Install everything
npm run setup:verify          # Check if working
npm run setup:uninstall       # Remove everything
```

## 🔧 How It Works

### 1. Windows Service (No Terminal Window)

- Runs in background as proper Windows service
- Starts automatically on boot
- No visible terminal windows
- Manages the Next.js application directly

### 2. Health Monitoring System

- **Continuous monitoring** every 30 seconds
- **Auto-restart** after 3 consecutive failures
- **Cooldown period** prevents restart loops
- **Comprehensive checks**:
  - Windows service status
  - Port 3000 availability
  - HTTP health endpoint response
  - Database connectivity

### 3. Smart Restart (`sync-service:restart`)

- **Proper wait timing** - waits for complete shutdown
- **Health verification** - ensures service is actually healthy
- **Force cleanup** - handles orphaned processes
- **Port monitoring** - verifies port 3000 is free/occupied as expected

## 🎯 Key Benefits

### ✅ No More Terminal Windows

- Service runs silently in background
- Can't be accidentally closed by users
- Starts automatically with Windows

### ✅ Automatic Recovery

- Detects when app becomes unresponsive
- Automatically restarts unhealthy service
- Prevents extended downtime

### ✅ Professional Operation

- Proper Windows service integration
- Logging to files (not console)
- Admin-level service management

## 📊 Monitoring & Status

### Check Overall Status

```bash
npm run service:diagnose
```

Shows:

- Windows service status
- Process information
- Port 3000 status
- Build status
- Recommendations

### Check Health System

```bash
npm run health:status
```

Shows:

- Health monitor active/inactive
- Consecutive failure count
- Last auto-restart time
- Current service health

### Manual Health Check

```bash
npm run health:check
```

Performs immediate health verification

## 🚨 Troubleshooting

### Service Won't Start

1. Check admin privileges: Run terminal as Administrator
2. Run diagnostics: `npm run service:diagnose`
3. Check for conflicts: `npm run setup:verify`
4. Reinstall if needed: `npm run setup:uninstall && npm run setup:complete`

### Health Monitor Issues

1. Check task status: `npm run health:task-status`
2. Verify permissions: Run as Administrator
3. Check logs in `logs/health-monitor.log`

### App Not Responding

1. Try smart restart: `npm run sync-service:restart`
2. Check diagnostics: `npm run service:diagnose`
3. Manual intervention: `npm run service:stop && npm run service:start`

## 📁 Log Files

All logs are stored in the `logs/` directory:

- `logs/hybrid-service.log` - Main service operations
- `logs/health-monitor.log` - Health monitoring activity
- `logs/service-wrapper-YYYY-MM-DD.log` - Daily service logs
- `logs/service.pid` - Current process ID

## 🔄 Migration from Old Method

If you were using `start-app.bat` before:

### Old Way (Terminal Window)

```bash
start-app.bat  # ❌ Opens visible terminal
```

### New Way (Background Service)

```bash
npm run setup:complete  # ✅ Installs background service
# OR if already installed:
npm run service:start   # ✅ Starts silently
```

The `start-app.bat` file has been updated to use the service method automatically.

## ⚙️ Configuration

### Health Monitor Settings

Located in `scripts/windows-service/health-monitor.js`:

```javascript
{
  checkInterval: 30000,        // 30 seconds between checks
  healthTimeout: 10000,        // 10 seconds health check timeout
  maxConsecutiveFailures: 3,   // Restart after 3 failures
  restartCooldown: 300000      // 5 minute cooldown between restarts
}
```

### Service Configuration

Located in `scripts/windows-service/config.js`:

- Service name: `ElectricityTracker`
- Auto-start: `Automatic` (starts with Windows)
- Recovery: Restart on failure
- Dependencies: None

## 🎉 Success Indicators

When everything is working correctly:

### Service Status

```bash
npm run service:diagnose
```

Should show:

- ✅ Windows Service: RUNNING
- ✅ Is Running: YES
- ✅ Port 3000 PID: [number]
- ✅ Has Orphaned Processes: NO

### Health Status

```bash
npm run health:status
```

Should show:

- ✅ Monitoring: Active
- ✅ Consecutive Failures: 0/3
- ✅ Service Status: RUNNING

### Application Access

- Browse to `http://localhost:3000`
- Should load normally without any terminal windows visible

## 🆘 Emergency Procedures

### Complete Reset

If everything breaks:

```bash
# Run as Administrator
npm run setup:uninstall   # Remove everything
npm run setup:complete    # Reinstall everything
npm run setup:verify      # Confirm it's working
```

### Manual Process Cleanup

If processes get stuck:

```bash
# Check what's running
npm run service:diagnose

# Force stop everything
npm run service:stop

# Kill any remaining processes manually
taskkill /f /im node.exe

# Restart cleanly
npm run service:start
```

### Disable Health Monitoring

If health monitor is causing issues:

```bash
npm run health:uninstall  # Remove scheduled task
# Main service will still run, just without auto-restart
```

## 📞 Support Commands Quick Reference

```bash
# Installation
npm run setup:complete         # Install everything
npm run setup:verify          # Check if working

# Main Service
npm run service:start         # Start
npm run service:stop          # Stop
npm run sync-service:restart  # Smart restart
npm run service:diagnose      # Status check

# Health System
npm run health:check          # Manual health check
npm run health:status         # Health monitor status
npm run health:task-status    # Windows task status

# Cleanup
npm run setup:uninstall       # Remove everything
```

## 🔍 What Changed

### Before (Terminal Window Method)

- ❌ Visible terminal window
- ❌ Easy to accidentally close
- ❌ No auto-restart on failures
- ❌ Manual startup required
- ❌ Inconsistent process management

### After (Background Service Method)

- ✅ Silent background operation
- ✅ Cannot be accidentally closed
- ✅ Automatic failure recovery
- ✅ Starts with Windows
- ✅ Professional service management
- ✅ Comprehensive health monitoring
- ✅ Smart restart with proper timing
- ✅ Detailed logging and diagnostics

Your application now operates like a professional server application!
