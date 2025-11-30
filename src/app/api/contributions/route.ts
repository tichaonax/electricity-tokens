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
import { validateContributionMeterReading } from '@/lib/meter-reading-validation';
import { canPurchaseAcceptContribution } from '@/lib/sequential-contributions';

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
        calculateBalance?: boolean;
      };
    };
    const {
      page = 1,
      limit = 10,
      purchaseId,
      userId,
      calculateBalance,
    } = query || {};

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: ContributionWhereInput = {};

    if (purchaseId) {
      where.purchaseId = purchaseId;
    }

    // Always show global contributions since user wants all data global
    // Remove userId filter

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
        orderBy: {
          purchase: {
            purchaseDate: 'desc',
          },
        },
        skip,
        take: limit,
      }),
      prisma.userContribution.count({ where }),
    ]);

    // Calculate running balance if requested - this is a GLOBAL balance, not per-user
    let runningBalance = 0;
    if (calculateBalance) {
      // Use the same calculation as the dashboard for consistency
      const { calculateUserTrueCost } = await import('@/lib/cost-calculations');
      const globalCostBreakdown = calculateUserTrueCost(balanceContributions);
      runningBalance = globalCostBreakdown.overpayment;
    }

    const response = {
      contributions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (calculateBalance) {
      response.runningBalance = runningBalance;
    }

    return NextResponse.json(response);
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

    // Check if contribution already exists for this purchase (new business rule: one per purchase)
    const existingContribution = await prisma.userContribution.findUnique({
      where: {
        purchaseId: purchaseId,
      },
    });

    if (existingContribution) {
      return NextResponse.json(
        { message: 'Contribution already exists for this purchase' },
        { status: 400 }
      );
    }

    // Validate sequential contribution constraint (unless admin)
    const isAdmin = permissionCheck.user!.role === 'ADMIN';
    const sequentialValidation = await canPurchaseAcceptContribution(
      purchaseId,
      isAdmin
    );

    if (!sequentialValidation.canContribute) {
      return NextResponse.json(
        {
          message:
            sequentialValidation.reason || 'Cannot contribute to this purchase',
          nextAvailablePurchaseId: sequentialValidation.nextAvailablePurchaseId,
        },
        { status: 400 }
      );
    }

    // Validate meter reading chronology and constraints
    const meterValidation = await validateContributionMeterReading(
      meterReading,
      purchaseId
    );

    if (!meterValidation.valid) {
      return NextResponse.json(
        { message: meterValidation.error || 'Invalid meter reading' },
        { status: 400 }
      );
    }

    // Validate business rules
    const businessRuleCheck = await validateBusinessRules(
      {
        checkDuplicateContribution: {
          purchaseId,
          userId: targetUserId,
        },
        checkMeterReadingMatch: {
          purchaseId,
          contributionMeterReading: meterReading,
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

    // Generate a CUID for the user contribution
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    const contributionId = `c${timestamp}${randomPart}${randomPart2}`;

    const contribution = await prisma.userContribution.create({
      data: {
        id: contributionId,
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

    // Generate a CUID for the audit log
    const auditTimestamp = Date.now().toString(36);
    const auditRandomPart = Math.random().toString(36).substring(2, 15);
    const auditRandomPart2 = Math.random().toString(36).substring(2, 15);
    const auditLogId = `c${auditTimestamp}${auditRandomPart}${auditRandomPart2}`;

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        id: auditLogId,
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
