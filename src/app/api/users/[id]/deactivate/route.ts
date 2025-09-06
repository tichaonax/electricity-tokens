import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can deactivate other users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { reason } = await request.json();

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { message: 'Deactivation reason is required' },
        { status: 400 }
      );
    }

    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admins from deactivating themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Deactivate the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason.trim(),
        deactivatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}