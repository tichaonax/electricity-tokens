import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    const first = await prisma.receiptData.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { accountNumber: true },
    });
    return NextResponse.json({ accountNumber: first?.accountNumber || null });
  } catch {
    return NextResponse.json({ accountNumber: null });
  }
}
