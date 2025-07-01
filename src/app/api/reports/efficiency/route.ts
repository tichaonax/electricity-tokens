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

const efficiencyReportQuerySchema = z.object({
  type: z.enum(['token-loss', 'purchase-timing', 'usage-prediction']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('Efficiency reports API called');
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
      query: efficiencyReportQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query: {
        type: 'token-loss' | 'purchase-timing' | 'usage-prediction';
        startDate?: string;
        endDate?: string;
        userId?: string;
      };
    };

    const { type, startDate, endDate, userId } = query;
    console.log('Efficiency report params:', { type, startDate, endDate, userId });

    let data;
    
    switch (type) {
      case 'token-loss':
        data = await getTokenLossAnalysis(startDate, endDate);
        break;
      case 'purchase-timing':
        data = await getPurchaseTimingRecommendations(startDate, endDate);
        break;
      case 'usage-prediction':
        data = await getUsagePredictions(startDate, endDate, userId);
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
    console.error('Error generating efficiency report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getTokenLossAnalysis(startDate?: string, endDate?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause = Object.keys(dateFilter).length > 0
    ? { purchaseDate: dateFilter }
    : {};

  // Get all purchases with their details
  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    include: {
      contribution: true
    },
    orderBy: { purchaseDate: 'asc' }
  });

  // Calculate token loss metrics
  const emergencyPurchases = purchases.filter(p => p.isEmergency);
  const regularPurchases = purchases.filter(p => !p.isEmergency);

  const totalTokens = purchases.reduce((sum, p) => sum + p.totalTokens, 0);
  const totalSpent = purchases.reduce((sum, p) => sum + p.totalPayment, 0);
  
  const emergencyTokens = emergencyPurchases.reduce((sum, p) => sum + p.totalTokens, 0);
  const emergencySpent = emergencyPurchases.reduce((sum, p) => sum + p.totalPayment, 0);
  
  const regularTokens = regularPurchases.reduce((sum, p) => sum + p.totalTokens, 0);
  const regularSpent = regularPurchases.reduce((sum, p) => sum + p.totalPayment, 0);

  // Calculate average rates
  const avgRegularRate = regularTokens > 0 ? regularSpent / regularTokens : 0;
  const avgEmergencyRate = emergencyTokens > 0 ? emergencySpent / emergencyTokens : 0;

  // Calculate potential savings if emergency purchases were regular
  const potentialSavings = emergencyTokens * (avgEmergencyRate - avgRegularRate);
  const tokenLossPercentage = totalSpent > 0 ? (potentialSavings / totalSpent) * 100 : 0;

  // Monthly breakdown
  const monthlyData = purchases.reduce((acc, purchase) => {
    const monthKey = purchase.purchaseDate.toISOString().substring(0, 7);
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        regularTokens: 0,
        emergencyTokens: 0,
        regularSpent: 0,
        emergencySpent: 0,
        potentialSavings: 0,
        lossPercentage: 0,
      };
    }

    const monthData = acc[monthKey];
    
    if (purchase.isEmergency) {
      monthData.emergencyTokens += purchase.totalTokens;
      monthData.emergencySpent += purchase.totalPayment;
    } else {
      monthData.regularTokens += purchase.totalTokens;
      monthData.regularSpent += purchase.totalPayment;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate monthly metrics
  const monthlyBreakdown = Object.values(monthlyData).map((month: any) => {
    const monthRegularRate = month.regularTokens > 0 ? month.regularSpent / month.regularTokens : avgRegularRate;
    const monthEmergencyRate = month.emergencyTokens > 0 ? month.emergencySpent / month.emergencyTokens : 0;
    
    month.potentialSavings = month.emergencyTokens * (monthEmergencyRate - monthRegularRate);
    month.lossPercentage = (month.regularSpent + month.emergencySpent) > 0 
      ? (month.potentialSavings / (month.regularSpent + month.emergencySpent)) * 100 
      : 0;

    return {
      ...month,
      regularRate: Number(monthRegularRate.toFixed(4)),
      emergencyRate: Number(monthEmergencyRate.toFixed(4)),
      potentialSavings: Number(month.potentialSavings.toFixed(2)),
      lossPercentage: Number(month.lossPercentage.toFixed(2)),
    };
  });

  return {
    summary: {
      totalTokens,
      totalSpent: Number(totalSpent.toFixed(2)),
      emergencyTokens,
      emergencySpent: Number(emergencySpent.toFixed(2)),
      regularTokens,
      regularSpent: Number(regularSpent.toFixed(2)),
      avgRegularRate: Number(avgRegularRate.toFixed(4)),
      avgEmergencyRate: Number(avgEmergencyRate.toFixed(4)),
      potentialSavings: Number(potentialSavings.toFixed(2)),
      tokenLossPercentage: Number(tokenLossPercentage.toFixed(2)),
      emergencyPremium: Number((avgEmergencyRate - avgRegularRate).toFixed(4)),
    },
    monthlyBreakdown,
    insights: {
      totalEmergencyPurchases: emergencyPurchases.length,
      totalRegularPurchases: regularPurchases.length,
      emergencyFrequency: purchases.length > 0 ? Number((emergencyPurchases.length / purchases.length * 100).toFixed(1)) : 0,
      averageSavingsPerEmergency: emergencyPurchases.length > 0 ? Number((potentialSavings / emergencyPurchases.length).toFixed(2)) : 0,
    }
  };
}

async function getPurchaseTimingRecommendations(startDate?: string, endDate?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause = Object.keys(dateFilter).length > 0
    ? { purchaseDate: dateFilter }
    : {};

  // Get purchases with contributions to analyze consumption patterns
  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    include: {
      contribution: true
    },
    orderBy: { purchaseDate: 'asc' }
  });

  // Analyze consumption patterns by month and day of week
  const consumptionPatterns = purchases.reduce((acc, purchase) => {
    const date = purchase.purchaseDate;
    const monthKey = date.toISOString().substring(0, 7);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dayOfMonth = date.getDate();
    
    const tokensConsumed = purchase.contribution ? purchase.contribution.tokensConsumed : 0;
    const utilizationRate = purchase.totalTokens > 0 ? tokensConsumed / purchase.totalTokens : 0;

    if (!acc.monthly[monthKey]) {
      acc.monthly[monthKey] = {
        month: monthKey,
        purchases: 0,
        totalTokens: 0,
        totalConsumed: 0,
        emergencyPurchases: 0,
        avgUtilization: 0,
        avgTimeBetweenPurchases: 0,
      };
    }

    if (!acc.weeklyPattern[dayOfWeek]) {
      acc.weeklyPattern[dayOfWeek] = {
        dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        purchases: 0,
        emergencyPurchases: 0,
        avgTokens: 0,
        emergencyRate: 0,
      };
    }

    // Update monthly data
    acc.monthly[monthKey].purchases += 1;
    acc.monthly[monthKey].totalTokens += purchase.totalTokens;
    acc.monthly[monthKey].totalConsumed += tokensConsumed;
    if (purchase.isEmergency) acc.monthly[monthKey].emergencyPurchases += 1;

    // Update weekly pattern
    acc.weeklyPattern[dayOfWeek].purchases += 1;
    acc.weeklyPattern[dayOfWeek].avgTokens += purchase.totalTokens;
    if (purchase.isEmergency) acc.weeklyPattern[dayOfWeek].emergencyPurchases += 1;

    return acc;
  }, {
    monthly: {} as Record<string, any>,
    weeklyPattern: {} as Record<number, any>,
  });

  // Calculate averages and patterns
  const monthlyAnalysis = Object.values(consumptionPatterns.monthly).map((month: any) => {
    month.avgUtilization = month.totalTokens > 0 ? (month.totalConsumed / month.totalTokens) * 100 : 0;
    month.emergencyRate = month.purchases > 0 ? (month.emergencyPurchases / month.purchases) * 100 : 0;
    
    return {
      ...month,
      avgUtilization: Number(month.avgUtilization.toFixed(2)),
      emergencyRate: Number(month.emergencyRate.toFixed(2)),
    };
  });

  const weeklyAnalysis = Object.values(consumptionPatterns.weeklyPattern).map((day: any) => {
    day.avgTokens = day.purchases > 0 ? day.avgTokens / day.purchases : 0;
    day.emergencyRate = day.purchases > 0 ? (day.emergencyPurchases / day.purchases) * 100 : 0;
    
    return {
      ...day,
      avgTokens: Number(day.avgTokens.toFixed(0)),
      emergencyRate: Number(day.emergencyRate.toFixed(2)),
    };
  });

  // Generate recommendations
  const bestDayToBuy = weeklyAnalysis.reduce((best, current) => 
    current.emergencyRate < best.emergencyRate ? current : best
  );

  const worstDayToBuy = weeklyAnalysis.reduce((worst, current) => 
    current.emergencyRate > worst.emergencyRate ? current : worst
  );

  const avgMonthlyConsumption = monthlyAnalysis.reduce((sum, month) => sum + month.totalConsumed, 0) / monthlyAnalysis.length;
  const avgPurchaseFrequency = monthlyAnalysis.reduce((sum, month) => sum + month.purchases, 0) / monthlyAnalysis.length;

  const recommendations = [
    {
      type: 'timing',
      priority: 'high',
      title: 'Optimal Purchase Day',
      description: `Purchase tokens on ${bestDayToBuy.dayName}s to minimize emergency purchases`,
      impact: `${(worstDayToBuy.emergencyRate - bestDayToBuy.emergencyRate).toFixed(1)}% lower emergency rate`,
    },
    {
      type: 'frequency',
      priority: 'medium',
      title: 'Purchase Frequency',
      description: `Current average: ${avgPurchaseFrequency.toFixed(1)} purchases per month`,
      impact: avgPurchaseFrequency > 4 ? 'Consider larger, less frequent purchases' : 'Consider more frequent, smaller purchases',
    },
    {
      type: 'quantity',
      priority: 'medium',
      title: 'Optimal Purchase Quantity',
      description: `Based on average consumption of ${avgMonthlyConsumption.toFixed(0)} tokens/month`,
      impact: `Consider purchasing ${Math.ceil(avgMonthlyConsumption * 1.2)} tokens to maintain buffer`,
    }
  ];

  return {
    monthlyAnalysis,
    weeklyAnalysis,
    recommendations,
    insights: {
      bestPurchaseDay: bestDayToBuy.dayName,
      worstPurchaseDay: worstDayToBuy.dayName,
      avgMonthlyConsumption: Number(avgMonthlyConsumption.toFixed(0)),
      avgPurchaseFrequency: Number(avgPurchaseFrequency.toFixed(1)),
      seasonalVariation: monthlyAnalysis.length > 0 ? 
        Number((Math.max(...monthlyAnalysis.map(m => m.totalConsumed)) - Math.min(...monthlyAnalysis.map(m => m.totalConsumed))).toFixed(0)) : 0,
    }
  };
}

