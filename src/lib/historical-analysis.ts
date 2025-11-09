/**
 * Historical Analysis Module
 * 
 * Provides statistical analysis of historical receipt data to identify pricing patterns,
 * trends, and anomalies in ZWG electricity costs over time. This module helps users:
 * - Track price changes month-over-month
 * - Detect unusual pricing (spikes or drops)
 * - Identify seasonal patterns
 * - Compare ZWG vs USD costs
 * - Get actionable recommendations for optimal purchase timing
 * 
 * @module historical-analysis
 */

/**
 * Receipt data point representing a single electricity purchase
 * with both ZWG receipt details and associated USD purchase data
 */
interface ReceiptDataPoint {
  id: string;
  purchaseId: string;
  kwhPurchased: number;
  energyCostZWG: number;
  debtZWG: number;
  reaZWG: number;
  vatZWG: number;
  totalAmountZWG: number;
  transactionDateTime: string;
  purchase: {
    purchaseDate: Date;
    totalPayment: number;
  };
}

/**
 * Price trend data for a specific time period (month or quarter)
 */
interface PriceTrend {
  period: string; // 'month' or 'quarter'
  date: Date;
  avgZWGPerKwh: number; // Average ZWG cost per kWh for this period
  minZWGPerKwh: number; // Lowest ZWG cost per kWh observed
  maxZWGPerKwh: number; // Highest ZWG cost per kWh observed
  totalKwh: number; // Total kWh purchased in this period
  purchaseCount: number; // Number of purchases in this period
}

/**
 * Represents a detected pricing anomaly (unusual spike or drop)
 */
interface Anomaly {
  id: string; // Receipt ID where anomaly was detected
  date: Date; // Purchase date
  zwgPerKwh: number; // Actual ZWG cost per kWh
  deviation: number; // Percentage deviation from average (positive for spikes, negative for drops)
  type: 'spike' | 'drop'; // Whether this is an unusually high or low price
  severity: 'low' | 'medium' | 'high'; // Based on magnitude of deviation
}

/**
 * Seasonal pricing pattern for a specific month across all years
 */
interface SeasonalPattern {
  month: number; // 0-11 (January = 0, December = 11)
  avgZWGPerKwh: number; // Average ZWG cost per kWh for this month across all years
  purchaseCount: number; // Number of purchases made in this month
  totalKwh: number; // Total kWh purchased in this month across all years
}

/**
 * Complete analysis result containing summary, trends, anomalies, and recommendations
 */
interface AnalysisResult {
  summary: {
    totalReceipts: number;
    dateRange: { start: Date; end: Date } | null;
    avgZWGPerKwh: number;
    minZWGPerKwh: number;
    maxZWGPerKwh: number;
    totalKwhPurchased: number;
    totalZWGSpent: number;
    avgUSDPerKwh: number;
    impliedExchangeRate: number;
  };
  trends: {
    overall: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number; // comparing first to last quarter
    monthlyTrends: PriceTrend[];
  };
  anomalies: Anomaly[];
  seasonal: SeasonalPattern[];
  recommendations: string[];
  variance: {
    usdVsZwg: number; // how much more/less in USD terms
    overpaymentPercentage: number;
  };
}

/**
 * Calculate ZWG cost per kilowatt-hour for a single receipt
 * 
 * @param receipt - Receipt data point with kWh and ZWG amount
 * @returns ZWG cost per kWh, or 0 if kWh is 0 (to avoid division by zero)
 */
function calculateZWGPerKwh(receipt: ReceiptDataPoint): number {
  if (receipt.kwhPurchased === 0) return 0;
  return receipt.totalAmountZWG / receipt.kwhPurchased;
}

/**
 * Calculate USD cost per kilowatt-hour for a single receipt
 * 
 * @param receipt - Receipt data point with kWh and USD payment
 * @returns USD cost per kWh, or 0 if kWh is 0 (to avoid division by zero)
 */
function calculateUSDPerKwh(receipt: ReceiptDataPoint): number {
  if (receipt.kwhPurchased === 0) return 0;
  return receipt.purchase.totalPayment / receipt.kwhPurchased;
}

/**
 * Group receipts by month (YYYY-MM format)
 * 
 * Groups all receipts by their purchase month for trend analysis.
 * Each month is represented by a key like "2025-01", "2025-02", etc.
 * 
 * @param receipts - Array of receipt data points to group
 * @returns Map with month keys (YYYY-MM) and arrays of receipts for each month
 */
