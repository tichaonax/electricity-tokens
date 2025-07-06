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

const usageReportQuerySchema = z.object({
  type: z.enum(['monthly-trends', 'cost-analysis', 'user-comparison', 'emergency-impact']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('Usage reports API called');
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters manually
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'monthly-trends' | 'cost-analysis' | 'user-comparison' | 'emergency-impact';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const userId = searchParams.get('userId') || undefined;

    if (!type || !['monthly-trends', 'cost-analysis', 'user-comparison', 'emergency-impact'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid or missing report type' },
        { status: 400 }
      );
    }
    console.log('Usage report params:', { type, startDate, endDate, userId });

    let data;
    
    switch (type) {
      case 'monthly-trends':
        data = await getMonthlyUsageTrends(startDate, endDate);
        break;
      case 'cost-analysis':
        data = await getCostAnalysisOverTime(startDate, endDate);
        break;
      case 'user-comparison':
        data = await getUserComparison(startDate, endDate, userId);
        break;
      case 'emergency-impact':
        data = await getEmergencyPurchaseImpact(startDate, endDate);
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
    console.error('Error generating usage report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getMonthlyUsageTrends(startDate?: string, endDate?: string) {
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
            select: { name: true, email: true }
          }
        }
      }
    },
    orderBy: { purchaseDate: 'asc' }
  });

  // Group data by month
  const monthlyData = purchases.reduce((acc, purchase) => {
    const monthKey = purchase.purchaseDate.toISOString().substring(0, 7); // YYYY-MM format
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalTokensPurchased: 0,
        totalTokensConsumed: 0,
        totalPayment: 0,
        contributionCount: 0,
        emergencyPurchases: 0,
        regularPurchases: 0,
      };
    }

    acc[monthKey].totalTokensPurchased += purchase.totalTokens;
    acc[monthKey].totalPayment += purchase.totalPayment;
    acc[monthKey].totalTokensConsumed += purchase.contribution ? purchase.contribution.tokensConsumed : 0;
    acc[monthKey].contributionCount += purchase.contribution ? 1 : 0;
    
    if (purchase.isEmergency) {
      acc[monthKey].emergencyPurchases += 1;
    } else {
      acc[monthKey].regularPurchases += 1;
    }

    return acc;
  }, {} as Record<string, any>);

  // Convert to array and add calculated fields
  const trends = Object.values(monthlyData).map((month: any) => ({
    ...month,
    utilizationRate: month.totalTokensPurchased > 0 
      ? (month.totalTokensConsumed / month.totalTokensPurchased * 100).toFixed(2)
      : '0.00',
    averageCostPerToken: month.totalTokensPurchased > 0 
      ? (month.totalPayment / month.totalTokensPurchased).toFixed(4)
      : '0.0000',
    emergencyRate: (month.emergencyPurchases + month.regularPurchases) > 0
      ? (month.emergencyPurchases / (month.emergencyPurchases + month.regularPurchases) * 100).toFixed(2)
      : '0.00',
  }));

  return trends;
}

async function getCostAnalysisOverTime(startDate?: string, endDate?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause = Object.keys(dateFilter).length > 0
    ? { purchaseDate: dateFilter }
    : {};

  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    orderBy: { purchaseDate: 'asc' }
  });

  const costAnalysis = purchases.map(purchase => ({
    date: purchase.purchaseDate.toISOString().split('T')[0],
    month: purchase.purchaseDate.toISOString().substring(0, 7),
    totalTokens: purchase.totalTokens,
    totalPayment: purchase.totalPayment,
    costPerToken: purchase.totalPayment / purchase.totalTokens,
    isEmergency: purchase.isEmergency,
    emergencyPremium: purchase.isEmergency 
      ? ((purchase.totalPayment / purchase.totalTokens) - 0.25) // Assuming 0.25 is base rate
      : 0,
  }));

  // Calculate running averages
  let runningTotal = 0;
  let runningTokens = 0;
  
  const analysisWithRunningAvg = costAnalysis.map((item, index) => {
    runningTotal += item.totalPayment;
    runningTokens += item.totalTokens;
    
    return {
      ...item,
      runningAverageCost: runningTokens > 0 ? runningTotal / runningTokens : 0,
      purchaseNumber: index + 1,
    };
  });

  return analysisWithRunningAvg;
}

