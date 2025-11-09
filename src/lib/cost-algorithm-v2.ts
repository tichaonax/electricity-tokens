/**
 * Cost Algorithm V2: Dual-Currency Support
 * 
 * Extends the original cost calculation engine to support both USD (internal payments)
 * and ZWG (official receipt data) for accurate cost tracking and analysis.
 * 
 * Key Features:
 * - Dual-currency cost calculations (USD vs ZWG)
 * - Exchange rate detection from purchase/receipt pairs
 * - Cost comparison and variance analysis
 * - Historical pricing trends and forecasting
 * - Currency-specific overpayment/underpayment tracking
 */

// Helper function to round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;

// Helper function to round to 4 decimal places (for rates)
const round4 = (num: number): number => Math.round(num * 10000) / 10000;

export interface PurchaseWithReceipt {
  id: string;
  totalTokens: number; // kWh units
  totalPayment: number; // USD amount paid
  purchaseDate: Date | string;
  isEmergency: boolean;
  receiptData?: {
    id: string;
    kwhPurchased: number; // kWh from official receipt
    energyCostZWG: number;
    debtZWG: number;
    reaZWG: number; // Regulatory levy
    vatZWG: number;
    totalAmountZWG: number; // Total ZWG cost
    transactionDateTime: Date | string;
    tokenNumber?: string;
    accountNumber?: string;
  } | null;
}

export interface DualCurrencyCostBreakdown {
  // USD metrics (internal)
  usd: {
    totalPaid: number;
    costPerKwh: number;
    trueCost: number; // Proportional cost based on usage
  };
  // ZWG metrics (official)
  zwg: {
    totalCost: number;
    costPerKwh: number;
    energyCost: number;
    debt: number;
    rea: number;
    vat: number;
  };
  // Exchange rate
  impliedExchangeRate: number; // ZWG per 1 USD
  // Tokens
  tokensConsumed: number;
  // Variance analysis
  variance: {
    absolute: number; // USD paid - USD equivalent of ZWG cost
    percentage: number; // (variance / USD paid) * 100
    direction: 'overpaid' | 'underpaid' | 'exact';
  };
}

export interface DualCurrencyUserSummary {
  userId: string;
  userName?: string;
  totalTokensUsed: number;
  
  // USD summary
  usd: {
    totalPaid: number;
    averageCostPerKwh: number;
    accountBalance: number; // Running balance
  };
  
  // ZWG summary (from official receipts)
  zwg: {
    totalTrueCost: number;
    averageCostPerKwh: number;
    breakdown: {
      totalEnergyCost: number;
      totalDebt: number;
      totalREA: number;
      totalVAT: number;
    };
  };
  
  // Exchange rate tracking
  averageExchangeRate: number;
  exchangeRateTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Variance
  costVariance: {
    absoluteUSD: number;
    percentageDeviation: number;
    effectiveRate: number; // Actual USD per kWh vs official ZWG per kWh
  };
  
  // Data completeness
  receiptsAvailable: number;
  totalPurchases: number;
  completeness: number; // Percentage of purchases with receipt data
}

export interface ForecastResult {
  predictedZWGPerKwh: number;
  predictedUSDEquivalent: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  trendDirection: 'rising' | 'falling' | 'stable';
  basedOnDataPoints: number;
  forecastPeriod: string;
}

export interface PricingTrend {
  date: Date;
  zwgPerKwh: number;
  usdPerKwh: number;
  exchangeRate: number;
  kwhPurchased: number;
}

/**
 * Calculate cost per kWh in ZWG from receipt data
 */
export function calculateZWGCostPerKwh(receipt: {
  totalAmountZWG: number;
  kwhPurchased: number;
}): number {
  if (receipt.kwhPurchased <= 0) return 0;
  return round4(receipt.totalAmountZWG / receipt.kwhPurchased);
}

/**
 * Calculate implied exchange rate from purchase data
 * Returns ZWG per 1 USD
 */
export function calculateImpliedExchangeRate(
  usdPaid: number,
  zwgTotal: number
): number {
  if (usdPaid <= 0) return 0;
  return round4(zwgTotal / usdPaid);
}

/**
 * Convert ZWG to USD using exchange rate
 */
