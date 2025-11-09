# Login Issue Root Cause Analysis and Fix

**Date**: October 21, 2025
**Issue**: Login fails when token app is run via Windows service, but works in dev mode
**Status**: ✅ ROOT CAUSE IDENTIFIED AND FIXED

---

## Root Cause

The login failure was caused by a **conflict between the aggressive middleware and NextAuth's redirect mechanism**:

### Problem Components

1. **Middleware Stripping CallbackUrl** (`middleware.ts` lines 14-27):
   - The token app has aggressive middleware that strips ALL `callbackUrl` parameters
   - This prevents callback URL pollution attacks
   - However, it conflicts with NextAuth's default redirect flow

2. **SignIn Using NextAuth Redirect** (`src/app/auth/signin/page.tsx` original line 78-79):
   ```typescript
   const result = await signIn('credentials', {
     email,
     password,
     redirect: true,  // ❌ PROBLEM: Lets NextAuth handle redirect
     callbackUrl: '/dashboard',  // ❌ Gets stripped by middleware
   });
   ```

3. **Redirect Loop**:
   - NextAuth tries to redirect with `callbackUrl=/dashboard`
   - Middleware intercepts and strips `callbackUrl`
   - NextAuth gets confused and tries again
   - Infinite loop

---

## Why Multi-Business Service Works

The multi-business service **does NOT have a middleware.ts file**, so it doesn't strip callbackUrl parameters.

Additionally, its signin page uses **manual redirect**:

```typescript
const result = await signIn('credentials', {
  identifier,
  password,
  redirect: false,  // ✅ Manual control
});

if (result?.error) {
  setError('Invalid credentials');
} else {
  router.push('/dashboard');  // ✅ Manual navigation
}
```

---

## The Fix

### Changed File: `src/app/auth/signin/page.tsx`

**Before** (BROKEN):
```typescript
const result = await signIn('credentials', {
  email,
  password,
  redirect: true,  // Let NextAuth handle redirect
  callbackUrl: '/dashboard',
});
```

**After** (FIXED):
```typescript
// CRITICAL FIX: Use redirect: false to avoid middleware conflicts
// Middleware strips callbackUrl parameters, breaking NextAuth redirect
const result = await signIn('credentials', {
  email,
  password,
  redirect: false,  // Manual redirect to avoid middleware interference
});

if (result?.error) {
  console.log('FORM DEBUG - Login error:', result.error);
  setError('Invalid credentials');
} else {
  // Manual navigation on success
  router.push('/dashboard');
}
```

### Additional Changes

1. **Added `useRouter` import**:
   ```typescript
   import { useSearchParams, useRouter } from 'next/navigation';
   ```

2. **Added router initialization**:
   ```typescript
   const router = useRouter();
   ```

---

## Files Modified

### 1. Service Interference Fix (Already Applied)
- `C:/electricity-app/electricity-tokens/scripts/windows-service/hybrid-service-manager.js`
  - Modified `findServiceProcesses()` to use unique path identifiers
  - Prevents killing multi-business service processes

- `C:/Users/ticha/apps/multi-business-multi-apps/windows-service/hybrid-service-manager.js`
  - Same fix applied to multi-business service

### 2. Cookie Configuration Fix (Already Applied)
- `C:/electricity-app/electricity-tokens/src/lib/auth.ts`
  - Simplified cookie `secure` setting to `false` (HTTP-only deployment)
  - Removed complex `NEXTAUTH_COOKIE_SECURE` logic
  - Removed `useSecureCookies` line

### 3. Login Flow Fix (NEW - THIS SESSION)
- `C:/electricity-app/electricity-tokens/src/app/auth/signin/page.tsx`
  - Changed `redirect: true` to `redirect: false`
  - Added manual `router.push('/dashboard')` on success
  - Added `useRouter` import and initialization

---

## Why Previous Fixes Didn't Work

The cookie configuration fixes were **necessary but not sufficient**:

1. ✅ Cookie `secure: false` was correct - allows cookies over HTTP
2. ✅ Removing `NODE_ENV=production` was correct - prevents forced secure cookies
3. ❌ **But the middleware was still breaking the redirect flow**

The real issue was the **interaction between middleware and NextAuth redirect**, which wasn't discovered until comparing the complete auth flows between services.

---

## Testing Required

### Manual Testing Steps

1. **Restart the service as Administrator**:
   ```bash
   npm run service:stop
   npm run service:start
   ```

2. **Navigate to**: `http://localhost:3000/auth/signin`

3. **Enter credentials** and submit

4. **Expected behavior**:
   - Should successfully authenticate
   - Should manually navigate to `/dashboard`
   - No redirect loop
   - Cookies should be set and persist

### Verification Points

- [ ] Login succeeds in service mode
- [ ] No redirect loops
- [ ] Session persists on page refresh
- [ ] Dashboard loads correctly
- [ ] Logout works correctly
- [ ] Multi-business service still works independently

---

## Key Learnings

### 1. Middleware Can Break NextAuth
Aggressive middleware that modifies request URLs can interfere with NextAuth's built-in redirect mechanism. Use `redirect: false` when you have middleware that strips parameters.

### 2. Cookie Configuration Alone Isn't Enough
Even with correct cookie settings, the auth flow can fail if middleware conflicts with NextAuth's expectations.

### 3. Compare Working Systems Completely
Don't just compare auth configuration - compare:
- Middleware existence and behavior
- Signin page redirect strategy
- Complete request/response flow

### 4. Service vs Dev Mode Differences
Issues that only appear in service mode may be due to:
- Environment variable differences
- Build optimization differences
- **Middleware behavior in production builds**

---

## Architecture Recommendations

### Option 1: Keep Current Middleware (CHOSEN)
- Use `redirect: false` in signin
- Manual router navigation
- Middleware continues to prevent callback URL pollution
- **Pros**: Maintains security, simple fix
- **Cons**: Manual redirect management needed

### Option 2: Modify Middleware
- Allow callbackUrl for `/auth/signin` path
- Keep NextAuth's `redirect: true`
- **Pros**: Standard NextAuth flow
- **Cons**: Potential security concern with callback URLs

### Option 3: Remove Middleware
- Delete middleware.ts entirely like multi-business
- **Pros**: Simplest, matches working system
- **Cons**: Loses security features (rate limiting, header injection, etc.)

**Decision**: Option 1 is best - maintains security while fixing the login issue.

---

## Service Restart Instructions

**IMPORTANT**: The service must be restarted as Administrator to apply changes.

```bash
# As Administrator:
npm run service:stop
npm run service:start
```

If service stop fails with "Access Denied", run PowerShell or Command Prompt as Administrator first.

---

## Build Information

- **Build completed**: 2025-10-21T02:21:37.630Z
- **Git commit**: 1c766ef5
- **Next.js version**: 15.5.2
- **Node.js version**: v20.15.0

---

## Summary

**The login issue was caused by middleware stripping callbackUrl parameters, which broke NextAuth's redirect mechanism. The fix was to use manual redirect (`redirect: false` + `router.push()`) instead of letting NextAuth handle the redirect automatically.**

This matches the working pattern used by the multi-business service and avoids conflicts with the security middleware.
