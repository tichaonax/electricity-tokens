/**
 * Historical Receipt Analysis API
 * 
 * Performs comprehensive statistical analysis of all receipt data to identify:
 * - Price trends over time (monthly aggregation)
 * - Cost anomalies (unusual spikes or drops)
 * - Seasonal patterns (certain months consistently higher/lower)
 * - USD vs ZWG variance (potential overpayment)
 * - Actionable recommendations for optimal purchase timing
 * 
 * Uses the historical-analysis.ts module for statistical calculations.
 * Analysis includes trend detection, anomaly identification, and personalized insights.
 * 
 * @module api/receipt-data/analyze-historical
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeHistoricalReceipts } from '@/lib/historical-analysis';

/**
 * GET /api/receipt-data/analyze-historical
 * 
 * Analyzes ALL receipt data for the user to generate comprehensive insights.
 * 
 * No query parameters required - analyzes entire receipt history.
 * 
 * Analysis Components:
 * 1. Summary Statistics:
 *    - Total receipts, date range
 *    - Average/min/max ZWG per kWh
 *    - Total kWh purchased and ZWG spent
 *    - Average USD per kWh and implied exchange rate
 * 
 * 2. Price Trends:
 *    - Monthly aggregation of ZWG costs per kWh
 *    - Overall trend direction (increasing/decreasing/stable)
 *    - Percentage change comparing first quarter to last quarter
 * 
 * 3. Anomaly Detection:
 *    - Identifies receipts with >20% deviation from average
 *    - Classifies as spikes (overpriced) or drops (good deals)
 *    - Severity levels: low (20-30%), medium (30-40%), high (>40%)
 * 
 * 4. Seasonal Patterns:
 *    - Average ZWG per kWh for each calendar month
 *    - Requires minimum 12 receipts for statistical validity
 *    - Identifies months with consistently higher/lower rates
 * 
 * 5. Variance Analysis:
 *    - Compares total USD paid vs ZWG value at implied exchange rate
 *    - Calculates potential overpayment percentage
 *    - Helps identify if user is getting fair exchange rates
 * 
 * 6. Recommendations:
 *    - Rising/falling rate alerts
 *    - Current rate vs average comparison
 *    - Recent anomaly warnings
 *    - Purchase timing suggestions
 * 
 * Authorization:
 * - Requires authenticated user
 * - Regular users: Analyzes only their own receipts
 * - Admin users: Analyzes all receipts in system
 * 
 * Data Requirements:
 * - Minimum 1 receipt: Basic summary (limited insights)
 * - Minimum 3 receipts: Anomaly detection enabled
 * - Minimum 12 receipts: Seasonal pattern analysis enabled
 * 
 * @returns 200: Complete analysis result with insights
 * @returns 401: Unauthorized (not logged in)
 * @returns 500: Server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all receipts for the user (or all if admin)
    const receipts = await prisma.receiptData.findMany({
      where:
        session.user.role === 'admin'
          ? {}
          : {
              purchase: {
                user: {
                  id: session.user.id,
                },
              },
            },
      include: {
        purchase: {
          select: {
            purchaseDate: true,
            totalPayment: true,
          },
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc',
        },
      },
    });

    // Convert to analysis format
    const receiptData = receipts.map((r) => ({
      ...r,
      transactionDateTime: r.transactionDateTime.toISOString(),
    }));

    // Analyze the data
    const analysis = analyzeHistoricalReceipts(receiptData);

    return NextResponse.json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Historical analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze historical data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
