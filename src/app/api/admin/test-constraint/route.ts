import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, purchaseId } = body;

    if (action === 'test-delete') {
      // Try to delete a purchase that has a contribution
      const purchase = await prisma.tokenPurchase.findUnique({
        where: { id: purchaseId },
        include: { contribution: true }
      });

      if (!purchase) {
        return NextResponse.json(
          { message: 'Purchase not found' },
          { status: 404 }
        );
      }

      if (!purchase.contribution) {
        return NextResponse.json(
          { message: 'Purchase has no contribution to test with' },
          { status: 400 }
        );
      }

      try {
        // This should fail with the new constraint
        await prisma.tokenPurchase.delete({
          where: { id: purchaseId }
        });

        return NextResponse.json({
          success: false,
          message: 'ERROR: Purchase was deleted despite having a contribution! Constraint is NOT working.',
          constraintWorking: false
        });

      } catch (error: any) {
        if (error.code === 'P2003') {
          return NextResponse.json({
            success: true,
            message: 'Constraint is working: Cannot delete purchase with contribution',
            constraintWorking: true,
            error: error.message
          });
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error testing constraint:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}