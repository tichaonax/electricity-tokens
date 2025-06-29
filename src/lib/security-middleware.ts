import { NextRequest, NextResponse } from 'next/server';
import { 
  RateLimiter, 
  SecurityValidator, 
  SecurityLogger, 
  CSRFProtection,
  validateRequestSize,
  getSecurityHeaders,
  type SecurityEvent
} from './security';

export interface SecurityMiddlewareOptions {
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  requireCSRF?: boolean;
  sanitizeInput?: boolean;
  logSecurityEvents?: boolean;
  skipRoutes?: string[];
}

export interface SecurityContext {
  rateLimitInfo?: {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  };
  isSecure: boolean;
  sanitizedBody?: any;
  csrfToken?: string;
}

/**
 * Comprehensive security middleware for API routes
 */
export function withSecurity(
  handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      rateLimit = { requests: 100, windowMs: 15 * 60 * 1000 },
      requireCSRF = false,
      sanitizeInput = true,
      logSecurityEvents = true,
      skipRoutes = []
    } = options;

    const context: SecurityContext = { isSecure: true };
    const pathname = new URL(request.url).pathname;

    // Skip security checks for specified routes
    if (skipRoutes.some(route => pathname.startsWith(route))) {
      return handler(request, context);
    }

    try {
      // 1. Validate request size
      const sizeValidation = validateRequestSize(request);
      if (!sizeValidation.valid) {
        if (logSecurityEvents) {
          await SecurityLogger.logSecurityEvent(
            SecurityLogger.createSecurityEvent(
              'SUSPICIOUS_ACTIVITY',
              { 
                reason: 'Request size too large',
                error: sizeValidation.error,
                pathname 
              },
              request,
              'MEDIUM'
            )
          );
        }

        return new NextResponse(
          JSON.stringify({ error: 'Request too large' }),
          { 
            status: 413,
            headers: {
              'Content-Type': 'application/json',
              ...getSecurityHeaders()
            }
          }
        );
      }

      // 2. Rate limiting
      const identifier = RateLimiter.getIdentifier(request);
      const rateLimitResult = RateLimiter.checkRateLimit(identifier, rateLimit);
      context.rateLimitInfo = rateLimitResult;

      if (!rateLimitResult.allowed) {
        if (logSecurityEvents) {
          await SecurityLogger.logSecurityEvent(
            SecurityLogger.createSecurityEvent(
              'RATE_LIMIT',
              { 
                identifier,
                pathname,
                resetTime: rateLimitResult.resetTime 
              },
              request,
              'HIGH'
            )
          );
        }

        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': rateLimit.requests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              ...getSecurityHeaders()
            }
          }
        );
      }

      // 3. CSRF Protection for state-changing operations
      if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token');
        const expectedToken = request.headers.get('x-csrf-expected');

        if (!csrfToken || !expectedToken || !CSRFProtection.validateToken(csrfToken, expectedToken)) {
          if (logSecurityEvents) {
            await SecurityLogger.logSecurityEvent(
              SecurityLogger.createSecurityEvent(
                'SUSPICIOUS_ACTIVITY',
                { 
                  reason: 'Invalid or missing CSRF token',
                  pathname,
                  method: request.method 
                },
                request,
                'HIGH'
              )
            );
          }

          return new NextResponse(
            JSON.stringify({ error: 'Invalid CSRF token' }),
            { 
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                ...getSecurityHeaders()
              }
            }
          );
        }

        context.csrfToken = csrfToken;
      }

      // 4. Input sanitization for requests with body
      if (sanitizeInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const contentType = request.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const body = await request.text();
            if (body) {
              let parsedBody;
              try {
                parsedBody = JSON.parse(body);
              } catch (e) {
                if (logSecurityEvents) {
                  await SecurityLogger.logSecurityEvent(
                    SecurityLogger.createSecurityEvent(
                      'INVALID_INPUT',
                      { 
                        reason: 'Invalid JSON format',
                        pathname 
                      },
                      request,
                      'MEDIUM'
                    )
                  );
                }

                return new NextResponse(
                  JSON.stringify({ error: 'Invalid JSON format' }),
                  { 
                    status: 400,
                    headers: {
                      'Content-Type': 'application/json',
                      ...getSecurityHeaders()
                    }
                  }
                );
              }

              // Recursively sanitize the parsed body
              context.sanitizedBody = sanitizeObject(parsedBody, logSecurityEvents, request, pathname);
            }
          }
        } catch (error) {
          console.error('Error during input sanitization:', error);
          // Continue with original request if sanitization fails
        }
      }

      // Add rate limit headers to response
      const response = await handler(request, context);
      
      // Add security headers to all responses
      const securityHeaders = getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimit.requests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      return response;

    } catch (error) {
      console.error('Security middleware error:', error);
      
      if (logSecurityEvents) {
        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'SUSPICIOUS_ACTIVITY',
            { 
              reason: 'Security middleware error',
              error: error instanceof Error ? error.message : 'Unknown error',
              pathname 
            },
            request,
            'HIGH'
          )
        );
      }

      return new NextResponse(
        JSON.stringify({ error: 'Internal security error' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders()
          }
        }
      );
    }
  };
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any, logEvents: boolean, request: NextRequest, pathname: string): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    const original = obj;
    const sanitized = SecurityValidator.sanitizeInput(obj);
    
    // Log if significant sanitization occurred
    if (logEvents && sanitized !== original && sanitized.length < original.length * 0.8) {
      SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'INVALID_INPUT',
          { 
            reason: 'Potentially malicious input detected and sanitized',
            originalLength: original.length,
            sanitizedLength: sanitized.length,
            pathname 
          },
          request,
          'MEDIUM'
        )
      );
    }
    
    return sanitized;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, logEvents, request, pathname));
  }

  if (typeof obj === 'object') {
    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const sanitizedKey = SecurityValidator.sanitizeInput(key);
      sanitizedObj[sanitizedKey] = sanitizeObject(value, logEvents, request, pathname);
    }
    return sanitizedObj;
  }

  return obj;
}

/**
 * Authentication security middleware
 */
export function withAuthSecurity(
  handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: { requests: 10, windowMs: 5 * 60 * 1000 }, // Stricter rate limit for auth
    requireCSRF: true,
    sanitizeInput: true,
    logSecurityEvents: true,
  });
}

/**
 * Admin-only security middleware with enhanced protection
 */
export function withAdminSecurity(
  handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: { requests: 50, windowMs: 15 * 60 * 1000 }, // Moderate rate limit for admin
    requireCSRF: true,
    sanitizeInput: true,
    logSecurityEvents: true,
  });
}

/**
 * Public API security middleware with basic protection
 */
export function withPublicSecurity(
  handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    rateLimit: { requests: 200, windowMs: 15 * 60 * 1000 }, // More lenient for public APIs
    requireCSRF: false,
    sanitizeInput: true,
    logSecurityEvents: true,
  });
}

/**
 * Cleanup rate limit store periodically
 */
setInterval(() => {
  RateLimiter.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes