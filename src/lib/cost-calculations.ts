/**
 * Comprehensive Cost Calculation Engine
 * Handles proportional costs, multiple purchases, emergency rates, and user-specific calculations
 * V2: Now includes dual-currency support with receipt data
 */

// Helper function to round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;

export interface Purchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  purchaseDate: Date | string;
  isEmergency: boolean;
  contributions?: Contribution[];
  receiptData?: {
    id: string;
    kwhPurchased: number;
    energyCostZWG: number;
    debtZWG: number;
    reaZWG: number;
    vatZWG: number;
    totalAmountZWG: number;
    transactionDateTime: Date | string;
  } | null;
}

export interface Contribution {
  id: string;
  purchaseId: string;
  userId: string;
  contributionAmount: number;
  meterReading: number;
  tokensConsumed: number;
  createdAt: Date | string;
  user?: {
    id: string;
    name: string;
  };
  purchase?: Purchase;
}

export interface CostBreakdown {
  totalTokensUsed: number;
  totalAmountPaid: number;
  totalTrueCost: number;
  averageCostPerKwh: number;
  efficiency: number;
  overpayment: number;
  emergencyPremium: number;
  regularCostPerKwh: number;
  emergencyCostPerKwh: number;
}

export interface UserCostSummary extends CostBreakdown {
  userId: string;
  userName?: string;
  contributions: Contribution[];
  purchases: Purchase[];
}

export interface PeriodCostAnalysis {
  period: {
    start: Date;
    end: Date;
  };
  users: UserCostSummary[];
  totalSummary: CostBreakdown;
  emergencyPurchaseImpact: {
    regularPurchases: number;
    emergencyPurchases: number;
    additionalCostDueToEmergency: number;
    percentageIncrease: number;
  };
}

/**
 * Calculate proportional cost based on actual usage
 */
export function calculateProportionalCost(
  tokensUsed: number,
  totalTokensInPurchase: number,
  totalPurchaseCost: number
): number {
  if (totalTokensInPurchase === 0) return 0;
  return (tokensUsed / totalTokensInPurchase) * totalPurchaseCost;
}

/**
 * Calculate cost per kWh for a specific purchase
 * V2: Prefers official receipt data when available
 */
export function calculateCostPerKwh(purchase: Purchase): number {
  // Prefer official receipt data if available
  if (purchase.receiptData && purchase.receiptData.kwhPurchased > 0) {
    return (
      purchase.receiptData.totalAmountZWG / purchase.receiptData.kwhPurchased
    );
  }

  // Fall back to USD internal data
  if (purchase.totalTokens === 0) return 0;
  return purchase.totalPayment / purchase.totalTokens;
}

/**
 * Calculate cost per kWh with dual-currency awareness
 * Returns both USD and ZWG rates when receipt data is available
 */
export function calculateCostPerKwhDual(purchase: Purchase): {
  usd: number;
  zwg: number | null;
  hasReceiptData: boolean;
} {
  const usd =
    purchase.totalTokens > 0 ? purchase.totalPayment / purchase.totalTokens : 0;

  let zwg: number | null = null;
  if (purchase.receiptData && purchase.receiptData.kwhPurchased > 0) {
    zwg =
      purchase.receiptData.totalAmountZWG / purchase.receiptData.kwhPurchased;
  }

  return {
    usd: round2(usd),
    zwg: zwg !== null ? round2(zwg) : null,
    hasReceiptData: zwg !== null,
  };
}

/**
 * Calculate user's true cost across multiple purchases
 */
