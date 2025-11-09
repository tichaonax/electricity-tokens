# Quick Start Guide: Running Both Apps Simultaneously

## Prerequisites
✅ Fixes applied (unique NEXTAUTH_SECRET, PORT configured)
✅ PostgreSQL running on port 5432
✅ Administrator access for Windows service commands

## Step-by-Step: Start Both Apps

### 1. Clear Browser Cookies (CRITICAL FIRST STEP)
**Must do this before starting either app:**

- **Chrome/Edge**:
  - F12 → Application tab → Cookies → http://localhost → Delete all
- **Firefox**:
  - F12 → Storage tab → Cookies → http://localhost → Delete all

### 2. Start Electricity Tokens (Port 3000)

```bash
# Open PowerShell/CMD as Administrator
cd C:\electricity-app\electricity-tokens

# Build application
npm run build

# Stop service if running
npm run service:stop

# Start service
npm run service:start

# Verify it's running
npm run service:diagnose
```

**Expected output:**
```
✅ Service Status: RUNNING
✅ Port 3000 PID: <some number>
```

**Test it:**
```bash
curl http://localhost:3000/api/health
```

**Should return:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123,
  ...
}
```

### 3. Start Multi-Business (Port 8080)

```bash
# Open NEW PowerShell/CMD window (don't need Admin)
cd C:\Users\ticha\apps\multi-business-multi-apps

# Start development server
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:8080
✓ Ready in X.Xs
```

**Test it:**
```bash
curl http://localhost:8080/api/health
```

### 4. Verify Both Running

```bash
# Check listening ports
netstat -ano | findstr ":3000 :8080"
```

**Expected output:**
```
TCP    0.0.0.0:3000    ...    LISTENING    12345
TCP    0.0.0.0:8080    ...    LISTENING    67890
```

### 5. Access Applications

**Electricity Tokens:**
- URL: http://localhost:3000
- Login with your credentials
- **Note**: You'll need to login fresh (old sessions invalid)

**Multi-Business:**
- URL: http://localhost:8080
- Login with your credentials
- **Note**: You'll need to login fresh (old sessions invalid)

## Troubleshooting

### Problem: Port 3000 not listening

**Check service status:**
```bash
sc query "ElectricityTracker.exe"
npm run service:diagnose
```

**Check logs:**
```bash
type C:\electricity-app\electricity-tokens\logs\hybrid-service.log
```

**Solution:**
```bash
# As Administrator
npm run service:stop
npm run service:force-install
npm run service:start
```

### Problem: Port 8080 not listening

**Check if another process is using it:**
```bash
netstat -ano | findstr ":8080"
```

**Kill conflicting process:**
```bash
taskkill /F /PID <process_id>
```

**Restart:**
```bash
cd C:\Users\ticha\apps\multi-business-multi-apps
npm run dev
```

### Problem: "Access Denied" or Authentication Issues

**This means cookies weren't cleared properly.**

**Solution:**
1. Close all browser tabs for localhost
2. Clear cookies again (see step 1)
3. Hard refresh (Ctrl+Shift+R)
4. Try login again

### Problem: Starting one stops the other

**This should NOT happen anymore with the fixes applied.**

**If it still happens:**
1. Verify NEXTAUTH_SECRET is different in both apps:
   ```bash
   # Electricity tokens
   findstr NEXTAUTH_SECRET C:\electricity-app\electricity-tokens\.env

   # Multi-business
   findstr NEXTAUTH_SECRET C:\Users\ticha\apps\multi-business-multi-apps\.env
   ```

2. Verify PORT is set for electricity-tokens:
   ```bash
   findstr PORT C:\electricity-app\electricity-tokens\.env
   # Should show: PORT=3000
   ```

3. If they're the same or PORT is missing, re-apply fixes from FIXES_APPLIED.md

## Daily Usage

### Starting Both Apps:

**Simple method:**
```bash
# Terminal 1 (as Administrator):
cd C:\electricity-app\electricity-tokens
npm run service:start

# Terminal 2 (normal):
cd C:\Users\ticha\apps\multi-business-multi-apps
npm run dev
```

### Stopping Both Apps:

```bash
# Stop electricity-tokens service (as Administrator):
cd C:\electricity-app\electricity-tokens
npm run service:stop

# Stop multi-business (just press Ctrl+C in terminal)
```

### Checking Status:

```bash
# Quick check
netstat -ano | findstr ":3000 :8080"

# Detailed check
curl http://localhost:3000/api/health
curl http://localhost:8080/api/health
```

## Port Reference

| App | Port | URL | Service |
|-----|------|-----|---------|
| Electricity Tokens | 3000 | http://localhost:3000 | ElectricityTracker.exe |
| Multi-Business | 8080 | http://localhost:8080 | Node.js (dev) |
| Multi-Business Sync | 8765 | N/A | Sync service port |
| PostgreSQL | 5432 | N/A | Database |

## Environment Variables Summary

### Electricity Tokens
```env
PORT=3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=8KzP2dQ5vN7mX3fH9wL1tB6jR4yU0sA+xC/nE=gT
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/electricity_tokens
```

### Multi-Business
```env
PORT=8080
NEXTAUTH_URL=http://localhost:8080
NEXTAUTH_SECRET=V4h2s9mZqL1t8R0pXy3N6bQwFh7uJrT5aKzPdUcYv2M=
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/multi_business_db
```

## Success Criteria

✅ Both health endpoints respond (200 OK)
✅ Both apps accessible in browser simultaneously
✅ Can login to both apps independently
✅ Sessions persist across browser refresh
✅ No interference between apps
✅ Service stays running (electricity-tokens)
✅ Dev server runs without errors (multi-business)

## Still Having Issues?

1. Check FIXES_APPLIED.md for detailed fix information
2. Check PORT_CONFLICT_ANALYSIS.md for root cause analysis
3. Check service logs in `C:\electricity-app\electricity-tokens\logs\`
4. Verify PostgreSQL is running: `sc query postgresql-x64-16`
5. Verify unique secrets are in place (they should be different)
6. Ensure PORT=3000 is set in electricity-tokens .env

## Quick Health Check Script

Save this as `check-both-apps.bat`:
```batch
@echo off
echo Checking Electricity Tokens (Port 3000)...
curl -s http://localhost:3000/api/health
echo.
echo.
echo Checking Multi-Business (Port 8080)...
curl -s http://localhost:8080/api/health
echo.
echo.
echo Checking Listening Ports...
netstat -ano | findstr ":3000 :8080"
echo.
pause
```

Run it anytime to check if both apps are healthy.
