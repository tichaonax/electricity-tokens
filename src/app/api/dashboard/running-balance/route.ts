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
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);

    // Get all user contributions with purchase data
    const contributions = await prisma.userContribution.findMany({
      where: { userId },
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
    });

    // Get recent consumption for trend analysis
    const recentContributions = contributions.filter(
      contrib => contrib.createdAt >= sevenDaysAgo
    );

    const previousWeekContributions = contributions.filter(
      contrib => contrib.createdAt >= fourteenDaysAgo && contrib.createdAt < sevenDaysAgo
    );

    // Calculate contribution balance (what user has paid vs fair share)
    const totalContributed = contributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);
    const totalConsumed = contributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    
    // Calculate fair share cost based on actual consumption
    const totalFairShareCost = contributions.reduce((sum, contrib) => {
      if (!contrib.purchase) return sum;
      const costPerKwh = contrib.purchase.totalPayment / contrib.purchase.totalTokens;
      return sum + (contrib.tokensConsumed * costPerKwh);
    }, 0);
    
    const contributionBalance = totalContributed - totalFairShareCost; // Positive = overpaid, Negative = owes

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

    // Determine status based on contribution balance
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (contributionBalance < -50) {
      status = 'critical'; // Owes significant amount
    } else if (contributionBalance < 0) {
      status = 'warning'; // Owes money
    } else {
      status = 'healthy'; // Has credit or is even
    }

    const response = {
      contributionBalance,
      totalContributed,
      totalConsumed,
      totalFairShareCost,
      averageDaily,
      status,
      lastWeekConsumption,
      lastWeekContributed,
      consumptionTrend,
      trendPercentage,
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