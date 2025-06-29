# Security Features Documentation

## Overview

The Electricity Tokens application implements comprehensive enterprise-grade security features to protect user data, prevent attacks, and ensure system integrity. This document outlines all security measures implemented in the system.

## Security Architecture

### Defense in Depth
Our security implementation follows a defense-in-depth strategy with multiple layers:

1. **Network Security** - Global middleware protection
2. **Application Security** - Input validation and sanitization  
3. **Authentication Security** - Enhanced auth with audit trails
4. **Authorization Security** - Fine-grained permissions system
5. **Data Security** - Encryption and integrity verification
6. **Monitoring Security** - Real-time threat detection

## 🛡️ Security Features Implemented

### 1. Input Sanitization & SQL Injection Prevention

**SecurityValidator Class** (`/src/lib/security.ts`)
- **HTML Sanitization**: Removes dangerous HTML tags and JavaScript
- **Input Sanitization**: Strips control characters and escape sequences
- **Email Validation**: Enhanced validation with security checks
- **Password Validation**: Configurable strength requirements
- **Numeric Validation**: Safe numeric input processing

**Protection Against**:
- SQL Injection attacks
- XSS (Cross-Site Scripting) attacks  
- HTML injection
- Script injection
- Control character attacks

### 2. Advanced Rate Limiting

**Multi-Tier Rate Limiting**:
- **Global Limits**: 300 requests per 15 minutes
- **API Limits**: 100 requests per 15 minutes
- **Auth Limits**: 10 requests per 5 minutes (stricter)
- **Admin Limits**: 50 requests per 15 minutes

**Features**:
- IP-based fingerprinting with user agent
- Automatic cleanup of expired entries
- Custom rate limits per endpoint type
- Rate limit headers in responses

**Implementation**:
```typescript
// Example usage
const rateLimitResult = RateLimiter.checkRateLimit(identifier, {
  requests: 100,
  windowMs: 15 * 60 * 1000
});
```

### 3. CSRF Protection

**CSRF Token System**:
- **Token Generation**: Cryptographically secure random tokens
- **React Provider**: Automatic token management (`CSRFProvider`)
- **Header Injection**: Automatic inclusion in state-changing requests
- **Validation**: Constant-time comparison to prevent timing attacks

**Implementation**:
```typescript
// React hook for secure requests
const secureFetch = useSecureFetch();
await secureFetch('/api/users', { method: 'POST', body: data });
```

### 4. Data Encryption

**Encryption Utilities** (`/src/lib/security.ts`):
- **AES Encryption**: Industry-standard symmetric encryption
- **Secure Hashing**: SHA-256 for data integrity
- **Token Generation**: Cryptographically secure random tokens
- **Session Encryption**: Encrypted session data storage

**EncryptedStorage Class** (`/src/lib/encrypted-storage.ts`):
- **User Data Encryption**: Sensitive information encryption
- **Configuration Encryption**: Secure config storage
- **Backup Encryption**: Encrypted data backups
- **Session Security**: Encrypted session management

### 5. Security Middleware

**Comprehensive API Protection** (`/src/lib/security-middleware.ts`):
- **Request Size Validation**: Prevent oversized requests
- **Rate Limiting**: Automatic enforcement
- **CSRF Validation**: Token verification
- **Input Sanitization**: Recursive object sanitization
- **Security Headers**: Automatic header injection

**Middleware Types**:
- `withSecurity()` - General protection
- `withAuthSecurity()` - Authentication routes
- `withAdminSecurity()` - Admin endpoints
- `withPublicSecurity()` - Public APIs

### 6. Global Security Headers

**Security Headers Applied**:
```typescript
{
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff', 
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': 'default-src \'self\'; ...',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), ...'
}
```

### 7. Account Security

**Account Protection**:
- **Account Locking**: Automatic lockout on suspicious activity
- **Locked Account UI**: Dedicated page for locked users
- **Admin Controls**: Lock/unlock capabilities
- **Self-Protection**: Prevents admins from locking themselves

### 8. Security Dashboard

**Real-Time Monitoring** (`/src/app/dashboard/admin/security/page.tsx`):
- **Security Metrics**: Live security statistics
- **Event Monitoring**: Real-time security event tracking
- **Threat Detection**: Suspicious activity alerts
- **System Status**: Security system health checks

**Metrics Tracked**:
- Total security events
- Critical security incidents  
- Rate limit violations
- Failed authentication attempts
- Suspicious activity patterns

### 9. Suspicious Activity Detection

**Automated Pattern Detection** (`middleware.ts`):
- **SQL Injection Patterns**: Detects common SQL injection attempts
- **XSS Patterns**: Identifies cross-site scripting attempts
- **Path Traversal**: Catches directory traversal attacks
- **Command Injection**: Detects command injection attempts
- **Bot Detection**: Identifies automated bot traffic

