import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can access this endpoint
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the latest purchase
    const latestPurchase = await prisma.tokenPurchase.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalTokens: true,
        totalPayment: true,
        purchaseDate: true,
        isEmergency: true,
        createdAt: true,
      },
    });

    if (!latestPurchase) {
      return NextResponse.json(
        { message: 'No purchases found' },
        { status: 404 }
      );
    }

    return NextResponse.json(latestPurchase);
  } catch (error) {
    console.error('Error fetching latest purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}