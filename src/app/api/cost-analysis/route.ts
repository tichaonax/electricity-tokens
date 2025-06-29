import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calculatePeriodCostAnalysis,
  calculateUserTrueCost,
  generateCostRecommendations,
  calculateOptimalContribution,
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
  userId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  analysisType: z
    .enum(['user', 'period', 'recommendations', 'optimal'])
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
        analysisType: 'user' | 'period' | 'recommendations' | 'optimal';
      };
    };

    const { userId, startDate, endDate, analysisType } = query;

    // Determine target user ID
    const targetUserId = userId || permissionCheck.user!.id;

    // Check if user can access the requested data
    if (
      targetUserId !== permissionCheck.user!.id &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Access denied: insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Fetch data based on analysis type
    switch (analysisType) {
      case 'user': {
        // Get user's contributions with purchase data
        const contributions = await prisma.userContribution.findMany({
          where: {
            userId: targetUserId,
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
          orderBy: { createdAt: 'desc' },
        });

        const costBreakdown = calculateUserTrueCost(
          contributions as Contribution[]
        );

        return NextResponse.json({
          userId: targetUserId,
          costBreakdown,
          contributions: contributions.length,
          period: { start, end },
        });
      }

      case 'period': {
        // Get all purchases and contributions for the period
        const purchases = await prisma.tokenPurchase.findMany({
          where: {
            ...(start && { purchaseDate: { gte: start } }),
            ...(end && { purchaseDate: { lte: end } }),
          },
          include: {
            contributions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const contributions = await prisma.userContribution.findMany({
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
          contributions as Contribution[],
          start,
          end
        );

        return NextResponse.json(periodAnalysis);
      }

      case 'recommendations': {
        // Get user's data and generate recommendations
        const contributions = await prisma.userContribution.findMany({
          where: {
            userId: targetUserId,
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
            contributions: {
              some: {
                userId: targetUserId,
              },
            },
          },
          include: {
            contributions: {
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
          contributions as Contribution[]
        );

        const userSummary = {
          userId: targetUserId,
          userName: contributions[0]?.user?.name,
          contributions: contributions as Contribution[],
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
        // Calculate optimal contributions for recent purchases
        const recentPurchases = await prisma.tokenPurchase.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          include: {
            contributions: {
              where: {
                userId: targetUserId,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const optimalContributions = recentPurchases
          .map((purchase) => {
            const userContribution = purchase.contributions[0];
            if (!userContribution) return null;

            const optimal = calculateOptimalContribution(
              userContribution.tokensConsumed,
              purchase as Purchase
            );

            return {
              purchaseId: purchase.id,
              purchaseDate: purchase.purchaseDate,
              isEmergency: purchase.isEmergency,
              actualContribution: userContribution.contributionAmount,
              tokensConsumed: userContribution.tokensConsumed,
              ...optimal,
              difference:
                userContribution.contributionAmount -
                optimal.totalOptimalContribution,
            };
          })
          .filter(Boolean);

        return NextResponse.json({
          userId: targetUserId,
          optimalContributions,
          summary: {
            totalPurchases: optimalContributions.length,
            averageDifference:
              optimalContributions.reduce(
                (sum, oc) => sum + (oc?.difference || 0),
                0
              ) / optimalContributions.length,
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
