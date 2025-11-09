# Port Conflict Analysis & Resolution

## Investigation Date
2025-10-20

## Problem Statement
The electricity-tokens app (port 3000) and multi-business-multi-apps (port 8080) appear to have interference where starting one stops the other.

## Current State
- **electricity-tokens**: ElectricityTracker.exe service is STOPPED
- **multi-business-multi-apps**: Running on port 8080 (no Windows service installed)
- **Port 3000**: NOT listening (electricity-tokens service stopped)
- **Port 8080**: LISTENING (multi-business-multi-apps running)

## Root Causes Identified

### 1. **SHARED NEXTAUTH_SECRET** ⚠️ CRITICAL
**Both applications are using the SAME NextAuth secret:**
```
electricity-tokens: "pano-pamusha-hapa-pindwi-nemuroyi"
multi-business: "pano-pamusha-hapa-pindwi-nemuroyi"
```

**Impact:**
- Session cookies from one app are valid for the other app
- JWT tokens are interchangeable between apps
- Logging into one app creates cookies that interfere with the other
- Session confusion and authentication conflicts

### 2. **SAME POSTGRESQL SERVER** (Different Databases - OK)
- electricity-tokens: `postgresql://postgres:postgres@localhost:5432/electricity_tokens`
- multi-business: `postgresql://postgres:postgres@localhost:5432/multi_business_db`

**Status:** ✅ NOT A PROBLEM (different database names)

### 3. **PORT CONFIGURATION ANALYSIS**

**electricity-tokens:**
- `.env`: `NEXTAUTH_URL="http://localhost:3000"`
- `package.json`: `"start": "next start"` (no -p flag, defaults to 3000)
- Service wrapper: Uses `process.env.PORT || 3000`
- **ISSUE**: No explicit PORT env variable, relies on default

**multi-business-multi-apps:**
- `.env`: `PORT=8080`, `NEXTAUTH_URL="http://localhost:8080"`
- `package.json`: `"dev": "next dev -p 8080"`, `"start": "next start -p 8080"`
- **CORRECT**: Explicitly sets PORT in both places

### 4. **SERVICE CONFIGURATION**

**electricity-tokens:**
- Service Name: `ElectricityTracker.exe`
- Service exists but currently STOPPED
- Uses hybrid service wrapper

**multi-business-multi-apps:**
- Service Name: `multi-business-sync` (NOT INSTALLED)
- Running as standard Node process (not as service)

### 5. **NO DIRECT PORT CONFLICT**
The apps are configured for different ports (3000 vs 8080), so they should NOT interfere if ports are properly configured.

## Why Starting One Stops the Other (Hypothesis)

### Theory 1: Shared NextAuth Secret Causing Session Conflicts
When you start app A, it sets cookies with the shared secret. When you start app B:
1. B sees cookies encrypted with the same secret
2. B tries to decrypt them and gets confused data
3. B's middleware may crash or behave unpredictably
4. This causes the appearance of "stopping" the other app

### Theory 2: Missing PORT Environment Variable
If `electricity-tokens` service doesn't have `PORT=3000` explicitly set in its environment, the service wrapper might:
1. Try to start on port 3000 (default)
2. If port 3000 is somehow occupied or misconfigured
3. The service fails to start properly

### Theory 3: PostgreSQL Connection Pool Exhaustion
Both apps connecting to the same PostgreSQL instance might exhaust connection pools if not properly configured, causing one to fail when the other is running.

## CRITICAL FIXES REQUIRED

### Fix 1: Generate Unique NEXTAUTH_SECRET for Each App ⚠️ URGENT

**electricity-tokens:**
```bash
cd C:\electricity-app\electricity-tokens
# Generate new secret
openssl rand -base64 32
```

Update `.env` and `.env.local`:
```env
NEXTAUTH_SECRET="<NEW_UNIQUE_SECRET_HERE>"
```

**multi-business-multi-apps:**
```bash
cd C:\Users\ticha\apps\multi-business-multi-apps
# Generate different secret
openssl rand -base64 32
```

Update `.env` and `.env.local`:
```env
NEXTAUTH_SECRET="<DIFFERENT_UNIQUE_SECRET_HERE>"
```

### Fix 2: Explicitly Set PORT for electricity-tokens

**Update `.env` and `.env.local`:**
```env
# Add this line
PORT=3000
```

**Verify in service wrapper:**
The service wrapper already correctly uses `process.env.PORT || 3000`, so setting `PORT=3000` in `.env` will ensure it's always explicit.

### Fix 3: Configure PostgreSQL Connection Pools

**electricity-tokens `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  connection_limit = 10
}
```

**multi-business-multi-apps `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10
}
```

Or update DATABASE_URL with connection pool parameters:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/electricity_tokens?connection_limit=10&pool_timeout=20"
```

### Fix 4: Ensure Different Session Cookie Names (Optional but Recommended)

**electricity-tokens `src/lib/auth.ts`:**
```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config
  cookies: {
    sessionToken: {
      name: `electricity-tokens.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
```

**multi-business-multi-apps auth config:**
```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config
  cookies: {
    sessionToken: {
      name: `multi-business.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
```

## Verification Steps

### After applying fixes:

1. **Clear all browser cookies for localhost**
2. **Stop all Node processes:**
   ```bash
   taskkill //F //IM node.exe
   ```

3. **Start electricity-tokens:**
   ```bash
   cd C:\electricity-app\electricity-tokens
   npm run build
   npm run service:install
   npm run service:start
   ```

4. **Verify port 3000:**
   ```bash
   curl http://localhost:3000/api/health
   ```

5. **Start multi-business-multi-apps:**
   ```bash
   cd C:\Users\ticha\apps\multi-business-multi-apps
   npm run dev
   ```

6. **Verify port 8080:**
   ```bash
   curl http://localhost:8080/api/health
   ```

7. **Check both are running:**
   ```bash
   netstat -ano | findstr ":3000 :8080"
   ```

## Additional Recommendations

### 1. Use Different PostgreSQL Roles
Create separate database users for better isolation:

```sql
-- As postgres superuser
CREATE USER electricity_app WITH PASSWORD 'secure_password_1';
GRANT ALL PRIVILEGES ON DATABASE electricity_tokens TO electricity_app;

CREATE USER multi_business_app WITH PASSWORD 'secure_password_2';
GRANT ALL PRIVILEGES ON DATABASE multi_business_db TO multi_business_app;
```

Update connection strings accordingly.

### 2. Monitor Process Health
Implement process monitoring to detect conflicts:
- Use `npm run service:diagnose` for electricity-tokens
- Check logs in `C:\electricity-app\electricity-tokens\logs`
- Check logs in `C:\Users\ticha\apps\multi-business-multi-apps\logs`

### 3. Consider Using Different PostgreSQL Ports (Advanced)
If conflicts persist, run two PostgreSQL instances:
- Instance 1: Port 5432 (electricity-tokens)
- Instance 2: Port 5433 (multi-business)

## Summary

**Primary Issue**: Shared NEXTAUTH_SECRET causing session/cookie conflicts
**Secondary Issue**: Missing explicit PORT configuration in electricity-tokens
**Tertiary Issue**: Potential PostgreSQL connection pool conflicts

**Priority**:
1. ⚠️ **URGENT**: Change NEXTAUTH_SECRET to unique values
2. **HIGH**: Add PORT=3000 to electricity-tokens .env
3. **MEDIUM**: Configure PostgreSQL connection limits
4. **LOW**: Use different cookie names for complete isolation

Once these fixes are applied, both applications should run simultaneously without interference.