async function getUserComparison(startDate?: string, endDate?: string, targetUserId?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause: Record<string, unknown> = {};
  if (Object.keys(dateFilter).length > 0) {
    whereClause.purchase = { purchaseDate: dateFilter };
  }

  const contributions = await prisma.userContribution.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      purchase: {
        select: {
          purchaseDate: true,
          totalTokens: true,
          totalPayment: true,
          isEmergency: true
        }
      }
    }
  });

  // Group by user
  const userStats = contributions.reduce((acc, contribution) => {
    const userId = contribution.userId;
    
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: contribution.user.name,
        userEmail: contribution.user.email,
        totalContributions: 0,
        totalTokensConsumed: 0,
        totalTrueCost: 0,
        contributionCount: 0,
        emergencyContributions: 0,
        averageMeterReading: 0,
        meterReadings: [],
      };
    }

    const costPerToken = contribution.purchase.totalPayment / contribution.purchase.totalTokens;
    const trueCost = contribution.tokensConsumed * costPerToken;

    acc[userId].totalContributions += contribution.contributionAmount;
    acc[userId].totalTokensConsumed += contribution.tokensConsumed;
    acc[userId].totalTrueCost += trueCost;
    acc[userId].contributionCount += 1;
    acc[userId].meterReadings.push(contribution.meterReading);
    
    if (contribution.purchase.isEmergency) {
      acc[userId].emergencyContributions += 1;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate derived metrics and group stats
  const userComparison = Object.values(userStats).map((user: any) => {
    user.averageMeterReading = user.meterReadings.reduce((sum: number, reading: number) => sum + reading, 0) / user.meterReadings.length;
    user.efficiency = user.totalContributions > 0 ? (user.totalTrueCost / user.totalContributions * 100) : 0;
    user.overpayment = user.totalContributions - user.totalTrueCost;
    user.emergencyRate = user.contributionCount > 0 ? (user.emergencyContributions / user.contributionCount * 100) : 0;
    user.avgContributionAmount = user.contributionCount > 0 ? user.totalContributions / user.contributionCount : 0;
    user.avgTokensPerContribution = user.contributionCount > 0 ? user.totalTokensConsumed / user.contributionCount : 0;
    
    delete user.meterReadings; // Remove raw meter readings from output
    return user;
  });

  // Calculate group averages for comparison
  const totalUsers = userComparison.length;
  const groupStats = {
    averageContributions: userComparison.reduce((sum, user) => sum + user.totalContributions, 0) / totalUsers,
    averageTokensConsumed: userComparison.reduce((sum, user) => sum + user.totalTokensConsumed, 0) / totalUsers,
    averageEfficiency: userComparison.reduce((sum, user) => sum + user.efficiency, 0) / totalUsers,
    averageEmergencyRate: userComparison.reduce((sum, user) => sum + user.emergencyRate, 0) / totalUsers,
  };

  return {
    users: userComparison,
    groupStats,
    totalUsers,
  };
}

async function getEmergencyPurchaseImpact(startDate?: string, endDate?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause = Object.keys(dateFilter).length > 0
    ? { purchaseDate: dateFilter }
    : {};

  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    include: {
      contribution: true
    },
    orderBy: { purchaseDate: 'asc' }
  });

  const regularPurchases = purchases.filter(p => !p.isEmergency);
  const emergencyPurchases = purchases.filter(p => p.isEmergency);

  // Calculate base rates from regular purchases
  const regularTotalPayment = regularPurchases.reduce((sum, p) => sum + p.totalPayment, 0);
  const regularTotalTokens = regularPurchases.reduce((sum, p) => sum + p.totalTokens, 0);
  const baseRate = regularTotalTokens > 0 ? regularTotalPayment / regularTotalTokens : 0;

  // Calculate emergency impact
  const emergencyAnalysis = emergencyPurchases.map(purchase => {
    const emergencyRate = purchase.totalPayment / purchase.totalTokens;
    const premium = emergencyRate - baseRate;
    const premiumCost = premium * purchase.totalTokens;
    const premiumPercentage = baseRate > 0 ? (premium / baseRate * 100) : 0;

    return {
      date: purchase.purchaseDate.toISOString().split('T')[0],
      totalTokens: purchase.totalTokens,
      totalPayment: purchase.totalPayment,
      emergencyRate,
      baseRate,
      premium,
      premiumCost,
      premiumPercentage,
      utilizationRate: purchase.contribution 
        ? (purchase.contribution.tokensConsumed / purchase.totalTokens * 100)
        : 0,
    };
  });

  // Calculate totals
  const totalEmergencyPremium = emergencyAnalysis.reduce((sum, item) => sum + item.premiumCost, 0);
  const totalEmergencyTokens = emergencyAnalysis.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalRegularTokens = regularPurchases.reduce((sum, p) => sum + p.totalTokens, 0);
  const totalTokens = totalEmergencyTokens + totalRegularTokens;

  const impactSummary = {
    totalPurchases: purchases.length,
    regularPurchases: regularPurchases.length,
    emergencyPurchases: emergencyPurchases.length,
    emergencyRate: purchases.length > 0 ? (emergencyPurchases.length / purchases.length * 100) : 0,
    baseRate,
    averageEmergencyRate: emergencyPurchases.length > 0 
      ? emergencyPurchases.reduce((sum, p) => sum + (p.totalPayment / p.totalTokens), 0) / emergencyPurchases.length
      : 0,
    totalEmergencyPremium,
    emergencyTokenPercentage: totalTokens > 0 ? (totalEmergencyTokens / totalTokens * 100) : 0,
  };

  return {
    impactSummary,
    emergencyAnalysis,
    comparison: {
      regularPurchases: regularPurchases.length,
      emergencyPurchases: emergencyPurchases.length,
      totalPremiumPaid: totalEmergencyPremium,
    }
  };
}