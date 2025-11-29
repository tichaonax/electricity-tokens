import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

// Helper function to round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;

// Calculate account balance from contributions
async function calculateAccountBalance(
  contributions: Array<{
    contributionAmount: number;
    tokensConsumed: number;
    purchase: {
      totalTokens: number;
      totalPayment: number;
      purchaseDate: Date;
    };
  }>
): Promise<number> {
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

    // Calculate GLOBAL account balance
    const globalContributionBalance =
      await calculateAccountBalance(allContributions);

    // Get total cost of ALL purchases
    const allPurchasesCostResult = await prisma.tokenPurchase.aggregate({
      _sum: {
        totalPayment: true,
      },
    });

    // Calculate total ALL contributions
    const totalContributionsSum = allContributions.reduce(
      (sum, c) => sum + c.contributionAmount,
      0
    );

    // Global Account Balance = Total purchases cost - Total contributions
    // Positive = company owes money (underpaid)
    // Negative = company has credit (overpaid)
    const contributionBalance = globalContributionBalance;

    // Use the same calculation as contributions API for GLOBAL true cost breakdown
    const { calculateUserTrueCost } = await import('@/lib/cost-calculations');
    const globalCostBreakdown = calculateUserTrueCost(allContributions);

    // Get recent consumption for trend analysis - use GLOBAL contributions
    const recentContributions = allContributions.filter(
      (contrib) => contrib.purchase.purchaseDate >= sevenDaysAgo
    );

    // Use GLOBAL totals from the cost breakdown
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

    // Get user-specific data for the current user (for anticipated payment calculation)
    const userContributions = await prisma.userContribution.findMany({
      where: { userId },
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
          purchaseDate: 'asc',
        },
      },
    });

    // Calculate historical user fair share and others usage for anticipated payments
    let historicalUserFairShare = 0;

    if (userContributions.length > 0) {
      // Calculate user's total fair share from their contributions
      for (const contribution of userContributions) {
        const effectiveTokensConsumed = contribution.tokensConsumed || 0;
        const fairShare =
          (effectiveTokensConsumed / contribution.purchase.totalTokens) *
          contribution.purchase.totalPayment;
        historicalUserFairShare += fairShare;
      }

      // Calculate others' usage = total user paid - user's fair share
      const totalUserPaid = userContributions.reduce(
        (sum, c) => sum + c.contributionAmount,
        0
      );
      // historicalOthersUsage = totalUserPaid - historicalUserFairShare; // Not used
    }

    // Calculate user-specific breakdown using the same cost calculation (for the anticipated payment formula)
    // const userCostBreakdown = calculateUserTrueCost(userContributions);

    // Calculate anticipated payments - run for all users with global data available
    if (latestGlobalMeterReading) {
      // For users who haven't contributed, use global averages or defaults
      let userMeterReadingAtLastContribution = 0;
      let userHasContributed = false;

      if (latestUserContribution) {
        // User has contributed - use their actual data
        userMeterReadingAtLastContribution =
          latestUserContribution.meterReading;
        userHasContributed = true;
      } else {
        // User hasn't contributed - use average meter reading from recent contributions
        // This provides meaningful global anticipated payment data for managers/admins
        const recentContributions = await prisma.userContribution.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { meterReading: true },
        });

        if (recentContributions.length > 0) {
          const avgMeterReading =
            recentContributions.reduce((sum, c) => sum + c.meterReading, 0) /
            recentContributions.length;
          userMeterReadingAtLastContribution = avgMeterReading;
        }
        // If no contributions exist, userMeterReadingAtLastContribution remains 0
      }

      // Calculate tokens consumed since last contribution (or average)
      tokensConsumedSinceLastContribution = Math.max(
        0,
        latestGlobalMeterReading.reading - userMeterReadingAtLastContribution
      );

      // Calculate historical fair share cost per kWh (using GLOBAL data)
      const historicalCostPerKwh =
        totalConsumed > 0 ? totalTrueCost / totalConsumed : 0;

      // Estimated cost since last contribution (for the "Usage Since Last Contribution" section)
      estimatedCostSinceLastContribution = -(
        tokensConsumedSinceLastContribution * historicalCostPerKwh
      );

      // Calculate anticipated payments using proportional approach
      if (userHasContributed && userContributions.length > 0) {
        // User has contributed - use their specific data
        // Get all purchases that the user contributed to
        const userPurchaseIds = [
          ...new Set(userContributions.map((c) => c.purchaseId)),
        ];
        const userPurchaseTotal = await prisma.tokenPurchase.aggregate({
          where: {
            id: {
              in: userPurchaseIds,
            },
          },
          _sum: {
            totalPayment: true,
            totalTokens: true,
          },
        });

        // Calculate anticipated payment using your specified algorithm
        // User's fair share = what user should have paid based on their consumption
        const userFairShare = totalTrueCost;

        // Others' usage = Total paid by user for purchases - User's fair share
        const userPurchaseTotalCost = userPurchaseTotal._sum.totalPayment || 0;
        const othersUsage = userPurchaseTotalCost - userFairShare;

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
        }
      } else {
        // User hasn't contributed - show global anticipated payment information
        // This provides managers/admins with meaningful global data
        anticipatedPayment = contributionBalance; // Global balance status
        anticipatedOthersPayment = 0; // Not applicable for non-contributing users
        anticipatedTokenPurchase = contributionBalance; // Global balance
      }
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
