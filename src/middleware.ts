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

    // Allow access to other authenticated routes
    return NextResponse.next();
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|icons|manifest.json).*)',
  ],
};