import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

// Helper function to round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;

// Calculate account balance from contributions
async function calculateAccountBalance(contributions: any[]): Promise<number> {
  if (contributions.length === 0) {
    return 0;
  }

  // Get the earliest purchase date to determine what counts as "first purchase"
  const earliestPurchase = await prisma.tokenPurchase.findFirst({
    orderBy: { purchaseDate: 'asc' },
  });

  let runningBalance = 0;

  for (let i = 0; i < contributions.length; i++) {
    const contribution = contributions[i];

    // Check if this is the first purchase globally
    const isFirstPurchase =
      earliestPurchase &&
      contribution.purchase.purchaseDate.getTime() ===
        earliestPurchase.purchaseDate.getTime();

    // For the first purchase, no tokens were consumed before it
    const effectiveTokensConsumed = isFirstPurchase
      ? 0
      : contribution.tokensConsumed;

    const fairShare =
      (effectiveTokensConsumed / contribution.purchase.totalTokens) *
      contribution.purchase.totalPayment;
    const balanceChange = contribution.contributionAmount - fairShare;
    runningBalance += balanceChange;
  }

  return runningBalance;
}

export async function GET() {
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

    // Get ALL contributions in the system (global balance)
    const allContributions = await prisma.userContribution.findMany({
      include: {
        purchase: {
          select: {
            totalTokens: true,
            totalPayment: true,
            purchaseDate: true,
          },
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc', // Order by purchase date, not contribution creation
        },
      },
    });

    console.log(
      'Running balance API - Found all contributions:',
      allContributions.length
    );

    // Calculate GLOBAL account balance
    const globalContributionBalance = await calculateAccountBalance(allContributions);

    // Get total cost of ALL purchases
    const allPurchasesCostResult = await prisma.tokenPurchase.aggregate({
      _sum: {
        totalPayment: true,
      },
    });
    const totalPurchasesCost = allPurchasesCostResult._sum.totalPayment || 0;

    // Calculate total ALL contributions
    const totalContributionsSum = allContributions.reduce(
      (sum, c) => sum + c.contributionAmount,
      0
    );

    // Global Account Balance = Total purchases cost - Total contributions
    // Positive = company owes money (underpaid)
    // Negative = company has credit (overpaid)
    const contributionBalance = globalContributionBalance;

    console.log(
      'Running balance API - Total purchases cost:',
      totalPurchasesCost
    );
    console.log(
      'Running balance API - Total contributions:',
      totalContributionsSum
    );
    console.log('Running balance API - Account balance:', contributionBalance);

    // Use the same calculation as contributions API for GLOBAL true cost breakdown
    const { calculateUserTrueCost } = await import('@/lib/cost-calculations');
    const globalCostBreakdown = calculateUserTrueCost(allContributions);

    // Get recent consumption for trend analysis - use GLOBAL contributions
    const recentContributions = allContributions.filter(
      (contrib) => contrib.purchase.purchaseDate >= sevenDaysAgo
    );

    const previousWeekContributions = allContributions.filter(
      (contrib) =>
        contrib.purchase.purchaseDate >= fourteenDaysAgo &&
        contrib.purchase.purchaseDate < sevenDaysAgo
    );

    // Use GLOBAL totals from the cost breakdown
    const totalContributed = globalCostBreakdown.totalAmountPaid;
    const totalConsumed = globalCostBreakdown.totalTokensUsed;
    const totalTrueCost = globalCostBreakdown.totalTrueCost;

    // Calculate actual consumption from meter readings (last 7 days)
    const lastWeekMeterReadings = await prisma.meterReading.findMany({
      where: {
        readingDate: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        readingDate: 'asc',
      },
    });

    const previousWeekMeterReadings = await prisma.meterReading.findMany({
      where: {
        readingDate: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
      orderBy: {
        readingDate: 'asc',
      },
    });

    // Calculate consumption as difference between first and last readings
    const lastWeekConsumption =
      lastWeekMeterReadings.length > 1
        ? lastWeekMeterReadings[lastWeekMeterReadings.length - 1].reading -
          lastWeekMeterReadings[0].reading
        : 0;

    const previousWeekConsumption =
      previousWeekMeterReadings.length > 1
        ? previousWeekMeterReadings[previousWeekMeterReadings.length - 1]
            .reading - previousWeekMeterReadings[0].reading
        : 0;

    const lastWeekContributed = recentContributions.reduce(
      (sum, contrib) => sum + contrib.contributionAmount,
      0
    );
    // const previousWeekContributed = previousWeekContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);

    // Calculate average daily consumption (last 30 days) from meter readings
    const thirtyDaysAgo = subDays(now, 30);
    const last30DaysMeterReadings = await prisma.meterReading.findMany({
      where: {
        readingDate: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        readingDate: 'asc',
      },
    });

    const last30DaysConsumption =
      last30DaysMeterReadings.length > 1
        ? last30DaysMeterReadings[last30DaysMeterReadings.length - 1].reading -
          last30DaysMeterReadings[0].reading
        : 0;
    const averageDaily = last30DaysConsumption / 30;

    // Calculate consumption trend
    let consumptionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previousWeekConsumption > 0) {
      const weeklyChange =
        ((lastWeekConsumption - previousWeekConsumption) /
          previousWeekConsumption) *
        100;
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

    // Determine status based on GLOBAL balance
    // Positive contributionBalance = debt (purchases > contributions)
    // Negative contributionBalance = credit (contributions > purchases)
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (contributionBalance > 20) {
      status = 'critical'; // Significant debt
    } else if (contributionBalance > 0) {
      status = 'warning'; // Some debt
    } else {
      status = 'healthy'; // Credit or balanced
    }

    // Calculate anticipated payment using your specified algorithm
    let tokensConsumedSinceLastContribution = 0;
    let estimatedCostSinceLastContribution = 0;
    let anticipatedPayment = 0;
    let anticipatedOthersPayment = 0;
    let anticipatedTokenPurchase = 0;

    // Get USER-SPECIFIC latest meter reading and contribution
    const latestUserContribution = await prisma.userContribution.findFirst({
      where: { userId },
      include: {
        purchase: {
          select: {
            purchaseDate: true,
          },
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'desc',
        },
      },
    });

    // Get the latest GLOBAL meter reading (for consumption calculation)
    const latestGlobalMeterReading = await prisma.meterReading.findFirst({
      orderBy: [{ readingDate: 'desc' }, { reading: 'desc' }],
    });

    console.log('=== USER METER READING DEBUG ===');
    console.log(
      'Latest USER contribution meter reading:',
      latestUserContribution?.meterReading || 'None'
    );
    console.log(
      'Latest GLOBAL meter reading:',
      latestGlobalMeterReading?.reading || 'None'
    );

    // Get user-specific data for the current user (commented out - not used in global approach)
    // const userContributions = await prisma.userContribution.findMany({
    //   where: { userId },
    //   include: {
    //     purchase: {
    //       select: {
    //         totalTokens: true,
    //         totalPayment: true,
    //         purchaseDate: true,
    //       }
    //     }
    //   },
    //   orderBy: {
    //     purchase: {
    //       purchaseDate: 'asc',
    //     },
    //   },
    // });

    // Calculate user-specific breakdown using the same cost calculation (for the anticipated payment formula)
    // const userCostBreakdown = calculateUserTrueCost(userContributions);

    if (latestGlobalMeterReading && latestUserContribution) {
      // Calculate tokens consumed since the USER'S last contribution
      tokensConsumedSinceLastContribution = Math.max(
        0,
        latestGlobalMeterReading.reading - latestUserContribution.meterReading
      );

      // Calculate historical fair share cost per kWh (using GLOBAL data)
      const historicalCostPerKwh =
        totalConsumed > 0 ? totalTrueCost / totalConsumed : 0;

      // Estimated cost since last contribution (for the "Usage Since Last Contribution" section)
      estimatedCostSinceLastContribution = -(
        tokensConsumedSinceLastContribution * historicalCostPerKwh
      );

      console.log('=== USAGE SINCE LAST CONTRIBUTION CALCULATION ===');
      console.log(
        'Latest GLOBAL meter reading:',
        latestGlobalMeterReading.reading
      );
      console.log(
        'Latest USER contribution meter reading:',
        latestUserContribution.meterReading
      );
      console.log(
        'Tokens consumed since last USER contribution:',
        tokensConsumedSinceLastContribution
      );
      console.log('Historical cost per kWh (USER):', historicalCostPerKwh);
      console.log('Total global consumed tokens:', totalConsumed);
      console.log('Total global true cost:', totalTrueCost);
      console.log(
        'Estimated cost since last contribution:',
        estimatedCostSinceLastContribution
      );

      // Calculate anticipated payments using USER-SPECIFIC proportional approach
      // Get all purchases that the user contributed to
      const userPurchaseIds = [...new Set(userContributions.map(c => c.purchaseId))];
      const userPurchaseTotal = await prisma.tokenPurchase.aggregate({
        where: {
          id: {
            in: userPurchaseIds
          }
        },
        _sum: {
          totalPayment: true,
          totalTokens: true,
        },
      });

      const userPurchaseTotalCost = userPurchaseTotal._sum.totalPayment || 0;
      const userPurchaseTotalTokens = userPurchaseTotal._sum.totalTokens || 0;

      // User's fair share = what user should have paid based on their consumption
      const userFairShare = totalTrueCost;

      // Others' usage = Total paid by user for purchases - User's fair share
      const othersUsage = userPurchaseTotalCost - userFairShare;

      console.log(
        '=== ANTICIPATED PAYMENT CALCULATION (USER-SPECIFIC APPROACH) ==='
      );
      console.log(
        'User cost since last contribution:',
        estimatedCostSinceLastContribution
      );
      console.log('User Balance:', contributionBalance);
      console.log('User purchase total cost:', userPurchaseTotalCost);
      console.log('User fair share:', userFairShare);
      console.log('Others usage:', othersUsage);

      // a) User Anticipated cost = User Balance + User cost since last contribution
      anticipatedPayment =
        contributionBalance + estimatedCostSinceLastContribution;

      // b) Others usage = User cost since last contribution × (Others usage / User fair share)
      if (userFairShare > 0) {
        const proportionRatio = othersUsage / userFairShare;
        anticipatedOthersPayment =
          estimatedCostSinceLastContribution * proportionRatio;

        // c) Anticipated token purchase = User Anticipated cost + Others usage
        anticipatedTokenPurchase =
          anticipatedPayment + anticipatedOthersPayment;

        console.log('=== STEP-BY-STEP CALCULATION ===');
        console.log(
          'a) User Anticipated cost = User Balance + User cost since last contribution'
        );
        console.log(
          '   User Anticipated cost =',
          contributionBalance,
          '+',
          estimatedCostSinceLastContribution,
          '=',
          anticipatedPayment
        );
        console.log(
          'b) Others usage = User cost × (Historical others usage / Historical user usage)'
        );
        console.log(
          '   Proportion ratio =',
          historicalOthersUsage,
          '/',
          historicalUserFairShare,
          '=',
          proportionRatio
        );
        console.log(
          '   Others usage =',
          estimatedCostSinceLastContribution,
          '×',
          proportionRatio,
          '=',
          anticipatedOthersPayment
        );
        console.log(
          'c) Anticipated token purchase = User Anticipated cost + Others usage'
        );
        console.log(
          '   Anticipated token purchase =',
          anticipatedPayment,
          '+',
          anticipatedOthersPayment,
          '=',
          anticipatedTokenPurchase
        );
        console.log('---');
        console.log('FINAL RESULTS:');
        console.log('Anticipated User Payment:', anticipatedPayment);
        console.log('Anticipated Others Payment:', anticipatedOthersPayment);
        console.log('Anticipated Token Purchase:', anticipatedTokenPurchase);
      } else {
        console.log('=== ANTICIPATED PAYMENT CALCULATION SKIPPED ===');
        console.log('Reason: Cannot determine proportional share');
      }
    } else {
      console.log('=== CALCULATION SKIPPED ===');
      console.log(
        'Latest GLOBAL meter reading exists:',
        !!latestGlobalMeterReading
      );
      console.log('If missing data, check:');
      console.log('1. Do you have any meter readings in the database?');
      console.log('2. Do you have any contributions in the database?');
      console.log('3. Global cost breakdown:', globalCostBreakdown);
    }

    const response = {
      contributionBalance: round2(contributionBalance), // Total purchases - total contributions (positive = debt, negative = credit)
      totalContributed: round2(totalContributionsSum),
      totalConsumed: round2(totalConsumed),
      totalFairShareCost: round2(totalTrueCost), // What should have been paid based on consumption
      averageDaily: round2(averageDaily),
      status,
      lastWeekConsumption: round2(lastWeekConsumption),
      lastWeekContributed: round2(lastWeekContributed),
      consumptionTrend,
      trendPercentage: round2(trendPercentage),
      // New fields for anticipated payment
      tokensConsumedSinceLastContribution: round2(
        tokensConsumedSinceLastContribution
      ),
      estimatedCostSinceLastContribution: round2(
        estimatedCostSinceLastContribution
      ),
      anticipatedPayment: round2(anticipatedPayment),
      historicalCostPerKwh: round2(
        totalConsumed > 0 ? totalTrueCost / totalConsumed : 0
      ),
      // NEW: Anticipated others payment fields
      anticipatedOthersPayment: round2(anticipatedOthersPayment),
      anticipatedTokenPurchase: round2(anticipatedTokenPurchase),
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
