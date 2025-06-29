import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ContributionWhereInput } from '@/types/api';
import {
  createUserContributionSchema,
  contributionQuerySchema,
} from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  sanitizeInput,
  checkPermissions,
  validateBusinessRules,
} from '@/lib/validation-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate query parameters
    const validation = await validateRequest(request, {
      query: contributionQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query?: {
        page?: number;
        limit?: number;
        purchaseId?: string;
        userId?: string;
      };
    };
    const { page = 1, limit = 10, purchaseId, userId } = query || {};

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
    if (permissionCheck.user!.role !== 'ADMIN') {
      where.userId = permissionCheck.user!.id;
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

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, {
      body: createUserContributionSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: {
        purchaseId: string;
        contributionAmount: number;
        meterReading: number;
        tokensConsumed: number;
        userId?: string;
      };
    };
    const sanitizedData = sanitizeInput(body);
    const {
      purchaseId,
      contributionAmount,
      meterReading,
      tokensConsumed,
      userId,
    } = sanitizedData as {
      purchaseId: string;
      contributionAmount: number;
      meterReading: number;
      tokensConsumed: number;
      userId?: string;
    };

    // Use session user ID if userId not provided or if user is not admin
    const targetUserId =
      permissionCheck.user!.role === 'ADMIN' && userId
        ? userId
        : permissionCheck.user!.id;

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

    // Validate business rules
    const businessRuleCheck = await validateBusinessRules(
      {
        checkTokenAvailability: {
          purchaseId,
          requestedTokens: tokensConsumed,
        },
        checkDuplicateContribution: {
          purchaseId,
          userId: targetUserId,
        },
      },
      prisma
    );

    if (!businessRuleCheck.success) {
      return NextResponse.json(
        { message: businessRuleCheck.error },
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
        userId: permissionCheck.user!.id,
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
