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
    // Use UTC to avoid timezone boundary issues
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const currentMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
    const previousMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const previousMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));

    console.log('🗓️ Progressive Consumption Date Ranges:');
    console.log('Current Month (July):', currentMonthStart.toISOString(), 'to', currentMonthEnd.toISOString());
    console.log('Previous Month (June):', previousMonthStart.toISOString(), 'to', previousMonthEnd.toISOString());
    
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

    console.log('📊 All Meter Readings Found:');
    allMeterReadings.forEach((reading, index) => {
      console.log(`  ${index + 1}. ${reading.reading} kWh on ${reading.readingDate.toISOString().split('T')[0]}`);
    });

    // Get global contributions for cost calculations
    const currentMonthContributions = await prisma.userContribution.findMany({
      where: {
        purchase: {
          purchaseDate: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
      },
      select: {
        tokensConsumed: true,
        contributionAmount: true,
        purchase: {
          select: {
            purchaseDate: true,
          },
        },
      },
    });

    const previousMonthContributions = await prisma.userContribution.findMany({
      where: {
        purchase: {
          purchaseDate: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      },
      select: {
        tokensConsumed: true,
        contributionAmount: true,
        purchase: {
          select: {
            purchaseDate: true,
          },
        },
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

    console.log('📅 Date Boundary Debug:');
    console.log('  currentMonthStart:', currentMonthStart.toISOString());
    console.log('  previousMonthStart:', previousMonthStart.toISOString());
    
    console.log('📅 Current Month Readings (July 2025):');
    currentMonthReadings.forEach((reading, index) => {
      const isAfterBoundary = reading.readingDate >= currentMonthStart;
      console.log(`  ${index + 1}. ${reading.reading} kWh on ${reading.readingDate.toISOString().split('T')[0]} (>= July 1st: ${isAfterBoundary})`);
    });

    console.log('📅 Previous Month Readings (June 2025):');
    previousMonthReadings.forEach((reading, index) => {
      const isInRange = reading.readingDate >= previousMonthStart && reading.readingDate < currentMonthStart;
      console.log(`  ${index + 1}. ${reading.reading} kWh on ${reading.readingDate.toISOString().split('T')[0]} (in June range: ${isInRange})`);
    });

    const readingsBeforeJune = allMeterReadings.filter((r) => r.readingDate < previousMonthStart);
    console.log('📅 Readings Before June 2025:');
    readingsBeforeJune.forEach((reading, index) => {
      console.log(`  ${index + 1}. ${reading.reading} kWh on ${reading.readingDate.toISOString().split('T')[0]}`);
    });

    // Calculate consumption for current month (July)
    let currentConsumed = 0;
    if (currentMonthReadings.length >= 1) {
      // Get baseline reading from end of previous month or first reading of current month  
      const firstCurrentReading = currentMonthReadings[0];
      
      // Find the highest reading (not just the last chronologically) in case of multiple readings on same day
      const lastCurrentReading = currentMonthReadings.reduce((highest, current) => {
        return current.reading > highest.reading ? current : highest;
      }, currentMonthReadings[0]);

      // Find the most recent reading before the current month for baseline
      const readingsBeforeCurrentMonth = allMeterReadings.filter((r) => r.readingDate < currentMonthStart);
      const baselineReading = readingsBeforeCurrentMonth.length > 0 
        ? readingsBeforeCurrentMonth[readingsBeforeCurrentMonth.length - 1] // Last reading before current month
        : firstCurrentReading;

      if (baselineReading && currentMonthReadings.length > 0) {
        currentConsumed = lastCurrentReading.reading - baselineReading.reading;
        console.log('🔢 Current Month Calculation:');
        console.log('  Latest reading (July):', lastCurrentReading.reading, 'kWh on', lastCurrentReading.readingDate);
        console.log('  Baseline reading:', baselineReading.reading, 'kWh on', baselineReading.readingDate);
        console.log('  Calculated consumption:', currentConsumed, 'kWh');
      }
    }

    // Calculate consumption for previous month (June)
    let previousConsumed = 0;
    if (previousMonthReadings.length >= 1) {
      // Get baseline reading from end of month before previous month
      const firstPreviousReading = previousMonthReadings[0];
      
      // Find the highest reading (not just the last chronologically) in case of multiple readings on same day
      const lastPreviousReading = previousMonthReadings.reduce((highest, current) => {
        return current.reading > highest.reading ? current : highest;
      }, previousMonthReadings[0]);

      // Find the most recent reading before the previous month for baseline
      const readingsBeforePreviousMonth = allMeterReadings.filter((r) => r.readingDate < previousMonthStart);
      const baselineReading = readingsBeforePreviousMonth.length > 0 
        ? readingsBeforePreviousMonth[readingsBeforePreviousMonth.length - 1] // Last reading before previous month
        : firstPreviousReading;

      if (baselineReading) {
        previousConsumed =
          lastPreviousReading.reading - baselineReading.reading;
        console.log('🔢 Previous Month Calculation:');
        console.log('  Latest reading (June):', lastPreviousReading.reading, 'kWh on', lastPreviousReading.readingDate);
        console.log('  Baseline reading:', baselineReading.reading, 'kWh on', baselineReading.readingDate);
        console.log('  Calculated consumption:', previousConsumed, 'kWh');
      }
    } else {
      // Fallback to contributions data
      previousConsumed = previousMonthContributions.reduce(
        (sum, contrib) => sum + contrib.tokensConsumed,
        0
      );
    }

    // Calculate cost totals from contributions (global)
    console.log('📊 Found contributions:');
    console.log('Current Month (July) contributions:', currentMonthContributions.length);
    console.log('Previous Month (June) contributions:', previousMonthContributions.length);
    
    if (previousMonthContributions.length > 0) {
      console.log('June contributions details:', previousMonthContributions.map(c => ({
        amount: c.contributionAmount,
        tokens: c.tokensConsumed,
        purchaseDate: c.purchase.purchaseDate
      })));
    }

    const currentContributed = currentMonthContributions.reduce(
      (sum, contrib) => sum + contrib.contributionAmount,
      0
    );
    const previousContributed = previousMonthContributions.reduce(
      (sum, contrib) => sum + contrib.contributionAmount,
      0
    );

    console.log('💰 Calculated totals:');
    console.log('Current month contributed:', currentContributed);
    console.log('Previous month contributed:', previousContributed);

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

      console.log('📈 Trend Calculation:');
      console.log(`  Current consumption: ${currentConsumed} kWh`);
      console.log(`  Previous consumption: ${previousConsumed} kWh`);
      console.log(`  Change: ${currentConsumed - previousConsumed} kWh`);
      console.log(`  Percentage change: ${trendPercentage.toFixed(1)}%`);

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
      console.log('📈 Trend Calculation: No previous data, showing 100% increase');
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

    console.log('📤 Final API Response:');
    console.log('  Current Month Consumed:', response.currentMonth.consumed, 'kWh');
    console.log('  Previous Month Consumed:', response.previousMonth.consumed, 'kWh');
    console.log('  Trend Percentage:', response.trendPercentage);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching progressive consumption data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consumption data' },
      { status: 500 }
    );
  }
}