**Detection Patterns**:
```typescript
const suspiciousPatterns = [
  /(union|select|insert|update|delete|drop|create|alter)\s/i, // SQL injection
  /<script|javascript:|on\w+\s*=/i, // XSS attempts
  /\.\.\//,  // Path traversal
  /;|\||\&\&|\|\||`/, // Command injection
  /bot|crawler|spider|scraper/i, // Common bots
];
```

### 10. Comprehensive Audit Trail

**Security Event Logging** (`/src/lib/audit.ts`):
- **Authentication Events**: All login/logout attempts
- **Permission Changes**: Role and permission modifications
- **Data Changes**: Complete CRUD operation tracking
- **Security Events**: All security-related activities
- **Integrity Verification**: SHA-256 hash verification

## 🔧 Configuration

### Environment Variables

Copy `.env.security.example` to `.env.local` and configure:

```bash
# Core Security
ENCRYPTION_SECRET=your-256-bit-encryption-key
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min

# Rate Limiting  
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBERS=true

# Security Features
CSRF_PROTECTION_ENABLED=true
AUDIT_ENCRYPTION_ENABLED=true
SECURITY_LOGGING_ENABLED=true
```

### Production Security Checklist

- [ ] Update all default secrets and keys
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure proper Content Security Policy
- [ ] Set up security monitoring and alerting
- [ ] Enable audit log encryption
- [ ] Configure rate limiting for production traffic
- [ ] Set up automated security scanning
- [ ] Enable database encryption at rest
- [ ] Configure secure session management
- [ ] Set up intrusion detection system

## 🚨 Security Monitoring

### Security Events Logged

1. **Authentication Events**:
   - Successful logins
   - Failed login attempts
   - Account lockouts
   - Password changes

2. **Authorization Events**:
   - Permission changes
   - Role modifications
   - Access denials
   - Privilege escalations

3. **Data Events**:
   - Data creation/modification/deletion
   - Bulk data operations
   - Export/import activities
   - Backup operations

4. **Security Events**:
   - Rate limit violations
   - Suspicious activity detection
   - Input validation failures
   - CSRF token violations

### Alert Thresholds

- **Critical**: SQL injection attempts, authentication bypass
- **High**: Multiple failed logins, rate limit violations
- **Medium**: Suspicious user agents, input sanitization triggers
- **Low**: Normal security events, successful authentications

## 🔍 Security Testing

### Automated Security Checks

1. **Input Validation Testing**:
   - SQL injection payloads
   - XSS attack vectors
   - Path traversal attempts
   - Command injection tests

2. **Authentication Testing**:
   - Brute force protection
   - Session management security
   - Password policy enforcement
   - Account lockout mechanisms

3. **Authorization Testing**:
   - Permission bypass attempts
   - Role escalation testing
   - CSRF protection validation
   - Rate limiting verification

### Manual Security Review

1. **Code Review Checklist**:
   - Input validation at all entry points
   - Proper authentication checks
   - Authorization before data access
   - Secure session management
   - Proper error handling

2. **Configuration Review**:
   - Security headers configuration
   - Rate limiting settings
   - Encryption key management
   - Audit logging coverage

## 📋 Security Incident Response

### Incident Classification

1. **P0 - Critical**: Data breach, authentication bypass
2. **P1 - High**: Account compromise, privilege escalation  
3. **P2 - Medium**: Rate limit violations, suspicious activity
4. **P3 - Low**: Failed authentication attempts, normal alerts

### Response Procedures

1. **Immediate Response**:
   - Isolate affected systems
   - Preserve audit logs
   - Notify security team
   - Document incident details

2. **Investigation**:
   - Analyze audit trails
   - Identify attack vectors
   - Assess data exposure
   - Trace attacker actions

3. **Remediation**:
   - Patch vulnerabilities
   - Update security controls
   - Reset compromised credentials
   - Improve monitoring

4. **Recovery**:
   - Restore affected systems
   - Verify security controls
   - Monitor for reoccurrence
   - Update security procedures

## 🔐 Best Practices

### For Developers

1. **Input Validation**:
   - Validate all user inputs
   - Use parameterized queries
   - Sanitize data before storage
   - Validate file uploads

2. **Authentication**:
   - Use strong session management
   - Implement proper logout
   - Enforce password policies
   - Monitor failed attempts

3. **Authorization**:
   - Check permissions at every access
   - Use principle of least privilege
   - Implement role-based access
   - Audit permission changes

### For Administrators

1. **Monitoring**:
   - Review security logs daily
   - Set up automated alerts
   - Monitor system metrics
   - Track user activities

2. **Maintenance**:
   - Keep systems updated
   - Review user permissions
   - Backup audit logs
   - Test incident response

3. **Configuration**:
   - Use secure defaults
   - Minimize attack surface
   - Enable security features
   - Document configurations

## 📞 Security Contact

For security issues or questions:
- **Security Team**: security@electricitytokens.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Bug Bounty**: security.md guidelines

## 🔄 Security Updates

This security documentation is reviewed and updated:
- **Monthly**: Security configuration review
- **Quarterly**: Threat model assessment  
- **Annually**: Comprehensive security audit
- **As needed**: After security incidents

---

*This document was last updated on: [Current Date]*
*Security implementation version: 1.0*