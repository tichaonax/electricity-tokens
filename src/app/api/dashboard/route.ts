import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateUserTrueCost,
  calculateProportionalCost,
  type Contribution,
} from '@/lib/cost-calculations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';

const dashboardQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  monthsBack: z
    .string()
    .regex(/^\d+$/, 'Must be a positive integer')
    .transform(Number)
    .refine((n) => n >= 1 && n <= 12, 'Must be between 1 and 12')
    .optional()
    .default('6'),
});

interface MonthlyData {
  month: string;
  year: number;
  totalTokensUsed: number;
  totalAmountPaid: number;
  totalTrueCost: number;
  efficiency: number;
  contributionCount: number;
  averageCostPerKwh: number;
  emergencyTokens: number;
}

interface MeterReadingData {
  date: string;
  reading: number;
  tokensConsumed: number;
  purchaseType: 'regular' | 'emergency';
  costPerKwh: number;
}

interface DashboardResponse {
  personalSummary: {
    totalTokensUsed: number;
    totalAmountPaid: number;
    totalTrueCost: number;
    averageCostPerKwh: number;
    efficiency: number;
    overpayment: number;
    emergencyPremium: number;
    contributionCount: number;
    lastContributionDate: string | null;
  };
  currentMonth: {
    tokensUsed: number;
    amountPaid: number;
    efficiency: number;
    progressVsAverage: number;
    daysIntoMonth: number;
    contributionCount: number;
    emergencyRate: number;
  };
  monthlyTrends: MonthlyData[];
  meterReadingHistory: MeterReadingData[];
  costBreakdown: {
    regularCosts: number;
    emergencyCosts: number;
    regularTokens: number;
    emergencyTokens: number;
    regularRate: number;
    emergencyRate: number;
  };
}

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
      query: dashboardQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query: {
        userId?: string;
        monthsBack: number;
      };
    };

    const { userId, monthsBack } = query;

    // Determine target user ID
    const targetUserId = userId || permissionCheck.user!.id;

    // Check permissions
    if (
      targetUserId !== permissionCheck.user!.id &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Access denied: insufficient permissions' },
        { status: 403 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const historyStart = new Date(
      now.getFullYear(),
      now.getMonth() - monthsBack,
      1
    );

    // Fetch user contributions with purchase data
    const contributions = await prisma.userContribution.findMany({
      where: {
        userId: targetUserId,
        createdAt: {
          gte: historyStart,
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
      orderBy: { createdAt: 'desc' },
    });

    // Calculate personal summary (all time)
    const allTimeContributions = await prisma.userContribution.findMany({
      where: { userId: targetUserId },
      include: { purchase: true },
    });

    const personalSummary = calculateUserTrueCost(
      allTimeContributions as Contribution[]
    );
    const lastContribution = allTimeContributions[0];

    // Calculate current month metrics
    const currentMonthContributions = contributions.filter(
      (c) => new Date(c.createdAt) >= currentMonthStart
    );

    const currentMonthMetrics = calculateUserTrueCost(
      currentMonthContributions as Contribution[]
    );

    // Calculate average monthly usage for comparison
    const monthlyAverages =
      contributions.length > 0
        ? {
            avgTokens:
              contributions.reduce((sum, c) => sum + c.tokensConsumed, 0) /
              monthsBack,
            avgPayment:
              contributions.reduce((sum, c) => sum + c.contributionAmount, 0) /
              monthsBack,
          }
        : { avgTokens: 0, avgPayment: 0 };

    const progressVsAverage =
      monthlyAverages.avgTokens > 0
        ? (currentMonthMetrics.totalTokensUsed / monthlyAverages.avgTokens) *
          100
        : 0;

    const daysIntoMonth = now.getDate();
    const currentMonthEmergencyContribs = currentMonthContributions.filter(
      (c) => c.purchase?.isEmergency
    );
    const emergencyRate =
      currentMonthContributions.length > 0
        ? (currentMonthEmergencyContribs.length /
            currentMonthContributions.length) *
          100
        : 0;

    // Generate monthly trends
    const monthlyTrends: MonthlyData[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthContribs = contributions.filter((c) => {
        const date = new Date(c.createdAt);
        return date >= monthStart && date <= monthEnd;
      });

      if (monthContribs.length > 0) {
        const monthMetrics = calculateUserTrueCost(
          monthContribs as Contribution[]
        );
        const emergencyTokens = monthContribs
          .filter((c) => c.purchase?.isEmergency)
          .reduce((sum, c) => sum + c.tokensConsumed, 0);

        monthlyTrends.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          year: monthStart.getFullYear(),
          totalTokensUsed: monthMetrics.totalTokensUsed,
          totalAmountPaid: monthMetrics.totalAmountPaid,
          totalTrueCost: monthMetrics.totalTrueCost,
          efficiency: monthMetrics.efficiency,
          contributionCount: monthContribs.length,
          averageCostPerKwh: monthMetrics.averageCostPerKwh,
          emergencyTokens,
        });
      } else {
        monthlyTrends.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          year: monthStart.getFullYear(),
          totalTokensUsed: 0,
          totalAmountPaid: 0,
          totalTrueCost: 0,
          efficiency: 0,
          contributionCount: 0,
          averageCostPerKwh: 0,
          emergencyTokens: 0,
        });
      }
    }

    // Generate meter reading history
    const meterReadingHistory: MeterReadingData[] = contributions
      .slice(0, 20) // Last 20 readings
      .map((c) => ({
        date: c.createdAt.toISOString().split('T')[0],
        reading: c.meterReading,
        tokensConsumed: c.tokensConsumed,
        purchaseType: c.purchase?.isEmergency ? 'emergency' : 'regular',
        costPerKwh: c.purchase
          ? c.purchase.totalPayment / c.purchase.totalTokens
          : 0,
      }));

    // Calculate cost breakdown
    const regularContribs = contributions.filter(
      (c) => !c.purchase?.isEmergency
    );
    const emergencyContributions = contributions.filter(
      (c) => c.purchase?.isEmergency
    );

    const regularCosts = regularContribs.reduce((sum, c) => {
      if (!c.purchase) return sum;
      return (
        sum +
        calculateProportionalCost(
          c.tokensConsumed,
          c.purchase.totalTokens,
          c.purchase.totalPayment
        )
      );
    }, 0);

    const emergencyCosts = emergencyContributions.reduce((sum, c) => {
      if (!c.purchase) return sum;
      return (
        sum +
        calculateProportionalCost(
          c.tokensConsumed,
          c.purchase.totalTokens,
          c.purchase.totalPayment
        )
      );
    }, 0);

    const regularTokens = regularContribs.reduce(
      (sum, c) => sum + c.tokensConsumed,
      0
    );
    const emergencyTokens = emergencyContributions.reduce(
      (sum, c) => sum + c.tokensConsumed,
      0
    );

    const costBreakdown = {
      regularCosts,
      emergencyCosts,
      regularTokens,
      emergencyTokens,
      regularRate: regularTokens > 0 ? regularCosts / regularTokens : 0,
      emergencyRate: emergencyTokens > 0 ? emergencyCosts / emergencyTokens : 0,
    };

    const response: DashboardResponse = {
      personalSummary: {
        ...personalSummary,
        contributionCount: allTimeContributions.length,
        lastContributionDate: lastContribution?.createdAt.toISOString() || null,
      },
      currentMonth: {
        tokensUsed: currentMonthMetrics.totalTokensUsed,
        amountPaid: currentMonthMetrics.totalAmountPaid,
        efficiency: currentMonthMetrics.efficiency,
        progressVsAverage,
        daysIntoMonth,
        contributionCount: currentMonthContributions.length,
        emergencyRate,
      },
      monthlyTrends,
      meterReadingHistory,
      costBreakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
