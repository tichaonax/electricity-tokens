import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

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

    // Get ALL user contributions globally (system-wide shared electricity pool) - SAME AS CONTRIBUTIONS API
    const contributions = await prisma.userContribution.findMany({
      include: {
        purchase: {
          select: {
            totalTokens: true,
            totalPayment: true,
            purchaseDate: true,
          }
        }
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc', // Order by purchase date, not contribution creation
        },
      },
    });
    
    console.log('Running balance API - Found global contributions:', contributions.length);

    // Use the SAME calculation as contributions API for consistency
    const { calculateUserTrueCost } = await import('@/lib/cost-calculations');
    const globalCostBreakdown = calculateUserTrueCost(contributions);
    const contributionBalance = globalCostBreakdown.overpayment; // This should give -$4.75

    console.log('Running balance API - Global contribution balance:', contributionBalance);

    // Get recent consumption for trend analysis
    const recentContributions = contributions.filter(
      contrib => contrib.createdAt >= sevenDaysAgo
    );

    const previousWeekContributions = contributions.filter(
      contrib => contrib.createdAt >= fourteenDaysAgo && contrib.createdAt < sevenDaysAgo
    );

    // Use global totals from the cost breakdown
    const totalContributed = globalCostBreakdown.totalAmountPaid;
    const totalConsumed = globalCostBreakdown.totalTokensUsed;
    const totalTrueCost = globalCostBreakdown.totalTrueCost;

    // Calculate consumption trends  
    const lastWeekConsumption = recentContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const previousWeekConsumption = previousWeekContributions.reduce((sum, contrib) => sum + contrib.tokensConsumed, 0);
    const lastWeekContributed = recentContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);
    // const previousWeekContributed = previousWeekContributions.reduce((sum, contrib) => sum + contrib.contributionAmount, 0);

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

    // Determine status based on GLOBAL balance (positive = credit, negative = debt)
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (contributionBalance < -20) {
      status = 'critical'; // Significant debt
    } else if (contributionBalance < 0) {
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
    
    // Get the latest meter reading GLOBALLY (not user-specific)
    const latestGlobalMeterReading = await prisma.meterReading.findFirst({
      orderBy: [
        { readingDate: 'desc' },
        { reading: 'desc' }
      ]
    });
    
    // Get the latest contribution GLOBALLY (not user-specific)
    const latestGlobalContribution = await prisma.userContribution.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('=== GLOBAL METER READING DEBUG ===');
    console.log('Latest GLOBAL meter reading:', latestGlobalMeterReading?.reading || 'None');
    console.log('Latest GLOBAL contribution meter reading:', latestGlobalContribution?.meterReading || 'None');
    console.log('Expected: Latest global meter reading should be 1363.60');
    console.log('Expected: Latest global contribution meter reading should be 1339');
    
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
    
    if (latestGlobalMeterReading && latestGlobalContribution) {
      // Calculate tokens consumed since the GLOBAL last contribution
      tokensConsumedSinceLastContribution = Math.max(0, latestGlobalMeterReading.reading - latestGlobalContribution.meterReading);
      
      // Calculate historical fair share cost per kWh (using GLOBAL data)
      const historicalCostPerKwh = totalConsumed > 0 ? totalTrueCost / totalConsumed : 0;
      
      // Estimated cost since last contribution (for the "Usage Since Last Contribution" section)
      estimatedCostSinceLastContribution = -(tokensConsumedSinceLastContribution * historicalCostPerKwh);
      
      console.log('=== USAGE SINCE LAST CONTRIBUTION CALCULATION ===');
      console.log('Latest GLOBAL meter reading:', latestGlobalMeterReading.reading);
      console.log('Latest GLOBAL contribution meter reading:', latestGlobalContribution.meterReading);
      console.log('Tokens consumed since last GLOBAL contribution:', tokensConsumedSinceLastContribution);
      console.log('Expected tokens consumed: 1363.60 - 1339 = 24.6');
      console.log('Historical cost per kWh (GLOBAL):', historicalCostPerKwh);
      console.log('Total global consumed tokens:', totalConsumed);
      console.log('Total global true cost:', totalTrueCost);
      console.log('Estimated cost since last contribution:', estimatedCostSinceLastContribution);
      
      // Calculate anticipated payments using the correct proportional approach
      // We need the historical total tokens purchased (not just user's fair share)
      
      // Get the historical total cost of ALL token purchases (not just those with contributions)
      const allPurchases = await prisma.tokenPurchase.findMany({
        select: {
          id: true,
          totalPayment: true,
        }
      });
      const historicalTotalPaid = allPurchases.reduce((sum, purchase) => sum + purchase.totalPayment, 0);
      
      // Historical user total fair share = totalTrueCost (what user should have paid based on consumption)
      const historicalUserFairShare = totalTrueCost;
      
      // Historical usage by others = Total paid - User's fair share
      const historicalOthersUsage = historicalTotalPaid - historicalUserFairShare;
      
      console.log('=== ANTICIPATED PAYMENT CALCULATION (CORRECTED APPROACH) ===');
      console.log('User cost since last contribution:', estimatedCostSinceLastContribution); // -6.97
      console.log('User Balance:', contributionBalance); // -4.75
      console.log('Historical total tokens purchased:', historicalTotalPaid); // Should be ~202.50
      console.log('Historical user total fair share:', historicalUserFairShare); // 81.60
      console.log('Historical usage by others:', historicalOthersUsage); // Should be ~120.90
      
      // a) User Anticipated cost = User Balance + User cost since last contribution
      anticipatedPayment = contributionBalance + estimatedCostSinceLastContribution;
      
      // b) Others usage = User cost since last contribution × (Historical others usage / Historical user usage)
      if (historicalUserFairShare > 0) {
        const proportionRatio = historicalOthersUsage / historicalUserFairShare;
        anticipatedOthersPayment = estimatedCostSinceLastContribution * proportionRatio;
        
        // c) Anticipated token purchase = User Anticipated cost + Others usage
        anticipatedTokenPurchase = anticipatedPayment + anticipatedOthersPayment;
        
        console.log('=== STEP-BY-STEP CALCULATION ===');
        console.log('a) User Anticipated cost = User Balance + User cost since last contribution');
        console.log('   User Anticipated cost =', contributionBalance, '+', estimatedCostSinceLastContribution, '=', anticipatedPayment);
        console.log('b) Others usage = User cost × (Historical others usage / Historical user usage)');
        console.log('   Proportion ratio =', historicalOthersUsage, '/', historicalUserFairShare, '=', proportionRatio);
        console.log('   Others usage =', estimatedCostSinceLastContribution, '×', proportionRatio, '=', anticipatedOthersPayment);
        console.log('c) Anticipated token purchase = User Anticipated cost + Others usage');
        console.log('   Anticipated token purchase =', anticipatedPayment, '+', anticipatedOthersPayment, '=', anticipatedTokenPurchase);
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
      console.log('Latest GLOBAL meter reading exists:', !!latestGlobalMeterReading);
      console.log('Latest GLOBAL contribution exists:', !!latestGlobalContribution);
      console.log('If missing data, check:');
      console.log('1. Do you have any meter readings in the database?');
      console.log('2. Do you have any contributions in the database?');
      console.log('3. Global cost breakdown:', globalCostBreakdown);
    }

    const response = {
      contributionBalance, // Use GLOBAL balance (same as contributions page: -$4.75)
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
      // NEW: Anticipated others payment fields
      anticipatedOthersPayment,
      anticipatedTokenPurchase,
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