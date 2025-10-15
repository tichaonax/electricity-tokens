import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      hasSession: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
            passwordResetRequired: session.user.passwordResetRequired,
          }
        : null,
      timestamp: new Date().toISOString(),
      url: request.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        hasSession: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
