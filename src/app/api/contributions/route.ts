import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ContributionWhereInput } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const purchaseId = searchParams.get('purchaseId');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: ContributionWhereInput = {};

    if (purchaseId) {
      where.purchaseId = purchaseId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Non-admin users can only see their own contributions
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    }

    const [contributions, total] = await Promise.all([
      prisma.userContribution.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          purchase: {
            select: {
              id: true,
              totalTokens: true,
              totalPayment: true,
              purchaseDate: true,
              isEmergency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userContribution.count({ where }),
    ]);

    return NextResponse.json({
      contributions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      purchaseId,
      userId,
      contributionAmount,
      meterReading,
      tokensConsumed,
    } = await request.json();

    // Validate required fields
    if (
      !purchaseId ||
      !contributionAmount ||
      !meterReading ||
      !tokensConsumed
    ) {
      return NextResponse.json(
        {
          message:
            'Missing required fields: purchaseId, contributionAmount, meterReading, tokensConsumed',
        },
        { status: 400 }
      );
    }

    // Use session user ID if userId not provided or if user is not admin
    const targetUserId =
      session.user.role === 'ADMIN' && userId ? userId : session.user.id;

    // Validate data types and values
    if (typeof contributionAmount !== 'number' || contributionAmount <= 0) {
      return NextResponse.json(
        { message: 'contributionAmount must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof meterReading !== 'number' || meterReading < 0) {
      return NextResponse.json(
        { message: 'meterReading must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof tokensConsumed !== 'number' || tokensConsumed < 0) {
      return NextResponse.json(
        { message: 'tokensConsumed must be a non-negative number' },
        { status: 400 }
      );
    }

    // Check if purchase exists
    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if contribution already exists for this user and purchase
    const existingContribution = await prisma.userContribution.findUnique({
      where: {
        purchaseId_userId: {
          purchaseId,
          userId: targetUserId,
        },
      },
    });

    if (existingContribution) {
      return NextResponse.json(
        { message: 'Contribution already exists for this user and purchase' },
        { status: 400 }
      );
    }

    // Validate that tokens consumed doesn't exceed available tokens
    const totalContributions = await prisma.userContribution.aggregate({
      where: { purchaseId },
      _sum: { tokensConsumed: true },
    });

    const totalConsumed =
      (totalContributions._sum.tokensConsumed || 0) + tokensConsumed;

    if (totalConsumed > purchase.totalTokens) {
      return NextResponse.json(
        { message: 'Total tokens consumed cannot exceed available tokens' },
        { status: 400 }
      );
    }

    const contribution = await prisma.userContribution.create({
      data: {
        purchaseId,
        userId: targetUserId,
        contributionAmount: parseFloat(contributionAmount.toString()),
        meterReading: parseFloat(meterReading.toString()),
        tokensConsumed: parseFloat(tokensConsumed.toString()),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchase: {
          select: {
            id: true,
            totalTokens: true,
            totalPayment: true,
            purchaseDate: true,
            isEmergency: true,
          },
        },
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'UserContribution',
        entityId: contribution.id,
        newValues: contribution,
      },
    });

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
