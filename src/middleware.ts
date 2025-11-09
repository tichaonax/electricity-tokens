import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Allow access to auth pages
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }

    // If user is authenticated but needs password reset, redirect to change-password
    if (token?.passwordResetRequired && pathname !== '/auth/change-password') {
      return NextResponse.redirect(new URL('/auth/change-password', req.url));
    }

    // Clean up old NextAuth cookies - remove legacy cookie names
    const response = NextResponse.next();
    const oldCookieNames = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.csrf-token'
    ];

    // Check if any old cookies exist and clear them
    const cookies = req.cookies;
    let hasOldCookies = false;

    for (const oldName of oldCookieNames) {
      if (cookies.get(oldName)) {
        hasOldCookies = true;
        // Delete the old cookie by setting it to expire immediately
        response.cookies.set(oldName, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
      }
    }

    // Allow access to other authenticated routes
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Always allow access to auth pages
        if (pathname.startsWith('/auth/')) {
          return true;
        }

        // For other pages, user must be authenticated
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api/health (public health check endpoint)
     * - api/user/theme (handles auth internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/health|api/user/theme|_next/static|_next/image|favicon.ico|public|icons|manifest.json).*)',
  ],
};