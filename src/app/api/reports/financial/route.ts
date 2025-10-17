import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';

// Helper function to round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;
// Helper function to round to 4 decimal places (for rates)
const round4 = (num: number): number => Math.round(num * 10000) / 10000;

const financialReportQuerySchema = z.object({
  type: z.enum(['monthly-costs', 'payment-tracking', 'payment-balance', 'annual-overview']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('Financial reports API called');
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

    // Check canViewFinancialReports permission for global data access
    const userPermissions = permissionCheck.user!.permissions as Record<string, unknown> | null;
    const canViewFinancialReports = 
      permissionCheck.user!.role === 'ADMIN' || 
      userPermissions?.canViewFinancialReports === true;

    if (!canViewFinancialReports) {
      return NextResponse.json(
        { message: 'Insufficient permissions to view financial reports' },
        { status: 403 }
      );
    }

    // Validate query parameters
    const validation = await validateRequest(request, {
      query: financialReportQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query: {
        type: 'monthly-costs' | 'payment-tracking' | 'payment-balance' | 'annual-overview';
        startDate?: string;
        endDate?: string;
        userId?: string;
      };
    };

    const { type, startDate, endDate, userId } = query;
    console.log('Financial report params:', { type, startDate, endDate, userId });

    let data;
    
    switch (type) {
      case 'monthly-costs':
        data = await getMonthlyCostSummaries(startDate, endDate);
        break;
      case 'payment-tracking':
        data = await getPaymentContributionTracking(startDate, endDate, userId);
        break;
      case 'payment-balance':
        data = await getPaymentBalanceCalculations(startDate, endDate, userId);
        break;
      case 'annual-overview':
        data = await getAnnualFinancialOverview(startDate, endDate);
        break;
      default:
        return NextResponse.json(
          { message: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type,
      data,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating financial report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getMonthlyCostSummaries(startDate?: string, endDate?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause = Object.keys(dateFilter).length > 0
    ? { purchaseDate: dateFilter }
    : {};

  // Get purchases with contributions grouped by month
  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    include: {
      contribution: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: { purchaseDate: 'asc' }
  });

  // Group data by month and calculate financial summaries
  const monthlyData = purchases.reduce((acc, purchase) => {
    const monthKey = purchase.purchaseDate.toISOString().substring(0, 7); // YYYY-MM format
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalSpent: 0,
        totalTokensPurchased: 0,
        totalTokensConsumed: 0,
        totalContributions: 0,
        averageCostPerToken: 0,
        emergencySpent: 0,
        regularSpent: 0,
        purchaseCount: 0,
        contributorCount: new Set(),
        overpayment: 0,
        utilizationRate: 0,
      };
    }

    const monthData = acc[monthKey];
    const costPerToken = purchase.totalPayment / purchase.totalTokens;
    const tokensConsumed = purchase.contribution ? purchase.contribution.tokensConsumed : 0;
    const totalContributions = purchase.contribution ? purchase.contribution.contributionAmount : 0;
    const trueCost = tokensConsumed * costPerToken;

    monthData.totalSpent += purchase.totalPayment;
    monthData.totalTokensPurchased += purchase.totalTokens;
    monthData.totalTokensConsumed += tokensConsumed;
    monthData.totalContributions += totalContributions;
    monthData.overpayment += (totalContributions - trueCost);
    monthData.purchaseCount += 1;

    if (purchase.isEmergency) {
      monthData.emergencySpent += purchase.totalPayment;
    } else {
      monthData.regularSpent += purchase.totalPayment;
    }

    // Track unique contributors
    if (purchase.contribution) {
      monthData.contributorCount.add(purchase.contribution.userId);
    }

    return acc;
  }, {} as Record<string, any>);

  // Convert to array and add calculated fields
  const summaries = Object.values(monthlyData).map((month: any) => {
    const utilizationRate = month.totalTokensPurchased > 0 
      ? (month.totalTokensConsumed / month.totalTokensPurchased * 100)
      : 0;
    
    const averageCostPerToken = month.totalTokensPurchased > 0 
      ? month.totalSpent / month.totalTokensPurchased
      : 0;

    const emergencyPercentage = month.totalSpent > 0
      ? (month.emergencySpent / month.totalSpent * 100)
      : 0;

    return {
      ...month,
      contributorCount: month.contributorCount.size,
      utilizationRate: round2(utilizationRate),
      averageCostPerToken: round4(averageCostPerToken),
      emergencyPercentage: round2(emergencyPercentage),
      overpayment: round2(month.overpayment),
      efficiency: month.totalContributions > 0
        ? round2((month.totalSpent / month.totalContributions * 100))
        : 0,
    };
  });

  return summaries;
}

async function getPaymentContributionTracking(startDate?: string, endDate?: string, targetUserId?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause: Record<string, unknown> = {};
  if (Object.keys(dateFilter).length > 0) {
    whereClause.purchase = { purchaseDate: dateFilter };
  }
  if (targetUserId) {
    whereClause.userId = targetUserId;
  }

  const contributions = await prisma.userContribution.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      purchase: {
        select: {
          id: true,
          purchaseDate: true,
          totalTokens: true,
          totalPayment: true,
          isEmergency: true
        }
      }
    },
    orderBy: { purchase: { purchaseDate: 'desc' } }
  });

  // Group by user and calculate payment tracking
  const userTracking = contributions.reduce((acc, contribution) => {
    const userId = contribution.userId;
    
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: contribution.user.name,
        userEmail: contribution.user.email,
        totalContributions: 0,
        totalTokensConsumed: 0,
        contributionCount: 0,
        averageContribution: 0,
        firstContribution: contribution.purchase.purchaseDate,
        lastContribution: contribution.purchase.purchaseDate,
        emergencyContributions: 0,
        regularContributions: 0,
        monthlyBreakdown: {} as Record<string, any>,
      };
    }

    const userdata = acc[userId];
    const month = contribution.purchase.purchaseDate.toISOString().substring(0, 7);
    
    // Update totals
    userdata.totalContributions += contribution.contributionAmount;
    userdata.totalTokensConsumed += contribution.tokensConsumed;
    userdata.contributionCount += 1;
    
    // Update date range
    if (contribution.purchase.purchaseDate < userdata.firstContribution) {
      userdata.firstContribution = contribution.purchase.purchaseDate;
    }
    if (contribution.purchase.purchaseDate > userdata.lastContribution) {
      userdata.lastContribution = contribution.purchase.purchaseDate;
    }

    // Track emergency vs regular
    if (contribution.purchase.isEmergency) {
      userdata.emergencyContributions += contribution.contributionAmount;
    } else {
      userdata.regularContributions += contribution.contributionAmount;
    }

    // Monthly breakdown
    if (!userdata.monthlyBreakdown[month]) {
      userdata.monthlyBreakdown[month] = {
        month,
        contributions: 0,
        tokensConsumed: 0,
        count: 0,
        emergencyAmount: 0,
        regularAmount: 0,
      };
    }

    const monthData = userdata.monthlyBreakdown[month];
    monthData.contributions += contribution.contributionAmount;
    monthData.tokensConsumed += contribution.tokensConsumed;
    monthData.count += 1;

    if (contribution.purchase.isEmergency) {
      monthData.emergencyAmount += contribution.contributionAmount;
    } else {
      monthData.regularAmount += contribution.contributionAmount;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate derived metrics
  const trackingData = Object.values(userTracking).map((user: any) => {
    user.averageContribution = user.contributionCount > 0 
      ? user.totalContributions / user.contributionCount 
      : 0;
    
    user.emergencyPercentage = user.totalContributions > 0
      ? (user.emergencyContributions / user.totalContributions * 100)
      : 0;

    user.monthlyBreakdown = Object.values(user.monthlyBreakdown);
    
    return {
      ...user,
      averageContribution: round2(user.averageContribution),
      emergencyPercentage: round2(user.emergencyPercentage),
      totalContributions: round2(user.totalContributions),
      emergencyContributions: round2(user.emergencyContributions),
      regularContributions: round2(user.regularContributions),
    };
  });

  return trackingData;
}

async function getPaymentBalanceCalculations(startDate?: string, endDate?: string, targetUserId?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause: Record<string, unknown> = {};
  if (Object.keys(dateFilter).length > 0) {
    whereClause.purchase = { purchaseDate: dateFilter };
  }
  if (targetUserId) {
    whereClause.userId = targetUserId;
  }

  const contributions = await prisma.userContribution.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      purchase: {
        select: {
          id: true,
          purchaseDate: true,
          totalTokens: true,
          totalPayment: true,
          isEmergency: true
        }
      }
    }
  });

  // Calculate payment balances per user
  const balanceData = contributions.reduce((acc, contribution) => {
    const userId = contribution.userId;
    
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: contribution.user.name,
        userEmail: contribution.user.email,
        totalContributed: 0,
        totalTrueCost: 0,
        overpayment: 0,
        underpayment: 0,
        netBalance: 0,
        contributionDetails: [],
      };
    }

    const userdata = acc[userId];
    const costPerToken = contribution.purchase.totalPayment / contribution.purchase.totalTokens;
    const trueCost = contribution.tokensConsumed * costPerToken;
    const balance = contribution.contributionAmount - trueCost;

    userdata.totalContributed += contribution.contributionAmount;
    userdata.totalTrueCost += trueCost;
    
    if (balance > 0) {
      userdata.overpayment += balance;
    } else {
      userdata.underpayment += Math.abs(balance);
    }

    userdata.contributionDetails.push({
      purchaseId: contribution.purchase.id,
      purchaseDate: contribution.purchase.purchaseDate,
      contributionAmount: contribution.contributionAmount,
      tokensConsumed: contribution.tokensConsumed,
      costPerToken: round4(costPerToken),
      trueCost: round2(trueCost),
      balance: round2(balance),
      isEmergency: contribution.purchase.isEmergency,
    });

    return acc;
  }, {} as Record<string, any>);

  // Calculate final balances
  const balances = Object.values(balanceData).map((user: any) => {
    user.netBalance = user.totalContributed - user.totalTrueCost;
    user.balanceStatus = user.netBalance > 5 ? 'overpaid' : 
                        user.netBalance < -5 ? 'underpaid' : 'balanced';
    
    return {
      ...user,
      totalContributed: round2(user.totalContributed),
      totalTrueCost: round2(user.totalTrueCost),
      overpayment: round2(user.overpayment),
      underpayment: round2(user.underpayment),
      netBalance: round2(user.netBalance),
    };
  });

  return balances;
}

