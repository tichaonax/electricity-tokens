import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();

  const requestCookies = request.headers.get('cookie');

  return NextResponse.json({
    serverSideCookies: allCookies,
    requestHeaderCookies: requestCookies,
    sessionToken: cookieStore.get('electricity-tokens.session-token'),
    hasSessionToken: cookieStore.has('electricity-tokens.session-token'),
  });
}