function groupByMonth(receipts: ReceiptDataPoint[]): Map<string, ReceiptDataPoint[]> {
  const groups = new Map<string, ReceiptDataPoint[]>();

  receipts.forEach((receipt) => {
    const date = new Date(receipt.purchase.purchaseDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(receipt);
  });

  return groups;
}

/**
 * Analyze price trends over time (monthly aggregation)
 * 
 * Calculates average, min, and max ZWG costs per kWh for each month.
 * Useful for visualizing price changes over time and identifying trending patterns.
 * 
 * Statistical approach:
 * 1. Group all receipts by month
 * 2. For each month, calculate:
 *    - Average rate (mean of all ZWG/kWh values)
 *    - Min rate (lowest ZWG/kWh observed)
 *    - Max rate (highest ZWG/kWh observed)
 *    - Total kWh purchased
 *    - Number of purchases
 * 3. Sort chronologically for trend visualization
 * 
 * @param receipts - Array of historical receipt data
 * @returns Array of PriceTrend objects sorted by date (oldest to newest)
 */
export function analyzePriceTrends(receipts: ReceiptDataPoint[]): PriceTrend[] {
  if (receipts.length === 0) return [];

  const monthlyGroups = groupByMonth(receipts);
  const trends: PriceTrend[] = [];

  monthlyGroups.forEach((monthReceipts) => {
    const rates = monthReceipts.map(calculateZWGPerKwh);
    const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const totalKwh = monthReceipts.reduce((sum, r) => sum + r.kwhPurchased, 0);

    trends.push({
      period: 'month',
      date: new Date(monthReceipts[0].purchase.purchaseDate),
      avgZWGPerKwh: avgRate,
      minZWGPerKwh: minRate,
      maxZWGPerKwh: maxRate,
      totalKwh,
      purchaseCount: monthReceipts.length,
    });
  });

  // Sort by date
  trends.sort((a, b) => a.date.getTime() - b.date.getTime());

  return trends;
}

/**
 * Detect cost anomalies using statistical deviation analysis
 * 
 * Identifies receipts with unusually high (spikes) or low (drops) ZWG costs
 * compared to the user's average. This helps flag potential errors in billing
 * or identify opportunities to purchase when rates are favorable.
 * 
 * Algorithm:
 * 1. Calculate average ZWG/kWh across all receipts (baseline)
 * 2. For each receipt, calculate deviation: ((actual - average) / average) × 100
 * 3. Flag as anomaly if deviation exceeds ±20% threshold
 * 4. Classify severity:
 *    - Low: 20-30% deviation
 *    - Medium: 30-40% deviation
 *    - High: >40% deviation
 * 
 * Minimum data requirement: 3 receipts (statistical validity)
 * 
 * @param receipts - Array of historical receipt data
 * @returns Array of detected anomalies sorted by severity
 */
export function detectAnomalies(receipts: ReceiptDataPoint[]): Anomaly[] {
  if (receipts.length < 3) return []; // Need minimum data for statistical analysis

  const rates = receipts.map(calculateZWGPerKwh);
  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const anomalies: Anomaly[] = [];

  receipts.forEach((receipt) => {
    const rate = calculateZWGPerKwh(receipt);
    const deviation = ((rate - avgRate) / avgRate) * 100;

    // Detect spikes (>20% above average) - potentially overpriced purchases
    if (deviation > 20) {
      anomalies.push({
        id: receipt.id,
        date: new Date(receipt.purchase.purchaseDate),
        zwgPerKwh: rate,
        deviation,
        type: 'spike',
        severity: deviation > 40 ? 'high' : deviation > 30 ? 'medium' : 'low',
      });
    }

    // Detect drops (>20% below average) - favorable purchase opportunities
    if (deviation < -20) {
      anomalies.push({
        id: receipt.id,
        date: new Date(receipt.purchase.purchaseDate),
        zwgPerKwh: rate,
        deviation,
        type: 'drop',
        severity: deviation < -40 ? 'high' : deviation < -30 ? 'medium' : 'low',
      });
    }
  });

  return anomalies;
}

/**
 * Calculate seasonal pricing patterns across all years
 * 
 * Identifies if certain months consistently have higher or lower electricity rates.
 * For example, winter months might have higher rates due to increased demand.
 * 
 * Process:
 * 1. Group receipts by calendar month (0-11) across all years
 * 2. Calculate average ZWG/kWh for each month
 * 3. Aggregate total kWh and purchase counts
 * 
 * Minimum data requirement: 12 receipts (at least one per month for meaningful patterns)
 * 
 * @param receipts - Array of historical receipt data
 * @returns Array of seasonal patterns sorted by month (January to December)
 */
export function calculateSeasonalPatterns(receipts: ReceiptDataPoint[]): SeasonalPattern[] {
  if (receipts.length < 12) return []; // Need at least one year of data for seasonal analysis

  const monthlyData = new Map<number, { rates: number[]; kwh: number[] }>();

  // Initialize all months
  for (let i = 0; i < 12; i++) {
    monthlyData.set(i, { rates: [], kwh: [] });
  }

  // Group by month (0-11)
  receipts.forEach((receipt) => {
    const month = new Date(receipt.purchase.purchaseDate).getMonth();
    const rate = calculateZWGPerKwh(receipt);
    const data = monthlyData.get(month)!;
    data.rates.push(rate);
    data.kwh.push(receipt.kwhPurchased);
  });

  // Calculate averages
  const patterns: SeasonalPattern[] = [];
  monthlyData.forEach((data, month) => {
    if (data.rates.length > 0) {
      const avgRate = data.rates.reduce((sum, r) => sum + r, 0) / data.rates.length;
      const totalKwh = data.kwh.reduce((sum, k) => sum + k, 0);

      patterns.push({
        month,
        avgZWGPerKwh: avgRate,
        purchaseCount: data.rates.length,
        totalKwh,
      });
    }
  });

  return patterns.sort((a, b) => a.month - b.month);
}

/**
 * Generate actionable recommendations based on analysis results
 * 
 * Provides user-friendly insights and purchase timing advice based on:
 * - Recent price trends (increasing vs decreasing)
 * - Current rate compared to historical average
 * - Recent anomalies (unusual pricing)
 * 
 * Recommendation logic:
 * - Rising rates (>10% increase): Warn user, suggest buying during dips
 * - Falling rates (>10% decrease): Encourage purchases
 * - Current rate >15% above average: Suggest waiting for better rates
 * - Current rate >15% below average: Highlight as optimal purchase time
 * - Recent high-severity anomalies: Alert user to review purchases
 * 
 * @param trends - Monthly price trend data
 * @param anomalies - Detected pricing anomalies
 * @param avgRate - Overall average ZWG cost per kWh
 * @returns Array of recommendation strings with emoji indicators
 */
export function generateRecommendations(
  trends: PriceTrend[],
  anomalies: Anomaly[],
  avgRate: number
): string[] {
  const recommendations: string[] = [];

  // Trend-based recommendations
  if (trends.length >= 2) {
    const recent = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    const changePercent = ((recent.avgZWGPerKwh - previous.avgZWGPerKwh) / previous.avgZWGPerKwh) * 100;

    if (changePercent > 10) {
      recommendations.push(
        `⚠️ Electricity rates are rising (${changePercent.toFixed(1)}% increase). Consider purchasing larger amounts when rates are lower.`
      );
    } else if (changePercent < -10) {
      recommendations.push(
        `✅ Electricity rates are decreasing (${Math.abs(changePercent).toFixed(1)}% drop). Good time to purchase tokens.`
      );
    }

    if (recent.avgZWGPerKwh > avgRate * 1.15) {
      recommendations.push(
        `💡 Current rate (${recent.avgZWGPerKwh.toFixed(2)} ZWG/kWh) is 15%+ above your average. Wait for better rates if possible.`
      );
    } else if (recent.avgZWGPerKwh < avgRate * 0.85) {
      recommendations.push(
        `🎯 Current rate (${recent.avgZWGPerKwh.toFixed(2)} ZWG/kWh) is 15%+ below your average. Excellent time to purchase!`
      );
    }
  }

  // Anomaly-based recommendations
  const recentAnomalies = anomalies.filter((a) => {
    const daysSince = (Date.now() - a.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30; // Look at anomalies in last 30 days
  });

  if (recentAnomalies.length > 0) {
    const highSeverity = recentAnomalies.filter((a) => a.severity === 'high');
    if (highSeverity.length > 0) {
      recommendations.push(
        `🚨 ${highSeverity.length} unusual price ${highSeverity.length === 1 ? 'spike' : 'spikes'} detected in the last 30 days. Review your recent purchases.`
      );
    }
  }

  // General recommendations
  if (trends.length === 0) {
    recommendations.push(
      '📊 Import more historical receipts to get personalized insights and recommendations.'
    );
  }

  return recommendations;
}

/**
 * Main analysis function - comprehensive historical receipt analysis
 * 
 * Performs complete statistical analysis of historical receipt data including:
 * - Summary statistics (averages, totals, date ranges)
 * - Price trend analysis (month-over-month changes)
 * - Anomaly detection (unusual pricing)
 * - Seasonal pattern identification
 * - USD vs ZWG variance calculation
 * - Actionable recommendations
 * 
 * This is the primary entry point for the historical analysis module.
 * 
 * Data requirements:
 * - Minimum 1 receipt for basic summary (but recommendations will be limited)
 * - Minimum 3 receipts for anomaly detection
 * - Minimum 12 receipts for seasonal pattern analysis
 * 
 * Algorithm overview:
 * 1. Calculate summary statistics (averages, totals, implied exchange rate)
 * 2. Perform monthly trend analysis
 * 3. Detect pricing anomalies using statistical deviation
 * 4. Calculate seasonal patterns if sufficient data
 * 5. Compute USD vs ZWG variance (potential overpayment)
 * 6. Generate personalized recommendations
 * 
 * @param receipts - Array of receipt data points to analyze
 * @returns Complete AnalysisResult with all insights and recommendations
 */
export function analyzeHistoricalReceipts(receipts: ReceiptDataPoint[]): AnalysisResult {
  if (receipts.length === 0) {
    return {
      summary: {
        totalReceipts: 0,
        dateRange: null,
        avgZWGPerKwh: 0,
        minZWGPerKwh: 0,
        maxZWGPerKwh: 0,
        totalKwhPurchased: 0,
        totalZWGSpent: 0,
        avgUSDPerKwh: 0,
        impliedExchangeRate: 0,
      },
      trends: {
        overall: 'stable',
        percentageChange: 0,
        monthlyTrends: [],
      },
      anomalies: [],
      seasonal: [],
      recommendations: [
        '📊 No receipt data available. Import your historical receipts to get insights.',
      ],
      variance: {
        usdVsZwg: 0,
        overpaymentPercentage: 0,
      },
    };
  }

  // Calculate summary statistics
  const zwgRates = receipts.map(calculateZWGPerKwh);
  const usdRates = receipts.map(calculateUSDPerKwh);
  const avgZWGPerKwh = zwgRates.reduce((sum, r) => sum + r, 0) / zwgRates.length;
  const avgUSDPerKwh = usdRates.reduce((sum, r) => sum + r, 0) / usdRates.length;
  const totalKwh = receipts.reduce((sum, r) => sum + r.kwhPurchased, 0);
  const totalZWG = receipts.reduce((sum, r) => sum + r.totalAmountZWG, 0);
  const totalUSD = receipts.reduce((sum, r) => sum + r.purchase.totalPayment, 0);
  const impliedExchangeRate = totalUSD > 0 ? totalZWG / totalUSD : 0;

  const dates = receipts.map((r) => new Date(r.purchase.purchaseDate));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Analyze trends
  const monthlyTrends = analyzePriceTrends(receipts);
  let overall: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let percentageChange = 0;

  // Compare first quarter vs last quarter to determine overall trend direction
  if (monthlyTrends.length >= 2) {
    const firstQuarter = monthlyTrends.slice(0, Math.min(3, monthlyTrends.length));
    const lastQuarter = monthlyTrends.slice(-Math.min(3, monthlyTrends.length));

    const firstAvg =
      firstQuarter.reduce((sum, t) => sum + t.avgZWGPerKwh, 0) / firstQuarter.length;
    const lastAvg =
      lastQuarter.reduce((sum, t) => sum + t.avgZWGPerKwh, 0) / lastQuarter.length;

    percentageChange = ((lastAvg - firstAvg) / firstAvg) * 100;

    // Classify trend: >5% change is significant
    if (percentageChange > 5) overall = 'increasing';
    else if (percentageChange < -5) overall = 'decreasing';
  }

  // Detect anomalies
  const anomalies = detectAnomalies(receipts);

  // Calculate seasonal patterns
  const seasonal = calculateSeasonalPatterns(receipts);

  // Calculate variance (potential overpayment analysis)
  // If user paid more in USD than the ZWG value suggests (at implied exchange rate),
  // they may have overpaid. Negative variance means they got a good deal.
  const zwgInUSD = totalZWG / impliedExchangeRate;
  const variance = totalUSD - zwgInUSD;
  const overpaymentPercentage = zwgInUSD > 0 ? (variance / zwgInUSD) * 100 : 0;

  // Generate recommendations
  const recommendations = generateRecommendations(monthlyTrends, anomalies, avgZWGPerKwh);

  return {
    summary: {
      totalReceipts: receipts.length,
      dateRange: { start: minDate, end: maxDate },
      avgZWGPerKwh,
      minZWGPerKwh: Math.min(...zwgRates),
      maxZWGPerKwh: Math.max(...zwgRates),
      totalKwhPurchased: totalKwh,
      totalZWGSpent: totalZWG,
      avgUSDPerKwh,
      impliedExchangeRate,
    },
    trends: {
      overall,
      percentageChange,
      monthlyTrends,
    },
    anomalies,
    seasonal,
    recommendations,
    variance: {
      usdVsZwg: variance,
      overpaymentPercentage,
    },
  };
}
