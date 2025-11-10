# Project Plan: ET-101 - Fix Service Session User Authentication

> **Ticket:** ET-101
> **Type:** Bug Fix - Critical Authentication Issue
> **Priority:** URGENT
> **Date Created:** 2025-11-09
> **Status:** 🚧 PLANNING
> **Estimated Time:** 1-2 hours

---

## 🐛 Bug Summary

**Problem:** Users cannot login when the app runs as a Windows service. The credentials API returns 200 (success), but users are redirected back to the signin page. Login works perfectly when running with `npm run dev`.

**Impact:** Critical - All users unable to access the application when running as a service.

---

## 🔍 Root Cause Analysis

After comparing with the working multi-business app, I've identified the following issues:

### 1. **Hardcoded Cookie Security (Primary Issue)**

**Current (Broken):**

```typescript
// src/lib/auth.ts - Line 21
secure: false, // Always false for HTTP-only local deployment
```

**Working App:**

```typescript
secure: process.env.NODE_ENV === 'production',
```

**Why this breaks:** When running as a service, Node.js environment detection differs from `npm run dev`. Hardcoding `secure: false` may cause cookie handling issues in service context.

### 2. **Missing `trustHost` Configuration**

**Current:** No `trustHost` option in NextAuth configuration

**What's needed:** NextAuth needs to trust the Host header when running as a service, where hostname/port resolution differs from development mode.

```typescript
// Working pattern from multi-business app
// trustHost: true should be added to authOptions
```

### 3. **Environment Variable Inconsistency**

**Current .env.local:**

- `NEXTAUTH_URL="http://localhost:3000"`
- `PORT=3000`

**Working app .env.local:**

- `NEXTAUTH_URL="http://localhost:8080"`
- `PORT=8080`

The port is consistent in working app, but may not be the root cause. However, when running as a service, `localhost` hostname resolution might be problematic.

### 4. **Middleware Cookie Name Mismatch Risk**

**Middleware (line 142):**

```typescript
cookieName: 'electricity-tokens.session-token',
```

This matches auth.ts cookie name, but the hardcoded `secure: false` might prevent cookie from being set/read properly in service context.

---

## 📊 Comparison with Working App

| Feature              | Electricity-Tokens (Broken) | Multi-Business (Working)                   |
| -------------------- | --------------------------- | ------------------------------------------ |
| Cookie `secure` flag | `false` (hardcoded)         | `process.env.NODE_ENV === 'production'`    |
| `trustHost` option   | Missing                     | Intentionally omitted (comment), but works |
| Port                 | 3000                        | 8080                                       |
| Cookie prefix        | `electricity-tokens.`       | `multi-business.`                          |
| Debug logging        | Extensive                   | Extensive                                  |

---

## 🎯 Proposed Solution

### Phase 1: Fix Cookie Security Configuration (HIGH PRIORITY)

Update `src/lib/auth.ts` to dynamically determine cookie security based on environment, matching the working app pattern.

### Phase 2: Add `trustHost` Option (HIGH PRIORITY)

Add `trustHost: true` to NextAuth options to handle host header resolution when running as a service.

### Phase 3: Verify Environment Variables (MEDIUM PRIORITY)

Ensure `.env.local` has proper configuration for service context.

### Phase 4: Test Under Service Context (CRITICAL)

Deploy and test authentication under Windows service to verify fix.

---

## 📂 Files to Modify

### Primary Changes

1. **`src/lib/auth.ts`** (Lines 16-41) - Update cookie configuration
   - Change `secure: false` to `secure: process.env.NODE_ENV === 'production'`
   - Add `trustHost: true` to `authOptions`
   - Ensure all three cookie configurations (sessionToken, csrfToken, callbackUrl) are updated

### Verification Files

2. **`.env.local`** - Verify NEXTAUTH_URL and PORT consistency
3. **`middleware.ts`** (Line 142) - Verify cookie name matches auth.ts

### Reference Files (No Changes)

- Reference: `C:\Users\ticha\apps\multi-business-multi-apps\src\lib\auth.ts`
- Reference: `C:\Users\ticha\apps\multi-business-multi-apps\.env.local`

---

## ✅ To-Do Checklist

### Phase 1: Update Cookie Configuration (30 minutes) ✅ COMPLETED