export function convertZWGToUSD(
  zwgAmount: number,
  exchangeRate: number
): number {
  if (exchangeRate <= 0) return 0;
  return round2(zwgAmount / exchangeRate);
}

/**
 * Convert USD to ZWG using exchange rate
 */
export function convertUSDToZWG(
  usdAmount: number,
  exchangeRate: number
): number {
  return round2(usdAmount * exchangeRate);
}

/**
 * Calculate dual-currency cost breakdown for a purchase with receipt data
 */
export function calculateDualCurrencyCost(
  purchase: PurchaseWithReceipt,
  tokensConsumed: number
): DualCurrencyCostBreakdown | null {
  if (!purchase.receiptData) {
    return null; // No receipt data available
  }

  const receipt = purchase.receiptData;

  // USD calculations (internal payment)
  const usdCostPerKwh = purchase.totalPayment / purchase.totalTokens;
  const usdTrueCost = (tokensConsumed / purchase.totalTokens) * purchase.totalPayment;

  // ZWG calculations (official receipt)
  const zwgCostPerKwh = calculateZWGCostPerKwh(receipt);
  const zwgProportionalCost = (tokensConsumed / receipt.kwhPurchased) * receipt.totalAmountZWG;

  // Energy breakdown (proportional)
  const energyCost = (tokensConsumed / receipt.kwhPurchased) * receipt.energyCostZWG;
  const debt = (tokensConsumed / receipt.kwhPurchased) * receipt.debtZWG;
  const rea = (tokensConsumed / receipt.kwhPurchased) * receipt.reaZWG;
  const vat = (tokensConsumed / receipt.kwhPurchased) * receipt.vatZWG;

  // Exchange rate
  const impliedExchangeRate = calculateImpliedExchangeRate(
    purchase.totalPayment,
    receipt.totalAmountZWG
  );

  // Convert ZWG cost to USD for comparison
  const zwgCostInUSD = convertZWGToUSD(zwgProportionalCost, impliedExchangeRate);

  // Variance analysis
  const varianceAbsolute = usdTrueCost - zwgCostInUSD;
  const variancePercentage = (varianceAbsolute / usdTrueCost) * 100;
  
  let direction: 'overpaid' | 'underpaid' | 'exact' = 'exact';
  if (varianceAbsolute > 0.01) direction = 'overpaid';
  else if (varianceAbsolute < -0.01) direction = 'underpaid';

  return {
    usd: {
      totalPaid: round2(usdTrueCost),
      costPerKwh: round4(usdCostPerKwh),
      trueCost: round2(usdTrueCost),
    },
    zwg: {
      totalCost: round2(zwgProportionalCost),
      costPerKwh: round4(zwgCostPerKwh),
      energyCost: round2(energyCost),
      debt: round2(debt),
      rea: round2(rea),
      vat: round2(vat),
    },
    impliedExchangeRate,
    tokensConsumed: round2(tokensConsumed),
    variance: {
      absolute: round2(varianceAbsolute),
      percentage: round2(variancePercentage),
      direction,
    },
  };
}

/**
 * Calculate comprehensive dual-currency summary for a user
 */
