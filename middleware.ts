import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { 
  RateLimiter, 
  SecurityLogger, 
  getSecurityHeaders,
  validateRequestSize
} from './src/lib/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // FIRST PRIORITY: Completely prevent callback URL parameters from appearing anywhere
  if (request.nextUrl.searchParams.has('callbackUrl')) {
    const cleanUrl = new URL(pathname, request.url);
    // Use 302 redirect to prevent caching
    return NextResponse.redirect(cleanUrl, 302);
  }
  
  // Also handle root redirect to avoid NextAuth callback URL pollution
  if (pathname === '/' && request.nextUrl.search.includes('callbackUrl')) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  const response = NextResponse.next();
  
  // Add security headers to all responses
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip middleware for static assets and Next.js internals, and auth pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth/') ||
    (pathname.includes('.') && !pathname.includes('/auth/')) ||
    pathname === '/favicon.ico'
  ) {
    return response;
  }

  try {
    // 1. Global request size validation
    const sizeValidation = validateRequestSize(request);
    if (!sizeValidation.valid) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          { 
            reason: 'Request size exceeded global limit',
            pathname,
            error: sizeValidation.error
          },
          request,
          'HIGH'
        )
      );

      return new NextResponse('Request too large', { 
        status: 413,
        headers: securityHeaders
      });
    }

    // 2. Global rate limiting (less strict than API-specific limits)
    const identifier = RateLimiter.getIdentifier(request);
    const rateLimitResult = RateLimiter.checkRateLimit(identifier, {
      requests: 300, // Global limit: 300 requests per window
      windowMs: 15 * 60 * 1000 // 15 minutes
    });

    if (!rateLimitResult.allowed) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'RATE_LIMIT',
          { 
            identifier,
            pathname,
            type: 'global',
            resetTime: rateLimitResult.resetTime 
          },
          request,
          'MEDIUM'
        )
      );

      return new NextResponse('Too many requests', { 
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        }
      });
    }

    // 3. Authentication checks for protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });

      if (!token) {
        // Force redirect to clean sign-in page to prevent NextAuth from adding callback URLs
        const signInUrl = new URL('/auth/signin', request.url);
        
        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'AUTHENTICATION_FAILURE',
            { 
              reason: 'No valid session token',
              pathname,
              redirectTo: signInUrl.toString()
            },
            request,
            'LOW'
          )
        );

        // Use direct redirect without callback URL
        return NextResponse.redirect(signInUrl);
      }

      // Admin route protection
      if (pathname.startsWith('/dashboard/admin') && token.role !== 'ADMIN') {
        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'AUTHENTICATION_FAILURE',
            { 
              reason: 'Insufficient privileges for admin route',
              userRole: token.role,
              userId: token.sub,
              pathname
            },
            request,
            'MEDIUM'
          )
        );

        // Redirect to main dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Check if user account is locked
      if (token.locked) {
        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'AUTHENTICATION_FAILURE',
            { 
              reason: 'Account is locked',
              userId: token.sub,
              pathname
            },
            request,
            'HIGH'
          )
        );

        // Redirect to locked account page
        return NextResponse.redirect(new URL('/auth/locked', request.url));
      }
    }

    // 4. API route security headers
    if (pathname.startsWith('/api/')) {
      // Add additional API-specific headers
      response.headers.set('X-API-Version', '1.0');
      response.headers.set('X-RateLimit-Limit', '300');
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    }

    // 5. Suspicious pattern detection
    await detectSuspiciousPatterns(request, pathname);

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    
    await SecurityLogger.logSecurityEvent(
      SecurityLogger.createSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        { 
          reason: 'Middleware processing error',
          error: error instanceof Error ? error.message : 'Unknown error',
          pathname
        },
        request,
        'HIGH'
      )
    );

    // Continue with the request even if middleware fails
    return response;
  }
}

/**
 * Detect suspicious patterns in requests
 */
async function detectSuspiciousPatterns(request: NextRequest, pathname: string) {
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    // SQL injection attempts
    /(union|select|insert|update|delete|drop|create|alter)\s/i,
    // XSS attempts
    /<script|javascript:|on\w+\s*=/i,
    // Path traversal
    /\.\.\//,
    // Command injection - refined to avoid false positives with URL parameters
    /;\s*[a-zA-Z]|[\|&]{2,}|`.*`/,
    // Common bot patterns
    /bot|crawler|spider|scraper/i,
  ];

  const queryString = request.nextUrl.search;
  const fullUrl = pathname + queryString;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(userAgent)) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          { 
            reason: 'Suspicious pattern detected',
            pattern: pattern.source,
            userAgent,
            referer,
            pathname,
            queryString
          },
          request,
          'HIGH'
        )
      );
      break;
    }
  }

  // Check for unusual request patterns
  if (!userAgent) {
    await SecurityLogger.logSecurityEvent(
      SecurityLogger.createSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        { 
          reason: 'Missing User-Agent header',
          pathname
        },
        request,
        'MEDIUM'
      )
    );
  }

  // Check for requests from localhost in production
  if (process.env.NODE_ENV === 'production') {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    if (ip.startsWith('127.') || ip.startsWith('::1') || ip === 'localhost') {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          { 
            reason: 'Localhost request in production',
            ip,
            pathname
          },
          request,
          'MEDIUM'
        )
      );
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes) - but process signin page and root
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};