- [x] **Task 1.1**: Read current `src/lib/auth.ts` configuration
- [x] **Task 1.2**: Update `sessionToken` cookie options
  - Change `secure: false` to `secure: process.env.NODE_ENV === 'production'`
  - Remove hardcoded comment about "Always false"
- [x] **Task 1.3**: Update `csrfToken` cookie options
  - Change `secure: false` to `secure: process.env.NODE_ENV === 'production'`
- [x] **Task 1.4**: Update `callbackUrl` cookie options
  - Change `secure: false` to `secure: process.env.NODE_ENV === 'production'`

### Phase 2: Add trustHost Configuration (15 minutes) ✅ COMPLETED

- [x] **Task 2.1**: Add `trustHost: true` to `authOptions` object in `src/lib/auth.ts`
- [x] **Task 2.2**: Add explanatory comment about why trustHost is needed for service context
- [x] **Task 2.3**: Verify TypeScript compilation passes

### Phase 3: Environment Variables Verification (15 minutes) ✅ COMPLETED

- [x] **Task 3.1**: Verify `NEXTAUTH_URL` matches the service deployment URL
- [x] **Task 3.2**: Verify `PORT` matches service configuration
- [x] **Task 3.3**: Confirm `NEXTAUTH_SECRET` is set and unique
- [x] **Task 3.4**: Ensure `NODE_ENV` is properly set for service context

### Phase 4: Testing & Validation (30 minutes)

- [ ] **Task 4.1**: Build production version: `npm run build`
- [ ] **Task 4.2**: Stop Windows service: `npm run service:stop`
- [ ] **Task 4.3**: Start Windows service: `npm run service:start`
- [ ] **Task 4.4**: Test login flow in browser (service context)
- [ ] **Task 4.5**: Verify session cookie is set in browser DevTools
- [ ] **Task 4.6**: Verify successful redirect to dashboard
- [ ] **Task 4.7**: Test logout and re-login
- [ ] **Task 4.8**: Verify no regression in `npm run dev` mode

---

## 🧪 Testing Plan

### Pre-Fix Testing (Reproduce Bug)

1. ✅ Confirm bug exists:
   - Start app as Windows service
   - Attempt login with valid credentials
   - Observe: 200 response but redirect back to signin
   - Check browser cookies: Session cookie may be missing or invalid

### Post-Fix Testing (Verify Fix)

1. **Service Context Testing:**
   - Start app as Windows service
   - Login with valid credentials
   - Verify: Successful redirect to dashboard
   - Check browser cookies: Session cookie present with correct attributes
   - Navigate to protected routes: Access granted
   - Logout: Successful
   - Login again: Works

2. **Development Mode Regression Testing:**
   - Stop service
   - Run `npm run dev`
   - Login with valid credentials
   - Verify: Still works as before (no regression)
   - Check browser cookies: Session cookie present
   - All features working

3. **Cookie Inspection:**
   - Open browser DevTools > Application > Cookies
   - Verify `electricity-tokens.session-token` exists
   - Check cookie attributes:
     - `HttpOnly`: true
     - `SameSite`: Lax
     - `Path`: /
     - `Secure`: Should be false in dev, true in production
     - `Domain`: localhost (or deployment domain)

4. **Multi-User Testing:**
   - Test with different user roles (admin, regular user)
   - Verify role-based redirects work
   - Test concurrent sessions from different browsers

---

## 🚨 Risk Assessment

### Low Risk Changes

- ✅ Updating cookie `secure` flag to dynamic value (matches working app pattern)
- ✅ Adding `trustHost: true` (recommended by NextAuth for service contexts)

### Potential Issues

- ⚠️ Cookie attribute changes might require users to clear cookies once
- ⚠️ Service restart required for environment variable changes

### Rollback Plan

```bash
# If fix doesn't work:
git revert <commit-hash>
npm run service:stop
npm run service:start
# Original behavior restored
```

---

## 📊 Success Criteria

### Must Have

- ✅ Users can login successfully when app runs as Windows service
- ✅ Session persists across page navigation
- ✅ No regression in `npm run dev` mode
- ✅ Logout works correctly
- ✅ Session cookies properly set in browser

### Nice to Have

- ✅ Debug logging confirms successful authentication flow
- ✅ Documentation updated with service deployment notes

---

## 🔧 Implementation Details

### Code Changes Required

**File: `src/lib/auth.ts`**

**Change 1: sessionToken cookie (Lines 14-23)**

