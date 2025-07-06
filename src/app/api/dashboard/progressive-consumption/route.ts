import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    // Get meter readings to calculate actual consumption for both months
    const allMeterReadings = await prisma.meterReading.findMany({
      where: {
        readingDate: {
          gte: previousMonthStart,
          lte: currentMonthEnd,
        },
      },
      select: {
        reading: true,
        readingDate: true,
      },
      orderBy: { readingDate: 'asc' },
    });

    // Get global contributions for cost calculations
    const currentMonthContributions = await prisma.userContribution.findMany({
      where: {
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

    const previousMonthContributions = await prisma.userContribution.findMany({
      where: {
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

    // Find meter readings at month boundaries
    const currentMonthReadings = allMeterReadings.filter(
      (r) => r.readingDate >= currentMonthStart
    );
    const previousMonthReadings = allMeterReadings.filter(
      (r) =>
        r.readingDate >= previousMonthStart && r.readingDate < currentMonthStart
    );

    // Calculate consumption for current month (July)
    let currentConsumed = 0;
    if (currentMonthReadings.length >= 1) {
      // Get baseline reading from end of previous month or first reading of current month
      const firstCurrentReading = currentMonthReadings[0];
      const lastCurrentReading =
        currentMonthReadings[currentMonthReadings.length - 1];

      // Find the reading closest to the start of current month for baseline
      const baselineReading =
        allMeterReadings.find((r) => r.readingDate < currentMonthStart) ||
        firstCurrentReading;

      if (baselineReading && currentMonthReadings.length > 0) {
        currentConsumed = lastCurrentReading.reading - baselineReading.reading;
      }
    }

    // Calculate consumption for previous month (June)
    let previousConsumed = 0;
    if (previousMonthReadings.length >= 1) {
      // Get baseline reading from end of month before previous month
      const firstPreviousReading = previousMonthReadings[0];
      const lastPreviousReading =
        previousMonthReadings[previousMonthReadings.length - 1];

      // Find the reading closest to the start of previous month for baseline
      const baselineReading =
        allMeterReadings.find((r) => r.readingDate < previousMonthStart) ||
        firstPreviousReading;

      if (baselineReading) {
        previousConsumed =
          lastPreviousReading.reading - baselineReading.reading;
      }
    } else {
      // Fallback to contributions data
      previousConsumed = previousMonthContributions.reduce(
        (sum, contrib) => sum + contrib.tokensConsumed,
        0
      );
    }

    // Calculate cost totals from contributions (global)
    const currentContributed = currentMonthContributions.reduce(
      (sum, contrib) => sum + contrib.contributionAmount,
      0
    );
    const previousContributed = previousMonthContributions.reduce(
      (sum, contrib) => sum + contrib.contributionAmount,
      0
    );

    // Calculate cost per kWh trends
    const currentCostPerKwh =
      currentConsumed > 0 ? currentContributed / currentConsumed : 0;
    const previousCostPerKwh =
      previousConsumed > 0 ? previousContributed / previousConsumed : 0;

    // Get historical data since beginning of time
    const allPurchases = await prisma.tokenPurchase.findMany({
      select: {
        totalTokens: true,
        totalPayment: true,
      },
    });

    const allContributions = await prisma.userContribution.findMany({
      select: {
        tokensConsumed: true,
        contributionAmount: true,
        purchase: {
          select: {
            totalTokens: true,
            totalPayment: true,
          },
        },
      },
    });

    // Calculate totals since beginning of time
    const totalPurchasedTokens = allPurchases.reduce(
      (sum, purchase) => sum + purchase.totalTokens,
      0
    );
    const totalPurchasedCost = allPurchases.reduce(
      (sum, purchase) => sum + purchase.totalPayment,
      0
    );

    const totalConsumedTokens = allContributions.reduce(
      (sum, contrib) => sum + contrib.tokensConsumed,
      0
    );
    const totalConsumedCost = allContributions.reduce(
      (sum, contrib) => sum + contrib.contributionAmount,
      0
    );

    const averageCostPerKwhAllTime =
      totalConsumedTokens > 0 ? totalConsumedCost / totalConsumedTokens : 0;

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previousConsumed > 0) {
      const consumptionChange =
        ((currentConsumed - previousConsumed) / previousConsumed) * 100;
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
      year: 'numeric',
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
      historical: {
        totalPurchasedTokens,
        totalPurchasedCost,
        totalConsumedTokens,
        totalConsumedCost,
        averageCostPerKwhAllTime,
      },
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