export function calculateDualCurrencyUserSummary(
  contributions: Array<{
    id: string;
    userId: string;
    contributionAmount: number;
    tokensConsumed: number;
    purchase: PurchaseWithReceipt;
  }>
): DualCurrencyUserSummary {
  if (contributions.length === 0) {
    return {
      userId: '',
      totalTokensUsed: 0,
      usd: { totalPaid: 0, averageCostPerKwh: 0, accountBalance: 0 },
      zwg: {
        totalTrueCost: 0,
        averageCostPerKwh: 0,
        breakdown: {
          totalEnergyCost: 0,
          totalDebt: 0,
          totalREA: 0,
          totalVAT: 0,
        },
      },
      averageExchangeRate: 0,
      exchangeRateTrend: 'stable',
      costVariance: {
        absoluteUSD: 0,
        percentageDeviation: 0,
        effectiveRate: 0,
      },
      receiptsAvailable: 0,
      totalPurchases: contributions.length,
      completeness: 0,
    };
  }

  const userId = contributions[0].userId;
  const userName = contributions[0].purchase?.receiptData ? undefined : undefined;

  let totalTokensUsed = 0;
  let totalUSDPaid = 0;
  let totalZWGCost = 0;
  let totalEnergyCost = 0;
  let totalDebt = 0;
  let totalREA = 0;
  let totalVAT = 0;
  let receiptsAvailable = 0;
  const exchangeRates: number[] = [];

  contributions.forEach((contribution) => {
    totalTokensUsed += contribution.tokensConsumed;
    totalUSDPaid += contribution.contributionAmount;

    const dualCost = calculateDualCurrencyCost(
      contribution.purchase,
      contribution.tokensConsumed
    );

    if (dualCost) {
      receiptsAvailable++;
      totalZWGCost += dualCost.zwg.totalCost;
      totalEnergyCost += dualCost.zwg.energyCost;
      totalDebt += dualCost.zwg.debt;
      totalREA += dualCost.zwg.rea;
      totalVAT += dualCost.zwg.vat;
      exchangeRates.push(dualCost.impliedExchangeRate);
    }
  });

  const averageExchangeRate =
    exchangeRates.length > 0
      ? exchangeRates.reduce((sum, rate) => sum + rate, 0) / exchangeRates.length
      : 0;

  // Detect exchange rate trend
  let exchangeRateTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (exchangeRates.length >= 3) {
    const firstHalf = exchangeRates.slice(0, Math.floor(exchangeRates.length / 2));
    const secondHalf = exchangeRates.slice(Math.floor(exchangeRates.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;
    
    const changePct = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (changePct > 5) exchangeRateTrend = 'increasing';
    else if (changePct < -5) exchangeRateTrend = 'decreasing';
  }

  const usdAverageCostPerKwh = totalTokensUsed > 0 ? totalUSDPaid / totalTokensUsed : 0;
  const zwgAverageCostPerKwh = totalTokensUsed > 0 ? totalZWGCost / totalTokensUsed : 0;

  // Convert ZWG average cost to USD for comparison
  const zwgCostInUSD = convertZWGToUSD(totalZWGCost, averageExchangeRate);
  const accountBalance = totalUSDPaid - zwgCostInUSD;
  const costVarianceAbsolute = accountBalance;
  const costVariancePercentage =
    totalUSDPaid > 0 ? (costVarianceAbsolute / totalUSDPaid) * 100 : 0;

  const effectiveRate = totalTokensUsed > 0 ? zwgCostInUSD / totalTokensUsed : 0;

  const completeness = contributions.length > 0
    ? (receiptsAvailable / contributions.length) * 100
    : 0;

  return {
    userId,
    userName,
    totalTokensUsed: round2(totalTokensUsed),
    usd: {
      totalPaid: round2(totalUSDPaid),
      averageCostPerKwh: round4(usdAverageCostPerKwh),
      accountBalance: round2(accountBalance),
    },
    zwg: {
      totalTrueCost: round2(totalZWGCost),
      averageCostPerKwh: round4(zwgAverageCostPerKwh),
      breakdown: {
        totalEnergyCost: round2(totalEnergyCost),
        totalDebt: round2(totalDebt),
        totalREA: round2(totalREA),
        totalVAT: round2(totalVAT),
      },
    },
    averageExchangeRate: round4(averageExchangeRate),
    exchangeRateTrend,
    costVariance: {
      absoluteUSD: round2(costVarianceAbsolute),
      percentageDeviation: round2(costVariancePercentage),
      effectiveRate: round4(effectiveRate),
    },
    receiptsAvailable,
    totalPurchases: contributions.length,
    completeness: round2(completeness),
  };
}

/**
 * Extract pricing trends from historical purchases with receipts
 */
export function extractPricingTrends(
  purchases: PurchaseWithReceipt[]
): PricingTrend[] {
  const trends: PricingTrend[] = [];

  purchases.forEach((purchase) => {
    if (!purchase.receiptData) return;

    const receipt = purchase.receiptData;
    const zwgPerKwh = calculateZWGCostPerKwh(receipt);
    const usdPerKwh = purchase.totalPayment / purchase.totalTokens;
    const exchangeRate = calculateImpliedExchangeRate(
      purchase.totalPayment,
      receipt.totalAmountZWG
    );

    trends.push({
      date: new Date(purchase.purchaseDate),
      zwgPerKwh: round4(zwgPerKwh),
      usdPerKwh: round4(usdPerKwh),
      exchangeRate: round4(exchangeRate),
      kwhPurchased: round2(receipt.kwhPurchased),
    });
  });

  // Sort by date
  return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Forecast future electricity costs using historical data
 * Uses simple moving average and trend analysis
 */
export function forecastElectricityCosts(
  purchases: PurchaseWithReceipt[],
  forecastDays: number = 30
): ForecastResult {
  const trends = extractPricingTrends(purchases);

  if (trends.length === 0) {
    return {
      predictedZWGPerKwh: 0,
      predictedUSDEquivalent: 0,
      confidenceLevel: 'low',
      trendDirection: 'stable',
      basedOnDataPoints: 0,
      forecastPeriod: `${forecastDays} days`,
    };
  }

  // Calculate moving average for ZWG cost per kWh
  const recentTrends = trends.slice(-6); // Last 6 purchases
  const avgZWGPerKwh =
    recentTrends.reduce((sum, t) => sum + t.zwgPerKwh, 0) / recentTrends.length;

  // Calculate trend direction
  let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
  if (recentTrends.length >= 3) {
    const firstHalf = recentTrends.slice(0, Math.floor(recentTrends.length / 2));
    const secondHalf = recentTrends.slice(Math.floor(recentTrends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + t.zwgPerKwh, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.zwgPerKwh, 0) / secondHalf.length;
    
    const changePct = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (changePct > 10) trendDirection = 'rising';
    else if (changePct < -10) trendDirection = 'falling';
  }

  // Apply trend adjustment for forecast
  let predictedZWGPerKwh = avgZWGPerKwh;
  if (trendDirection === 'rising') {
    predictedZWGPerKwh *= 1.05; // 5% increase assumption
  } else if (trendDirection === 'falling') {
    predictedZWGPerKwh *= 0.95; // 5% decrease assumption
  }

  // Calculate predicted USD equivalent
  const avgExchangeRate =
    recentTrends.reduce((sum, t) => sum + t.exchangeRate, 0) / recentTrends.length;
  const predictedUSDEquivalent = convertZWGToUSD(predictedZWGPerKwh, avgExchangeRate);

  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
  if (trends.length >= 10) confidenceLevel = 'high';
  else if (trends.length >= 5) confidenceLevel = 'medium';

  return {
    predictedZWGPerKwh: round4(predictedZWGPerKwh),
    predictedUSDEquivalent: round4(predictedUSDEquivalent),
    confidenceLevel,
    trendDirection,
    basedOnDataPoints: trends.length,
    forecastPeriod: `${forecastDays} days`,
  };
}

/**
 * Compare USD payments vs ZWG true cost and calculate variance
 */
export function compareUSDvsZWG(
  usdPaid: number,
  zwgTrueCost: number,
  exchangeRate: number
): {
  usdPaid: number;
  zwgTrueCost: number;
  zwgInUSD: number;
  variance: number;
  variancePercentage: number;
  effectiveSavings: number;
  recommendation: string;
} {
  const zwgInUSD = convertZWGToUSD(zwgTrueCost, exchangeRate);
  const variance = usdPaid - zwgInUSD;
  const variancePercentage = (variance / usdPaid) * 100;
  const effectiveSavings = variance > 0 ? variance : 0;

  let recommendation = '';
  if (variance > usdPaid * 0.1) {
    recommendation = 'You are overpaying significantly. Consider reducing contributions.';
  } else if (variance < -usdPaid * 0.1) {
    recommendation = 'You are underpaying. Increase contributions to cover true costs.';
  } else {
    recommendation = 'Your payments are well-aligned with true costs.';
  }

  return {
    usdPaid: round2(usdPaid),
    zwgTrueCost: round2(zwgTrueCost),
    zwgInUSD: round2(zwgInUSD),
    variance: round2(variance),
    variancePercentage: round2(variancePercentage),
    effectiveSavings: round2(effectiveSavings),
    recommendation,
  };
}