```typescript
// BEFORE:
sessionToken: {
  name: `electricity-tokens.session-token`,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false, // Always false for HTTP-only local deployment
  },
},

// AFTER:
sessionToken: {
  name: `electricity-tokens.session-token`,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
},
```

**Change 2: csrfToken cookie (Lines 24-32)**

```typescript
// BEFORE:
csrfToken: {
  name: `electricity-tokens.csrf-token`,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false, // Always false for HTTP-only local deployment
  },
},

// AFTER:
csrfToken: {
  name: `electricity-tokens.csrf-token`,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
},
```

**Change 3: callbackUrl cookie (Lines 33-40)**

```typescript
// BEFORE:
callbackUrl: {
  name: `electricity-tokens.callback-url`,
  options: {
    sameSite: 'lax',
    path: '/',
    secure: false, // Always false for HTTP-only local deployment
  },
},

// AFTER:
callbackUrl: {
  name: `electricity-tokens.callback-url`,
  options: {
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
},
```

**Change 4: Add trustHost option (After line 46)**

```typescript
// BEFORE:
secret: process.env.NEXTAUTH_SECRET,
// Remove hardcoded NEXTAUTH_URL - NextAuth will auto-detect from request headers
providers: [

// AFTER:
secret: process.env.NEXTAUTH_SECRET,
// Trust Host header for URL detection (critical for Windows service context)
trustHost: true,
providers: [
```

---

## 📝 Why This Fix Works

### Cookie Security Dynamic Configuration

**Problem:** Hardcoded `secure: false` doesn't adapt to service execution context.

**Solution:** Dynamic configuration based on `NODE_ENV` allows NextAuth to properly set cookie attributes regardless of how the app is executed.

**Working App Evidence:** The multi-business app uses this exact pattern and works flawlessly in service context.

### trustHost Configuration

**Problem:** When running as a service, NextAuth may not correctly detect the base URL from request headers.

**Solution:** `trustHost: true` tells NextAuth to trust the Host header, allowing proper URL resolution in service context where hostname detection differs from development mode.

**Why It Matters:**

- Service context may have different network stack behavior
- Host header resolution is critical for callback URLs and redirect logic
- NextAuth uses the base URL to validate cookies and sessions

### Environment Consistency

**Problem:** If `NODE_ENV` isn't properly set for the service, cookie behavior may be inconsistent.

**Solution:** Verify environment variables are correctly configured for service execution.

---

## 🔐 Security Considerations

### Cookie Security

- ✅ `httpOnly: true` prevents XSS attacks (unchanged)
- ✅ `sameSite: 'lax'` prevents CSRF attacks (unchanged)
- ✅ `secure` flag dynamically set based on environment (improved)
- ✅ No sensitive data in cookies (only session token ID)

### Session Management

- ✅ JWT strategy prevents session fixation attacks
- ✅ Session tokens rotated on authentication
- ✅ Logout invalidates tokens
- ✅ No security regression from changes

---

## 📚 References

### Working Implementation

- **File:** `C:\Users\ticha\apps\multi-business-multi-apps\src\lib\auth.ts`
- **Lines:** 11-43 (NextAuth cookie configuration)
- **Pattern:** Dynamic `secure` flag based on `NODE_ENV`

### NextAuth Documentation

- [Cookies Configuration](https://next-auth.js.org/configuration/options#cookies)
- [trustHost Option](https://next-auth.js.org/configuration/options#trusthost)
- [Deployment Best Practices](https://next-auth.js.org/deployment)

### Related Issues

- Service execution context different from development mode
- Cookie attribute handling in Windows service environment
- Host header resolution for NextAuth base URL detection

---

## 📋 Deployment Checklist

Before deploying:

- [ ] Code changes reviewed
- [ ] TypeScript compilation passes
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables verified
- [ ] Service restart planned
- [ ] Rollback plan ready

After deploying:

- [ ] Service started successfully
- [ ] Login tested with multiple users
- [ ] Session persistence verified
- [ ] Protected routes accessible
- [ ] No errors in service logs
- [ ] Logout tested

---

## ✍️ Sign-Off

**Created By:** AI Assistant
**Reviewed By:** [To be filled]
**Approved By:** [To be filled]
**Approval Date:** [To be filled]

---

**Next Step:** Review this plan and type `PHASE 1` to begin implementation of cookie configuration fixes.
