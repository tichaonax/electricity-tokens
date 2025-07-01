import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const validateSequentialPurchaseSchema = z.object({
  purchaseDate: z.string().datetime('Invalid purchase date format'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateSequentialPurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Invalid request data',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { purchaseDate } = validation.data;
    const date = new Date(purchaseDate);

    // Skip validation if user is admin (admins can bypass this constraint)
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({
        valid: true,
        context:
          'Admin bypass enabled - sequential purchase constraint skipped',
      });
    }

    // Find the most recent purchase before the new purchase date
    const previousPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        purchaseDate: { lt: date },
      },
      include: {
        contribution: {
          select: {
            id: true,
            tokensConsumed: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // If there's a previous purchase without contribution, block the new purchase
    if (previousPurchase && !previousPurchase.contribution) {
      return NextResponse.json({
        valid: false,
        error: `Cannot create new purchase. Previous purchase from ${previousPurchase.purchaseDate.toLocaleDateString()} requires a contribution first.`,
        blockingPurchase: {
          id: previousPurchase.id,
          date: previousPurchase.purchaseDate.toISOString(),
          totalTokens: previousPurchase.totalTokens,
        },
      });
    }

    // Validation passed
    return NextResponse.json({
      valid: true,
      context: previousPurchase
        ? `Last purchase from ${previousPurchase.purchaseDate.toLocaleDateString()} has a valid contribution.`
        : 'No previous purchases found - this will be the first purchase.',
    });
  } catch (error) {
    console.error('Error validating sequential purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
