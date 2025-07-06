import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    // Get current month contributions (user's usage of shared purchases)
    const currentMonthContributions = await prisma.userContribution.findMany({
      where: {
        userId,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        tokensConsumed: true,
        contributionAmount: true,
      },
    });

    // Get previous month contributions
    const previousMonthContributions = await prisma.userContribution.findMany({
      where: {
        userId,
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
      select: {
        tokensConsumed: true,
        contributionAmount: true,
      },
    });

    // Calculate totals from contributions
    const currentConsumed = currentMonthContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const previousConsumed = previousMonthContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const currentContributed = currentMonthContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);
    const previousContributed = previousMonthContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);

    // Calculate cost per kWh trends
    const currentCostPerKwh = currentConsumed > 0 ? currentContributed / currentConsumed : 0;
    const previousCostPerKwh = previousConsumed > 0 ? previousContributed / previousConsumed : 0;
    
    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previousConsumed > 0) {
      const consumptionChange = ((currentConsumed - previousConsumed) / previousConsumed) * 100;
      trendPercentage = consumptionChange;
      
      if (Math.abs(consumptionChange) < 5) {
        trend = 'stable';
      } else if (consumptionChange > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    } else if (currentConsumed > 0) {
      trend = 'up';
      trendPercentage = 100;
    }

    // Format current month period
    const currentPeriod = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    const response = {
      currentMonth: {
        period: currentPeriod,
        consumed: currentConsumed,
        totalContributed: currentContributed,
        costPerKwh: currentCostPerKwh,
      },
      previousMonth: {
        consumed: previousConsumed,
        totalContributed: previousContributed,
        costPerKwh: previousCostPerKwh,
      },
      trend,
      trendPercentage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching progressive consumption data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consumption data' },
      { status: 500 }
    );
  }
}