import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Running balance API - User ID:', userId);
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    // Get ALL user contributions globally (no user filtering - this shows system-wide status)
    const contributions = await prisma.userContribution.findMany({
      select: { 
        tokensConsumed: true,
        contributionAmount: true,
        createdAt: true,
        purchase: {
          select: {
            totalTokens: true,
            totalPayment: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Running balance API - Found global contributions:', contributions.length);
    console.log('Running balance API - Global contributions:', contributions);

    // Get recent consumption for trend analysis
    const recentContributions = contributions.filter(
      contrib => contrib.createdAt >= sevenDaysAgo
    );

    const previousWeekContributions = contributions.filter(
      contrib => contrib.createdAt >= fourteenDaysAgo && contrib.createdAt < sevenDaysAgo
    );

    // Calculate cumulative totals from all contributions
    const totalContributed = contributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);
    const totalConsumed = contributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    
    // Calculate the true cost (what should have been paid based on actual consumption)
    const totalTrueCost = contributions.reduce((sum, contrib) => {
      if (!contrib.purchase) return sum;
      const costPerKwh = contrib.purchase.totalPayment / contrib.purchase.totalTokens;
      return sum + (contrib.tokensConsumed * costPerKwh);
    }, 0);
    
    // Calculate the actual balance: Amount Paid - Amount That Should Have Been Paid
    const contributionBalance = totalContributed - totalTrueCost;

    // Calculate consumption trends  
    const lastWeekConsumption = recentContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const previousWeekConsumption = previousWeekContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const lastWeekContributed = recentContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);
    const previousWeekContributed = previousWeekContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);

    // Calculate average daily consumption (last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const last30DaysContributions = contributions.filter(
      contrib => contrib.createdAt >= thirtyDaysAgo
    );
    const last30DaysConsumption = last30DaysContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const averageDaily = last30DaysConsumption / 30;

    // Calculate consumption trend
    let consumptionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previousWeekConsumption > 0) {
      const weeklyChange = ((lastWeekConsumption - previousWeekConsumption) / previousWeekConsumption) * 100;
      trendPercentage = weeklyChange;
      
      if (Math.abs(weeklyChange) < 10) {
        consumptionTrend = 'stable';
      } else if (weeklyChange > 0) {
        consumptionTrend = 'increasing';
      } else {
        consumptionTrend = 'decreasing';
      }
    } else if (lastWeekConsumption > 0) {
      consumptionTrend = 'increasing';
      trendPercentage = 100;
    }

    // Determine status based on actual balance (positive = credit, negative = debt)
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (contributionBalance < -20) {
      status = 'critical'; // Significant debt
    } else if (contributionBalance < 0) {
      status = 'warning'; // Some debt
    } else {
      status = 'healthy'; // Credit or balanced
    }

    // Calculate anticipated payment/credit based on usage since last contribution
    let tokensConsumedSinceLastContribution = 0;
    let estimatedCostSinceLastContribution = 0;
    let anticipatedPayment = Math.abs(contributionBalance); // Start with current balance (absolute value)
    
    // Get the latest meter reading for any user (most recent by reading date)
    const latestMeterReading = await prisma.meterReading.findFirst({
      orderBy: { readingDate: 'desc' }
    });
    
    // Get the latest contribution to find the meter reading at that time
    const latestContribution = await prisma.userContribution.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (latestMeterReading && latestContribution) {
      // Calculate tokens consumed since last contribution
      tokensConsumedSinceLastContribution = Math.max(0, latestMeterReading.reading - latestContribution.meterReading);
      
      // Calculate historical fair share cost per kWh
      const historicalCostPerKwh = totalConsumed > 0 ? totalTrueCost / totalConsumed : 0;
      
      // Estimate cost for recent usage (negative = payment owed)
      estimatedCostSinceLastContribution = -(tokensConsumedSinceLastContribution * historicalCostPerKwh);
      
      // Calculate anticipated payment: current balance + new usage cost
      // Both are negative if money is owed, positive if credit available
      anticipatedPayment = contributionBalance + estimatedCostSinceLastContribution;
    }

    const response = {
      contributionBalance,
      totalContributed,
      totalConsumed,
      totalFairShareCost: totalTrueCost, // What should have been paid based on consumption
      averageDaily,
      status,
      lastWeekConsumption,
      lastWeekContributed,
      consumptionTrend,
      trendPercentage,
      // New fields for anticipated payment
      tokensConsumedSinceLastContribution,
      estimatedCostSinceLastContribution,
      anticipatedPayment,
      historicalCostPerKwh: totalConsumed > 0 ? totalTrueCost / totalConsumed : 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching running balance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance data' },
      { status: 500 }
    );
  }
}