export function calculateUserTrueCost(
  contributions: Contribution[]
): CostBreakdown {
  if (contributions.length === 0) {
    return {
      totalTokensUsed: 0,
      totalAmountPaid: 0,
      totalTrueCost: 0,
      averageCostPerKwh: 0,
      efficiency: 0,
      overpayment: 0,
      emergencyPremium: 0,
      regularCostPerKwh: 0,
      emergencyCostPerKwh: 0,
    };
  }

  let totalTokensUsed = 0;
  let totalAmountPaid = 0;
  let totalTrueCost = 0;
  let regularTokens = 0;
  let emergencyTokens = 0;
  let regularTrueCost = 0;
  let emergencyTrueCost = 0;

  // Sort contributions by purchase date to ensure chronological order
  const sortedContributions = [...contributions].sort((a, b) => {
    if (!a.purchase?.purchaseDate || !b.purchase?.purchaseDate) return 0;
    const dateA = new Date(a.purchase.purchaseDate);
    const dateB = new Date(b.purchase.purchaseDate);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate correct balance: Amount Paid - True Cost
  sortedContributions.forEach((contribution) => {
    const purchase = contribution.purchase;
    if (!purchase) return;

    const trueCost = calculateProportionalCost(
      contribution.tokensConsumed,
      purchase.totalTokens,
      purchase.totalPayment
    );

    totalTokensUsed += contribution.tokensConsumed;
    totalAmountPaid += contribution.contributionAmount;
    totalTrueCost += trueCost;

    if (purchase.isEmergency) {
      emergencyTokens += contribution.tokensConsumed;
      emergencyTrueCost += trueCost;
    } else {
      regularTokens += contribution.tokensConsumed;
      regularTrueCost += trueCost;
    }
  });

  // Calculate the correct balance: what we paid vs what we should have paid
  const runningBalance = totalAmountPaid - totalTrueCost;

  const averageCostPerKwh =
    totalTokensUsed > 0 ? totalTrueCost / totalTokensUsed : 0;
  const efficiency =
    totalTrueCost > 0 ? (totalTrueCost / totalAmountPaid) * 100 : 0;

  // Use the running balance as the overpayment (account balance)
  const overpayment = runningBalance;

  const regularCostPerKwh =
    regularTokens > 0 ? regularTrueCost / regularTokens : 0;
  const emergencyCostPerKwh =
    emergencyTokens > 0 ? emergencyTrueCost / emergencyTokens : 0;

  // Calculate emergency premium (additional cost due to emergency purchases)
  const emergencyPremium =
    emergencyTokens > 0 && regularCostPerKwh > 0
      ? emergencyTrueCost - emergencyTokens * regularCostPerKwh
      : 0;

  return {
    totalTokensUsed: round2(totalTokensUsed),
    totalAmountPaid: round2(totalAmountPaid),
    totalTrueCost: round2(totalTrueCost),
    averageCostPerKwh: round2(averageCostPerKwh),
    efficiency: round2(efficiency),
    overpayment: round2(overpayment),
    emergencyPremium: round2(emergencyPremium),
    regularCostPerKwh: round2(regularCostPerKwh),
    emergencyCostPerKwh: round2(emergencyCostPerKwh),
  };
}

/**
 * Calculate costs for multiple users across multiple purchases in a given period
 */
export function calculatePeriodCostAnalysis(
  purchases: Purchase[],
  contributions: Contribution[],
  startDate?: Date,
  endDate?: Date
): PeriodCostAnalysis {
  // Filter by date range if provided
  const filteredContributions = contributions.filter((contribution) => {
    if (!startDate && !endDate) return true;

    const contributionDate = new Date(contribution.createdAt);
    if (startDate && contributionDate < startDate) return false;
    if (endDate && contributionDate > endDate) return false;

    return true;
  });

  const filteredPurchases = purchases.filter((purchase) => {
    if (!startDate && !endDate) return true;

    const purchaseDate = new Date(purchase.purchaseDate);
    if (startDate && purchaseDate < startDate) return false;
    if (endDate && purchaseDate > endDate) return false;

    return true;
  });

  // Group contributions by user
  const userContributions = new Map<string, Contribution[]>();
  filteredContributions.forEach((contribution) => {
    const userId = contribution.userId;
    if (!userContributions.has(userId)) {
      userContributions.set(userId, []);
    }
    userContributions.get(userId)!.push(contribution);
  });

  // Calculate costs for each user
  const users: UserCostSummary[] = Array.from(userContributions.entries()).map(
    ([userId, userContribs]) => {
      const costBreakdown = calculateUserTrueCost(userContribs);
      const userPurchases = filteredPurchases.filter((p) =>
        userContribs.some((c) => c.purchaseId === p.id)
      );

      return {
        userId,
        userName: userContribs[0]?.user?.name,
        contributions: userContribs,
        purchases: userPurchases,
        ...costBreakdown,
      };
    }
  );

  // Calculate total summary
  const totalSummary: CostBreakdown = users.reduce(
    (total, user) => ({
      totalTokensUsed: total.totalTokensUsed + user.totalTokensUsed,
      totalAmountPaid: total.totalAmountPaid + user.totalAmountPaid,
      totalTrueCost: total.totalTrueCost + user.totalTrueCost,
      averageCostPerKwh: 0, // Will calculate after
      efficiency: 0, // Will calculate after
      overpayment: total.overpayment + user.overpayment,
      emergencyPremium: total.emergencyPremium + user.emergencyPremium,
      regularCostPerKwh: 0, // Will calculate after
      emergencyCostPerKwh: 0, // Will calculate after
    }),
    {
      totalTokensUsed: 0,
      totalAmountPaid: 0,
      totalTrueCost: 0,
      averageCostPerKwh: 0,
      efficiency: 0,
      overpayment: 0,
      emergencyPremium: 0,
      regularCostPerKwh: 0,
      emergencyCostPerKwh: 0,
    }
  );

  // Finalize total summary calculations
  totalSummary.averageCostPerKwh =
    totalSummary.totalTokensUsed > 0
      ? totalSummary.totalTrueCost / totalSummary.totalTokensUsed
      : 0;

  totalSummary.efficiency =
    totalSummary.totalTrueCost > 0
      ? (totalSummary.totalTrueCost / totalSummary.totalAmountPaid) * 100
      : 0;

  // Calculate emergency purchase impact
  const regularPurchases = filteredPurchases.filter((p) => !p.isEmergency);
  const emergencyPurchases = filteredPurchases.filter((p) => p.isEmergency);

  const averageRegularRate =
    regularPurchases.length > 0
      ? regularPurchases.reduce((sum, p) => sum + calculateCostPerKwh(p), 0) /
        regularPurchases.length
      : 0;

  const averageEmergencyRate =
    emergencyPurchases.length > 0
      ? emergencyPurchases.reduce((sum, p) => sum + calculateCostPerKwh(p), 0) /
        emergencyPurchases.length
      : 0;

  const emergencyTokensUsed = filteredContributions
    .filter((c) => c.purchase?.isEmergency)
    .reduce((sum, c) => sum + c.tokensConsumed, 0);

  const additionalCostDueToEmergency =
    emergencyTokensUsed > 0 && averageRegularRate > 0
      ? emergencyTokensUsed * (averageEmergencyRate - averageRegularRate)
      : 0;

  const percentageIncrease =
    averageRegularRate > 0
      ? ((averageEmergencyRate - averageRegularRate) / averageRegularRate) * 100
      : 0;

  return {
    period: {
      start: startDate || new Date(0),
      end: endDate || new Date(),
    },
    users,
    totalSummary,
    emergencyPurchaseImpact: {
      regularPurchases: regularPurchases.length,
      emergencyPurchases: emergencyPurchases.length,
      additionalCostDueToEmergency: round2(additionalCostDueToEmergency),
      percentageIncrease: round2(percentageIncrease),
    },
  };
}

/**
 * Calculate optimal contribution amount for fair cost sharing
 */
export function calculateOptimalContribution(
  tokensConsumed: number,
  purchase: Purchase,
  includeEmergencyPenalty: boolean = true
): {
  baseContribution: number;
  emergencyPenalty: number;
  totalOptimalContribution: number;
  costPerKwh: number;
} {
  const costPerKwh = calculateCostPerKwh(purchase);
  const baseContribution = calculateProportionalCost(
    tokensConsumed,
    purchase.totalTokens,
    purchase.totalPayment
  );

  let emergencyPenalty = 0;
  if (purchase.isEmergency && includeEmergencyPenalty) {
    // Emergency penalty could be a percentage increase
    // This is configurable based on business rules
    emergencyPenalty = baseContribution * 0.1; // 10% penalty for emergency purchases
  }

  const totalOptimalContribution = baseContribution + emergencyPenalty;

  return {
    baseContribution: round2(baseContribution),
    emergencyPenalty: round2(emergencyPenalty),
    totalOptimalContribution: round2(totalOptimalContribution),
    costPerKwh: round2(costPerKwh),
  };
}

/**
 * Detect and calculate costs for overlapping purchase periods
 */
export function calculateOverlappingPurchaseCosts(
  purchases: Purchase[],
  contributions: Contribution[]
): {
  overlappingPeriods: {
    purchases: Purchase[];
    contributions: Contribution[];
    blendedCostPerKwh: number;
    totalCost: number;
    totalTokens: number;
  }[];
  nonOverlappingCosts: CostBreakdown;
} {
  // For now, implement a simplified version
  // In a real scenario, you'd need to define what constitutes "overlapping periods"
  // This could be based on actual consumption dates, purchase dates, or billing periods

  const overlappingPeriods: {
    purchases: Purchase[];
    contributions: Contribution[];
    blendedCostPerKwh: number;
    totalCost: number;
    totalTokens: number;
  }[] = []; // Simplified for now

  // Calculate costs for all contributions as non-overlapping for now
  const nonOverlappingCosts = calculateUserTrueCost(contributions);

  return {
    overlappingPeriods,
    nonOverlappingCosts,
  };
}

/**
 * Generate cost efficiency recommendations
 */
export function generateCostRecommendations(userSummary: UserCostSummary): {
  recommendations: string[];
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  potentialSavings: number;
} {
  const recommendations: string[] = [];
  let efficiency: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  let potentialSavings = 0;

  // Analyze efficiency
  if (userSummary.efficiency >= 95) {
    efficiency = 'excellent';
    recommendations.push(
      'You are paying very close to your true usage cost. Great job!'
    );
  } else if (userSummary.efficiency >= 85) {
    efficiency = 'good';
    recommendations.push(
      'Your payments are reasonably aligned with your usage.'
    );
  } else if (userSummary.efficiency >= 70) {
    efficiency = 'fair';
    recommendations.push(
      'Consider adjusting your contribution amounts to better match your usage.'
    );
    potentialSavings = Math.abs(userSummary.overpayment) * 0.5;
  } else {
    efficiency = 'poor';
    recommendations.push(
      'Your payments are significantly misaligned with your actual usage.'
    );
    potentialSavings = Math.abs(userSummary.overpayment) * 0.8;
  }

  // Emergency purchase recommendations
  if (userSummary.emergencyPremium > 0) {
    const emergencyImpact =
      (userSummary.emergencyPremium / userSummary.totalTrueCost) * 100;
    if (emergencyImpact > 20) {
      recommendations.push(
        `Emergency purchases increased your costs by ${emergencyImpact.toFixed(1)}%. Consider planning ahead to avoid emergency rates.`
      );
    }
  }

  // Overpayment/underpayment recommendations
  if (userSummary.overpayment > userSummary.totalTrueCost * 0.1) {
    recommendations.push(
      `You are overpaying by $${userSummary.overpayment.toFixed(2)}. Consider reducing your contribution amounts.`
    );
  } else if (userSummary.overpayment < -userSummary.totalTrueCost * 0.1) {
    recommendations.push(
      `You are underpaying by $${Math.abs(userSummary.overpayment).toFixed(2)}. Consider increasing your contribution amounts.`
    );
  }

  return {
    recommendations,
    efficiency,
    potentialSavings: round2(potentialSavings),
  };
}
