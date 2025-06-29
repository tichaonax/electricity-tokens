import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type {
  MonthlyData,
  UserBreakdown,
  PurchaseWhereInput,
} from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Build date filter
    const dateFilter =
      startDate && endDate
        ? {
            purchaseDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {};

    switch (reportType) {
      case 'summary':
        return await getSummaryReport(dateFilter);

      case 'user-breakdown':
        return await getUserBreakdownReport(
          dateFilter,
          userId,
          session.user.id,
          session.user.role
        );

      case 'monthly-trends':
        return await getMonthlyTrendsReport(session.user.id, session.user.role);

      case 'efficiency':
        return await getEfficiencyReport(
          dateFilter,
          session.user.id,
          session.user.role
        );

      default:
        return NextResponse.json(
          {
            message:
              'Invalid report type. Available types: summary, user-breakdown, monthly-trends, efficiency',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSummaryReport(dateFilter: PurchaseWhereInput) {
  const purchases = await prisma.tokenPurchase.findMany({
    where: dateFilter,
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

  const totalPurchases = purchases.length;
  const totalTokens = purchases.reduce((sum, p) => sum + p.totalTokens, 0);
  const totalPayment = purchases.reduce((sum, p) => sum + p.totalPayment, 0);
  const emergencyPurchases = purchases.filter((p) => p.isEmergency).length;

  const totalContributions = purchases.reduce(
    (sum, p) =>
      sum + p.contributions.reduce((cSum, c) => cSum + c.contributionAmount, 0),
    0
  );

  const totalTokensConsumed = purchases.reduce(
    (sum, p) =>
      sum + p.contributions.reduce((cSum, c) => cSum + c.tokensConsumed, 0),
    0
  );

  const averageCostPerToken = totalTokens > 0 ? totalPayment / totalTokens : 0;
  const tokensRemaining = totalTokens - totalTokensConsumed;
  const utilizationRate =
    totalTokens > 0 ? (totalTokensConsumed / totalTokens) * 100 : 0;

  return NextResponse.json({
    summary: {
      totalPurchases,
      totalTokens,
      totalPayment,
      emergencyPurchases,
      totalContributions,
      totalTokensConsumed,
      tokensRemaining,
      averageCostPerToken: parseFloat(averageCostPerToken.toFixed(4)),
      utilizationRate: parseFloat(utilizationRate.toFixed(2)),
    },
  });
}

async function getUserBreakdownReport(
  dateFilter: PurchaseWhereInput,
  targetUserId: string | null,
  currentUserId: string,
  userRole: string
) {
  // Build user filter based on permissions and request
  let userFilter: { userId?: string } = {};

  if (userRole !== 'ADMIN') {
    // Non-admin users can only see their own data
    userFilter = { userId: currentUserId };
  } else if (targetUserId) {
    // Admin requesting specific user
    userFilter = { userId: targetUserId };
  }

  const contributions = await prisma.userContribution.findMany({
    where: {
      ...userFilter,
      purchase: dateFilter,
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

  // Group by user
  const userBreakdown = contributions.reduce(
    (acc: UserBreakdown, contribution) => {
      const userId = contribution.user.id;

      if (!acc[userId]) {
        acc[userId] = {
          user: contribution.user,
          totalContributions: 0,
          totalTokensConsumed: 0,
          totalTrueCost: 0,
          contributionCount: 0,
          averageEfficiency: 0,
        };
      }

      const trueCost =
        (contribution.tokensConsumed / contribution.purchase.totalTokens) *
        contribution.purchase.totalPayment;
      const efficiency =
        contribution.contributionAmount > 0
          ? (trueCost / contribution.contributionAmount) * 100
          : 0;

      acc[userId].totalContributions += contribution.contributionAmount;
      acc[userId].totalTokensConsumed += contribution.tokensConsumed;
      acc[userId].totalTrueCost += trueCost;
      acc[userId].contributionCount += 1;
      acc[userId].averageEfficiency =
        (acc[userId].averageEfficiency * (acc[userId].contributionCount - 1) +
          efficiency) /
        acc[userId].contributionCount;

      return acc;
    },
    {}
  );

  const result = Object.values(userBreakdown).map((user) => ({
    ...user,
    totalTrueCost: parseFloat(user.totalTrueCost.toFixed(2)),
    averageEfficiency: parseFloat(user.averageEfficiency.toFixed(2)),
    overpayment: parseFloat(
      (user.totalContributions - user.totalTrueCost).toFixed(2)
    ),
  }));

  return NextResponse.json({ userBreakdown: result });
}

async function getMonthlyTrendsReport(currentUserId: string, userRole: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const purchases = await prisma.tokenPurchase.findMany({
    where: {
      purchaseDate: {
        gte: sixMonthsAgo,
      },
    },
    include: {
      contributions:
        userRole === 'ADMIN'
          ? true
          : {
              where: { userId: currentUserId },
            },
    },
    orderBy: { purchaseDate: 'asc' },
  });

  // Group by month
  const monthlyData = purchases.reduce((acc: MonthlyData, purchase) => {
    const monthKey = purchase.purchaseDate.toISOString().slice(0, 7); // YYYY-MM format

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalTokens: 0,
        totalPayment: 0,
        totalContributions: 0,
        totalTokensConsumed: 0,
        emergencyPurchases: 0,
        purchaseCount: 0,
      };
    }

    acc[monthKey].totalTokens += purchase.totalTokens;
    acc[monthKey].totalPayment += purchase.totalPayment;
    acc[monthKey].purchaseCount += 1;

    if (purchase.isEmergency) {
      acc[monthKey].emergencyPurchases += 1;
    }

    purchase.contributions.forEach(
      (contribution: {
        contributionAmount: number;
        tokensConsumed: number;
      }) => {
        acc[monthKey].totalContributions += contribution.contributionAmount;
        acc[monthKey].totalTokensConsumed += contribution.tokensConsumed;
      }
    );

    return acc;
  }, {});

  const trends = Object.values(monthlyData).map((month) => ({
    ...month,
    averageCostPerToken:
      month.totalTokens > 0
        ? parseFloat((month.totalPayment / month.totalTokens).toFixed(4))
        : 0,
    utilizationRate:
      month.totalTokens > 0
        ? parseFloat(
            ((month.totalTokensConsumed / month.totalTokens) * 100).toFixed(2)
          )
        : 0,
  }));

  return NextResponse.json({ monthlyTrends: trends });
}

async function getEfficiencyReport(
  dateFilter: PurchaseWhereInput,
  currentUserId: string,
  userRole: string
) {
  const userFilter = userRole === 'ADMIN' ? {} : { userId: currentUserId };

  const contributions = await prisma.userContribution.findMany({
    where: {
      ...userFilter,
      purchase: dateFilter,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      purchase: {
        select: {
          totalTokens: true,
          totalPayment: true,
          isEmergency: true,
        },
      },
    },
  });

  const efficiencyData = contributions.map((contribution) => {
    const trueCost =
      (contribution.tokensConsumed / contribution.purchase.totalTokens) *
      contribution.purchase.totalPayment;
    const efficiency =
      contribution.contributionAmount > 0
        ? (trueCost / contribution.contributionAmount) * 100
        : 0;
    const overpaymentAmount = contribution.contributionAmount - trueCost;
    const overpaymentPercentage =
      trueCost > 0 ? (overpaymentAmount / trueCost) * 100 : 0;

    return {
      contributionId: contribution.id,
      user: contribution.user,
      tokensConsumed: contribution.tokensConsumed,
      contributionAmount: contribution.contributionAmount,
      trueCost: parseFloat(trueCost.toFixed(2)),
      efficiency: parseFloat(efficiency.toFixed(2)),
      overpaymentAmount: parseFloat(overpaymentAmount.toFixed(2)),
      overpaymentPercentage: parseFloat(overpaymentPercentage.toFixed(2)),
      isEmergencyPurchase: contribution.purchase.isEmergency,
    };
  });

  // Calculate summary statistics
  const totalContributions = efficiencyData.reduce(
    (sum, item) => sum + item.contributionAmount,
    0
  );
  const totalTrueCost = efficiencyData.reduce(
    (sum, item) => sum + item.trueCost,
    0
  );
  const totalOverpayment = totalContributions - totalTrueCost;
  const averageEfficiency =
    efficiencyData.length > 0
      ? efficiencyData.reduce((sum, item) => sum + item.efficiency, 0) /
        efficiencyData.length
      : 0;

  return NextResponse.json({
    efficiencyAnalysis: {
      contributions: efficiencyData,
      summary: {
        totalContributions: parseFloat(totalContributions.toFixed(2)),
        totalTrueCost: parseFloat(totalTrueCost.toFixed(2)),
        totalOverpayment: parseFloat(totalOverpayment.toFixed(2)),
        averageEfficiency: parseFloat(averageEfficiency.toFixed(2)),
        overallEfficiencyRate:
          totalTrueCost > 0
            ? parseFloat(
                ((totalTrueCost / totalContributions) * 100).toFixed(2)
              )
            : 0,
      },
    },
  });
}