async function getAnnualFinancialOverview(startDate?: string, endDate?: string) {
  // Default to current year if no dates provided
  const now = new Date();
  const defaultStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
  const defaultEndDate = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31);

  const purchases = await prisma.tokenPurchase.findMany({
    where: {
      purchaseDate: {
        gte: defaultStartDate,
        lte: defaultEndDate
      }
    },
    include: {
      contribution: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: { purchaseDate: 'asc' }
  });

  // Calculate annual totals
  const yearlyTotals = {
    totalSpent: 0,
    totalTokensPurchased: 0,
    totalTokensConsumed: 0,
    totalContributions: 0,
    emergencySpent: 0,
    regularSpent: 0,
    purchaseCount: 0,
    emergencyPurchases: 0,
    regularPurchases: 0,
    uniqueContributors: new Set(),
    monthlyData: {} as Record<string, any>,
  };

  purchases.forEach(purchase => {
    const month = purchase.purchaseDate.toISOString().substring(0, 7);
    const tokensConsumed = purchase.contribution ? purchase.contribution.tokensConsumed : 0;
    const totalContributions = purchase.contribution ? purchase.contribution.contributionAmount : 0;

    // Annual totals
    yearlyTotals.totalSpent += purchase.totalPayment;
    yearlyTotals.totalTokensPurchased += purchase.totalTokens;
    yearlyTotals.totalTokensConsumed += tokensConsumed;
    yearlyTotals.totalContributions += totalContributions;
    yearlyTotals.purchaseCount += 1;

    if (purchase.isEmergency) {
      yearlyTotals.emergencySpent += purchase.totalPayment;
      yearlyTotals.emergencyPurchases += 1;
    } else {
      yearlyTotals.regularSpent += purchase.totalPayment;
      yearlyTotals.regularPurchases += 1;
    }

    // Track contributors
    if (purchase.contribution) {
      yearlyTotals.uniqueContributors.add(purchase.contribution.userId);
    }

    // Monthly breakdown
    if (!yearlyTotals.monthlyData[month]) {
      yearlyTotals.monthlyData[month] = {
        month,
        spent: 0,
        tokens: 0,
        contributions: 0,
        purchases: 0,
      };
    }

    yearlyTotals.monthlyData[month].spent += purchase.totalPayment;
    yearlyTotals.monthlyData[month].tokens += purchase.totalTokens;
    yearlyTotals.monthlyData[month].contributions += totalContributions;
    yearlyTotals.monthlyData[month].purchases += 1;
  });

  // Calculate derived metrics
  const overview = {
    year: defaultStartDate.getFullYear(),
    period: {
      startDate: defaultStartDate.toISOString().split('T')[0],
      endDate: defaultEndDate.toISOString().split('T')[0],
    },
    summary: {
      totalSpent: round2(yearlyTotals.totalSpent),
      totalTokensPurchased: yearlyTotals.totalTokensPurchased,
      totalTokensConsumed: yearlyTotals.totalTokensConsumed,
      totalContributions: round2(yearlyTotals.totalContributions),
      averageCostPerToken: yearlyTotals.totalTokensPurchased > 0
        ? round4(yearlyTotals.totalSpent / yearlyTotals.totalTokensPurchased)
        : 0,
      utilizationRate: yearlyTotals.totalTokensPurchased > 0
        ? round2((yearlyTotals.totalTokensConsumed / yearlyTotals.totalTokensPurchased * 100))
        : 0,
      overpayment: round2(yearlyTotals.totalContributions - yearlyTotals.totalSpent),
      contributorCount: yearlyTotals.uniqueContributors.size,
    },
    emergencyAnalysis: {
      emergencySpent: round2(yearlyTotals.emergencySpent),
      regularSpent: round2(yearlyTotals.regularSpent),
      emergencyPercentage: yearlyTotals.totalSpent > 0
        ? round2((yearlyTotals.emergencySpent / yearlyTotals.totalSpent * 100))
        : 0,
      emergencyPurchases: yearlyTotals.emergencyPurchases,
      regularPurchases: yearlyTotals.regularPurchases,
      emergencyPremium: round2(yearlyTotals.emergencySpent - (yearlyTotals.emergencyPurchases * 0.25 * (yearlyTotals.totalTokensPurchased / yearlyTotals.purchaseCount))),
    },
    monthlyBreakdown: Object.values(yearlyTotals.monthlyData).map((month: any) => ({
      ...month,
      spent: round2(month.spent),
      contributions: round2(month.contributions),
    })),
  };

  return overview;
}