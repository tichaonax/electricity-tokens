import DOMPurify from 'dompurify';
import xss from 'xss';
import validator from 'validator';
import CryptoJS from 'crypto-js';
import { NextRequest } from 'next/server';

// Configuration for security settings
const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  ENCRYPTION_KEY: process.env.ENCRYPTION_SECRET || 'default-key-change-in-production',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
  },
};

// Input Sanitization and Validation
export class SecurityValidator {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (typeof window !== 'undefined') {
      // Client-side sanitization
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href'],
      });
    }
    // Server-side sanitization using xss
    return xss(input, {
      whiteList: {
        b: [],
        i: [],
        em: [],
        strong: [],
        a: ['href'],
        p: [],
        br: [],
      },
    });
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  static sanitizeInput(input: unknown): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    
    // Escape potential SQL injection characters
    sanitized = sanitized.replace(/'/g, "''").replace(/;/g, '\\;');
    
    // Remove script tags and javascript: protocols
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Limit length to prevent buffer overflow attacks
    return sanitized.substring(0, 10000);
  }

  /**
   * Validate email format with additional security checks
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    // Basic format validation
    if (!validator.isEmail(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Additional security checks
    if (email.length > 254) {
      return { isValid: false, error: 'Email too long' };
    }

    // Check for suspicious patterns
    if (/[<>'";&\\]/.test(email)) {
      return { isValid: false, error: 'Email contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; error?: string; strength: number } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required', strength: 0 };
    }

    const { requireUppercase, requireLowercase, requireNumbers, requireSymbols } = SECURITY_CONFIG.PASSWORD_REQUIREMENTS;
    const errors: string[] = [];
    let strength = 0;

    // Length check
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`);
    } else {
      strength += 1;
    }

    // Character requirements
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    } else if (/[A-Z]/.test(password)) {
      strength += 1;
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    } else if (/[a-z]/.test(password)) {
      strength += 1;
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers');
    } else if (/\d/.test(password)) {
      strength += 1;
    }

    if (requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain symbols');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    }

    // Check for common weak patterns
    if (/^(.)\1+$/.test(password)) {
      errors.push('Password cannot be all the same character');
      strength = 0;
    }

    if (/123456|password|qwerty|admin/i.test(password)) {
      errors.push('Password is too common');
      strength = Math.max(0, strength - 2);
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors[0] : undefined,
      strength: Math.min(5, strength),
    };
  }

  /**
   * Validate numeric input for token calculations
   */
  static validateNumericInput(input: unknown, options: { min?: number; max?: number; allowDecimal?: boolean } = {}): { isValid: boolean; value?: number; error?: string } {
    const { min = 0, max = Number.MAX_SAFE_INTEGER, allowDecimal = true } = options;

    if (input === null || input === undefined || input === '') {
      return { isValid: false, error: 'Value is required' };
    }

    let numericValue: number;

    if (typeof input === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleaned = input.replace(/[^\d.-]/g, '');
      numericValue = parseFloat(cleaned);
    } else if (typeof input === 'number') {
      numericValue = input;
    } else {
      return { isValid: false, error: 'Invalid numeric format' };
    }

    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return { isValid: false, error: 'Invalid number' };
    }

    if (!allowDecimal && numericValue % 1 !== 0) {
      return { isValid: false, error: 'Decimal values not allowed' };
    }

    if (numericValue < min) {
      return { isValid: false, error: `Value must be at least ${min}` };
    }

    if (numericValue > max) {
      return { isValid: false, error: `Value cannot exceed ${max}` };
    }

    return { isValid: true, value: numericValue };
  }
}

// Rate Limiting Implementation
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  /**
   * Check if request should be rate limited
   */
  static checkRateLimit(identifier: string, options: { requests?: number; windowMs?: number } = {}): { allowed: boolean; remaining: number; resetTime: number } {
    const { requests = SECURITY_CONFIG.RATE_LIMIT_REQUESTS, windowMs = SECURITY_CONFIG.RATE_LIMIT_WINDOW } = options;
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: requests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= requests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: requests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get rate limit identifier from request
   */
  static getIdentifier(request: NextRequest): string {
    // Use IP address as primary identifier
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Include user agent for additional fingerprinting
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const fingerprint = CryptoJS.MD5(`${ip}-${userAgent}`).toString();
    
    return fingerprint;
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Data Encryption Utilities
export class DataEncryption {
  /**
   * Encrypt sensitive data
   */
  static encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, SECURITY_CONFIG.ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECURITY_CONFIG.ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Failed to decrypt data');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }
}

// CSRF Protection
export class CSRFProtection {
  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return DataEncryption.generateToken(32);
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(token, expectedToken);
  }

  /**
   * Constant-time string comparison
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

// Security Headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Content Type Options
    'X-Content-Type-Options': 'nosniff',
    
    // Frame Options
    'X-Frame-Options': 'DENY',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: In production, remove unsafe-inline and unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
    ].join(', '),
  };
}

// Request Validation Middleware
export function validateRequestSize(request: NextRequest): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > SECURITY_CONFIG.MAX_REQUEST_SIZE) {
      return {
        valid: false,
        error: `Request size too large. Maximum allowed: ${SECURITY_CONFIG.MAX_REQUEST_SIZE} bytes`,
      };
    }
  }

  return { valid: true };
}

// Security Event Logging
export interface SecurityEvent {
  type: 'RATE_LIMIT' | 'INVALID_INPUT' | 'AUTHENTICATION_FAILURE' | 'SUSPICIOUS_ACTIVITY';
  details: Record<string, unknown>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class SecurityLogger {
  /**
   * Log security events for monitoring
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // In production, this should integrate with your logging system
    console.warn('Security Event:', {
      ...event,
      timestamp: event.timestamp.toISOString(),
    });

    // For high severity events, you might want to trigger alerts
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      // Implement alerting logic here
      console.error('CRITICAL SECURITY EVENT:', event);
    }
  }

  /**
   * Create security event from request
   */
  static createSecurityEvent(
    type: SecurityEvent['type'],
    details: Record<string, unknown>,
    request: NextRequest,
    severity: SecurityEvent['severity'] = 'MEDIUM'
  ): SecurityEvent {
    return {
      type,
      details,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      severity,
    };
  }
}

// Export configuration for testing
export { SECURITY_CONFIG };