import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  RateLimiter,
  SecurityLogger,
  getSecurityHeaders,
  validateRequestSize,
} from './src/lib/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CRITICAL: Skip middleware for auth and dashboard routes FIRST before any processing
  // This allows NextAuth to handle its own redirects and prevents interference with authentication
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/user') || // Skip user API routes - they handle their own auth
    pathname.startsWith('/api/health') || // Skip all health endpoints
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/dashboard') || // Skip dashboard routes - they handle their own auth via SessionProvider
    (pathname.includes('.') && !pathname.includes('/auth/')) ||
    pathname === '/favicon.ico' ||
    pathname === '/' // Skip root page
  ) {
    return NextResponse.next();
  }

  // Only strip callbackUrl from non-auth pages
  if (request.nextUrl.searchParams.has('callbackUrl')) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

    // CRITICAL: Block API endpoints from being used as callback URLs
    if (callbackUrl?.startsWith('/api/')) {
      console.warn('🚫 Blocked API endpoint as callbackUrl:', callbackUrl);
      const cleanUrl = new URL('/auth/signin', request.url);
      return NextResponse.redirect(cleanUrl, 302);
    }

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

  // Optional deployment-time cache-invalidation: when set, mark root HTML responses
  // so clients will fetch fresh HTML and pick up cache-invalidation headers.
  try {
    const forceInvalidate = process.env.FORCE_CACHE_INVALIDATION === '1';
    if (forceInvalidate && pathname === '/') {
      // Prevent caching of root HTML
      response.headers.set(
        'Cache-Control',
        'no-cache, no-store, must-revalidate, max-age=0'
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      // Instruct any client-side cache invalidation logic to run
      response.headers.set('X-Cache-Invalidate', 'true');
      response.headers.set('X-Deploy-Timestamp', Date.now().toString());
    }
  } catch {
    // swallow
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
            error: sizeValidation.error,
          },
          request,
          'HIGH'
        )
      );

      return new NextResponse('Request too large', {
        status: 413,
        headers: securityHeaders,
      });
    }

    // 2. Global rate limiting (less strict than API-specific limits)
    const identifier = RateLimiter.getIdentifier(request);
    const rateLimitResult = RateLimiter.checkRateLimit(identifier, {
      requests: 300, // Global limit: 300 requests per window
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimitResult.allowed) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'RATE_LIMIT',
          {
            identifier,
            pathname,
            type: 'global',
            resetTime: rateLimitResult.resetTime,
          },
          request,
          'MEDIUM'
        )
      );

      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ).toString(),
        },
      });
    }

    // 3. Authentication checks for protected routes
    // TEMPORARILY DISABLED FOR TESTING - Let NextAuth handle all auth
    if (
      false &&
      (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))
    ) {
      // DEBUG: log cookies to inspect what the browser is sending
      try {
        const cookieHeader = request.headers.get('cookie');
        console.log('🔐 MIDDLEWARE DEBUG - request cookies:', cookieHeader);
      } catch {
        // ignore
      }

      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        // Read from the custom cookie name configured in NextAuth
        cookieName: 'electricity-tokens.session-token',
      });

      // When debugging, print a small, non-sensitive summary of the token
      // (do NOT print full token contents or secrets). This is temporary.
      if (process.env.DEBUG_AUTH === '1') {
        try {
          if (token) {
            console.log(
              `🔐 MIDDLEWARE DEBUG - getToken result: present sub=${token.sub} role=${token.role}`
            );
          } else {
            console.log('🔐 MIDDLEWARE DEBUG - getToken result: null');
          }
        } catch {
          // ignore logging errors
        }
      }

      if (!token) {
        // Force redirect to clean sign-in page to prevent NextAuth from adding callback URLs
        const signInUrl = new URL('/auth/signin', request.url);

        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'AUTHENTICATION_FAILURE',
            {
              reason: 'No valid session token',
              pathname,
              redirectTo: signInUrl.toString(),
            },
            request,
            'LOW'
          )
        );

        // Optionally include incoming cookie header in redirect response for debugging
        const debugEnabled = process.env.DEBUG_AUTH === '1';
        if (debugEnabled) {
          const cookieHeader = request.headers.get('cookie') || '';
          const redirectResponse = NextResponse.redirect(signInUrl);
          redirectResponse.headers.set('X-Debug-Cookies', cookieHeader);
          return redirectResponse;
        }

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
              pathname,
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
              pathname,
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
      response.headers.set(
        'X-RateLimit-Remaining',
        rateLimitResult.remaining.toString()
      );
      response.headers.set(
        'X-RateLimit-Reset',
        rateLimitResult.resetTime.toString()
      );
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
          pathname,
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
async function detectSuspiciousPatterns(
  request: NextRequest,
  pathname: string
) {
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
    // Command injection - more specific patterns to avoid false positives
    /;\s*(rm|del|format|mkdir|sudo|su|passwd|chmod|chown)\b/i,
    /\|\|\s*[a-zA-Z]|\&\&\s*[a-zA-Z]/,
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
            queryString,
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
          pathname,
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
            pathname,
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