async function getUsagePredictions(startDate?: string, endDate?: string, targetUserId?: string) {
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

  // Get historical contribution data
  const contributions = await prisma.userContribution.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true }
      },
      purchase: {
        select: { 
          purchaseDate: true,
          isEmergency: true,
          totalTokens: true,
          totalPayment: true
        }
      }
    },
    orderBy: { purchase: { purchaseDate: 'asc' } }
  });

  // Group by user and month for trend analysis
  const userPredictions = contributions.reduce((acc, contribution) => {
    const userId = contribution.userId;
    const monthKey = contribution.purchase.purchaseDate.toISOString().substring(0, 7);
    
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: contribution.user.name,
        monthlyUsage: {} as Record<string, any>,
        totalUsage: 0,
        totalContributions: 0,
        averageMonthlyUsage: 0,
        usageTrend: 0,
        predictedNextMonth: 0,
        confidenceLevel: 'low',
      };
    }

    if (!acc[userId].monthlyUsage[monthKey]) {
      acc[userId].monthlyUsage[monthKey] = {
        month: monthKey,
        tokensConsumed: 0,
        contributions: 0,
        emergencyTokens: 0,
      };
    }

    const userData = acc[userId];
    userData.monthlyUsage[monthKey].tokensConsumed += contribution.tokensConsumed;
    userData.monthlyUsage[monthKey].contributions += contribution.contributionAmount;
    userData.totalUsage += contribution.tokensConsumed;
    userData.totalContributions += contribution.contributionAmount;

    if (contribution.purchase.isEmergency) {
      userData.monthlyUsage[monthKey].emergencyTokens += contribution.tokensConsumed;
    }

    return acc;
  }, {} as Record<string, any>);

  // Calculate predictions for each user
  const predictions = Object.values(userPredictions).map((user: any) => {
    const monthlyData = Object.values(user.monthlyUsage);
    const monthCount = monthlyData.length;
    
    if (monthCount < 2) {
      // Not enough data for reliable prediction
      return {
        ...user,
        monthlyUsage: monthlyData,
        averageMonthlyUsage: user.totalUsage,
        usageTrend: 0,
        predictedNextMonth: user.totalUsage,
        confidenceLevel: 'very-low',
      };
    }

    // Calculate average monthly usage
    user.averageMonthlyUsage = user.totalUsage / monthCount;

    // Calculate trend using simple linear regression
    const xValues = monthlyData.map((_, index) => index + 1);
    const yValues = monthlyData.map((month: any) => month.tokensConsumed);
    
    const n = monthCount;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    user.usageTrend = slope;
    user.predictedNextMonth = intercept + slope * (n + 1);

    // Ensure prediction is not negative
    user.predictedNextMonth = Math.max(0, user.predictedNextMonth);

    // Calculate confidence level based on data consistency
    const variance = yValues.reduce((sum, y) => sum + Math.pow(y - user.averageMonthlyUsage, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = user.averageMonthlyUsage > 0 ? standardDeviation / user.averageMonthlyUsage : 1;

    if (monthCount >= 6 && coefficientOfVariation < 0.3) {
      user.confidenceLevel = 'high';
    } else if (monthCount >= 4 && coefficientOfVariation < 0.5) {
      user.confidenceLevel = 'medium';
    } else if (monthCount >= 3) {
      user.confidenceLevel = 'low';
    } else {
      user.confidenceLevel = 'very-low';
    }

    return {
      ...user,
      monthlyUsage: monthlyData.map((month: any) => ({
        ...month,
        tokensConsumed: Number(month.tokensConsumed.toFixed(0)),
        contributions: Number(month.contributions.toFixed(2)),
        emergencyTokens: Number(month.emergencyTokens.toFixed(0)),
      })),
      averageMonthlyUsage: Number(user.averageMonthlyUsage.toFixed(0)),
      usageTrend: Number(user.usageTrend.toFixed(2)),
      predictedNextMonth: Number(user.predictedNextMonth.toFixed(0)),
      totalUsage: Number(user.totalUsage.toFixed(0)),
      totalContributions: Number(user.totalContributions.toFixed(2)),
    };
  });

  // Calculate system-wide predictions
  const totalPredictedUsage = predictions.reduce((sum, user) => sum + user.predictedNextMonth, 0);
  const totalAverageUsage = predictions.reduce((sum, user) => sum + user.averageMonthlyUsage, 0);
  const systemTrend = predictions.reduce((sum, user) => sum + user.usageTrend, 0);

  return {
    userPredictions: predictions,
    systemPrediction: {
      totalPredictedUsage: Number(totalPredictedUsage.toFixed(0)),
      totalAverageUsage: Number(totalAverageUsage.toFixed(0)),
      systemTrend: Number(systemTrend.toFixed(2)),
      recommendedPurchaseAmount: Number((totalPredictedUsage * 1.15).toFixed(0)), // 15% buffer
      highConfidenceUsers: predictions.filter(u => u.confidenceLevel === 'high').length,
      lowConfidenceUsers: predictions.filter(u => ['low', 'very-low'].includes(u.confidenceLevel)).length,
    },
    insights: {
      mostPredictableUser: predictions.reduce((best, current) => 
        current.confidenceLevel === 'high' && current.averageMonthlyUsage > best.averageMonthlyUsage ? current : best
      , predictions[0])?.userName || 'None',
      highestGrowthUser: predictions.reduce((highest, current) => 
        current.usageTrend > highest.usageTrend ? current : highest
      ).userName,
      totalUsers: predictions.length,
      avgConfidenceLevel: predictions.reduce((sum, user) => {
        const confidence = { 'very-low': 1, 'low': 2, 'medium': 3, 'high': 4 }[user.confidenceLevel] || 1;
        return sum + confidence;
      }, 0) / predictions.length,
    }
  };
}