import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recalculateAllTokensConsumed } from '@/lib/balance-fix';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    console.log(`🔧 Recalculate tokens consumed initiated by ${session.user.name} (${session.user.email})`);

    await recalculateAllTokensConsumed();

    return NextResponse.json({
      message: 'Tokens consumed recalculated successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error recalculating tokens consumed:', error);
    return NextResponse.json(
      {
        message: 'Failed to recalculate tokens consumed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}