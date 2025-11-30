import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calculatePeriodCostAnalysis,
  calculateUserTrueCost,
  generateCostRecommendations,
  calculateOptimalContribution,
  calculatePurchaseComparison,
  type Purchase,
  type Contribution,
} from '@/lib/cost-calculations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';

const costAnalysisQuerySchema = z.object({
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  analysisType: z
    .enum(['user', 'period', 'recommendations', 'optimal', 'comparison'])
    .default('user'),
});

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
      query: costAnalysisQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query: {
        userId?: string;
        startDate?: string;
        endDate?: string;
        analysisType: 'user' | 'period' | 'recommendations' | 'optimal' | 'comparison';
      };
    };

    const { userId, startDate, endDate, analysisType } = query;
    console.log('cost-analysis query params:', { userId, startDate, endDate, analysisType });

    // For global reports, userId is optional
    // If userId is provided, validate it and check permissions
    let targetUserId: string | undefined = userId;

    const userPermissions = permissionCheck.user!.permissions as Record<string, unknown> | null;
    const canViewAllCostAnalysis =
      permissionCheck.user!.role === 'ADMIN' ||
      userPermissions?.canViewCostAnalysis === true ||
      userPermissions?.canViewUsageReports === true ||
      userPermissions?.canViewDualCurrencyAnalysis === true;

    if (targetUserId) {
      // Validate that the target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, isActive: true },
      });

      if (!targetUser || !targetUser.isActive) {
        return NextResponse.json(
          { message: 'Invalid user ID' },
          { status: 400 }
        );
      }

      // Check if user can access specific user data
      if (
        targetUserId !== permissionCheck.user!.id &&
        !canViewAllCostAnalysis
      ) {
        return NextResponse.json(
          { message: 'Access denied: insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Fetch data based on analysis type
    switch (analysisType) {
      case 'user': {
        // Get all contributions (global) or user-specific if userId provided
        // Use purchase date for filtering and ordering, not createdAt
        const contribution = await prisma.userContribution.findMany({
          where: {
            ...(targetUserId && { userId: targetUserId }),
            ...(start && {
              purchase: { purchaseDate: { gte: start } },
            }),
            ...(end && {
              purchase: { purchaseDate: { lte: end } },
            }),
          },
          include: {
            purchase: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            purchase: {
              purchaseDate: 'desc',
            },
          },
        });

        const costBreakdown = calculateUserTrueCost(
          contribution as Contribution[]
        );

        console.log('COST-ANALYSIS: comparison query', { userId: targetUserId, start, end, contributions: contribution.length });
        const purchaseComparison = calculatePurchaseComparison(
          contribution as Contribution[]
        );

        return NextResponse.json({
          userId: targetUserId || 'global',
          costBreakdown,
          purchaseComparison,
          contribution: contribution.length,
          period: { start, end },
        });
      }

      case 'period': {
        // Get all purchases and contribution for the period
        const purchases = await prisma.tokenPurchase.findMany({
          where: {
            ...(start && { purchaseDate: { gte: start } }),
            ...(end && { purchaseDate: { lte: end } }),
          },
          include: {
            contribution: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const contribution = await prisma.userContribution.findMany({
          where: {
            ...(start && { createdAt: { gte: start } }),
            ...(end && { createdAt: { lte: end } }),
          },
          include: {
            purchase: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const periodAnalysis = calculatePeriodCostAnalysis(
          purchases as Purchase[],
          contribution as Contribution[],
          start,
          end
        );

        return NextResponse.json(periodAnalysis);
      }

      case 'recommendations': {
        // Get all contributions (global) or user-specific if userId provided
        const contribution = await prisma.userContribution.findMany({
          where: {
            ...(targetUserId && { userId: targetUserId }),
            ...(start && { createdAt: { gte: start } }),
            ...(end && { createdAt: { lte: end } }),
          },
          include: {
            purchase: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const purchases = await prisma.tokenPurchase.findMany({
          where: {
            ...(targetUserId && {
              contribution: {
                some: { userId: targetUserId },
              },
            }),
          },
          include: {
            contribution: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Calculate user summary
        const costBreakdown = calculateUserTrueCost(
          contribution as Contribution[]
        );

        const userSummary = {
          userId: targetUserId || 'global',
          userName: contribution[0]?.user?.name || 'All Users',
          contribution: contribution as Contribution[],
          purchases: purchases as Purchase[],
          ...costBreakdown,
        };

        const recommendations = generateCostRecommendations(userSummary);

        return NextResponse.json({
          user: userSummary,
          recommendations,
          period: { start, end },
        });
      }

      case 'optimal': {
        // Calculate optimal contribution for recent contributions (global or user-specific)
        // Use purchase date, not createdAt (which gets reset on backup restore)
        const recentContributions = await prisma.userContribution.findMany({
          where: {
            ...(targetUserId && { userId: targetUserId }),
            purchase: {
              purchaseDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
          include: {
            purchase: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            purchase: {
              purchaseDate: 'desc',
            },
          },
          take: 50, // Get more contributions for global view
        });

        const optimalContributions = recentContributions
          .map((contribution) => {
            const purchase = contribution.purchase;
            if (!purchase) return null;

            const optimal = calculateOptimalContribution(
              contribution.tokensConsumed,
              purchase as Purchase
            );

            return {
              purchaseId: purchase.id,
              purchaseDate: purchase.purchaseDate,
              isEmergency: purchase.isEmergency,
              actualContribution: contribution.contributionAmount,
              tokensConsumed: contribution.tokensConsumed,
              ...optimal,
              difference:
                contribution.contributionAmount -
                optimal.totalOptimalContribution,
            };
          })
          .filter(Boolean);

        return NextResponse.json({
          userId: targetUserId || 'global',
          optimalContributions,
          summary: {
            totalPurchases: optimalContributions.length,
            averageDifference:
              optimalContributions.reduce(
                (sum, oc) => sum + (oc?.difference || 0),
                0
              ) / (optimalContributions.length || 1),
          },
        });
      }

      case 'comparison': {
        // Get all contributions (global) or user-specific if userId provided.
        // To ensure date filtering is robust, fetch purchase IDs in the date range first, then query contributions by those purchase IDs.
        let purchaseIds: string[] | undefined;
        if (start || end) {
          const purchases = await prisma.tokenPurchase.findMany({
            where: {
              ...(start && { purchaseDate: { gte: start } }),
              ...(end && { purchaseDate: { lte: end } }),
            },
            select: { id: true },
          });
          purchaseIds = purchases.map((p) => p.id);
          console.log('COST-ANALYSIS: filtered purchases', { count: purchaseIds.length, ids: purchaseIds.slice(0, 20) });
        }

        const contribution = await prisma.userContribution.findMany({
          where: {
            ...(targetUserId && { userId: targetUserId }),
            ...(purchaseIds && { purchaseId: { in: purchaseIds } }),
          },
          include: {
            purchase: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            purchase: {
              purchaseDate: 'desc',
            },
          },
        });
        console.log('COST-ANALYSIS: contributions found', { count: contribution.length, sample: contribution.slice(0, 10).map(c => ({ id: c.id, purchaseId: c.purchaseId, purchaseDate: c.purchase?.purchaseDate })) });

        const purchaseComparison = calculatePurchaseComparison(
          contribution as Contribution[]
        );

        return NextResponse.json({
          userId: targetUserId || 'global',
          purchaseComparison,
          debug: {
            purchaseIdsCount: purchaseIds ? purchaseIds.length : undefined,
            samplePurchaseIds: purchaseIds ? purchaseIds.slice(0, 20) : undefined,
            contributionsReturned: contribution.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { message: 'Invalid analysis type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in cost analysis:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
