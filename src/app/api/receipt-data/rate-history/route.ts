/**
 * Exchange Rate History API
 * 
 * Provides chronological history of ZWG/USD exchange rates based on actual purchases.
 * Shows implied exchange rates from purchase transactions along with percentage changes.
 * 
 * Useful for:
 * - Tracking exchange rate volatility over time
 * - Identifying rate increase/decrease trends
 * - Spotting unusually high or low rates
 * - Making informed decisions about purchase timing
 * 
 * @module api/receipt-data/rate-history
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/receipt-data/rate-history
 * 
 * Fetch chronological exchange rate history with percentage changes.
 * 
 * Query Parameters:
 * - limit (optional): Maximum number of entries to return (default: 50, max: 500)
 * - userId (optional, admin only): Filter by specific user
 * 
 * Calculation Method:
 * For each purchase with receipt data:
 * 1. ZWG/USD Rate = totalAmountZWG / totalPaymentUSD
 *    - Shows effective exchange rate at time of purchase
 *    - Example: 5000 ZWG / 1 USD = 5000 ZWG/USD rate
 * 
 * 2. ZWG per kWh = totalAmountZWG / totalTokensKwh
 *    - Shows ZWG cost per kilowatt-hour
 * 
 * 3. USD per kWh = totalPaymentUSD / totalTokensKwh
 *    - Shows USD cost per kilowatt-hour
 * 
 * 4. Change Percent = ((current_rate - previous_rate) / previous_rate) × 100
 *    - Positive: Rate increased (ZWG weakened, USD strengthened)
 *    - Negative: Rate decreased (ZWG strengthened, USD weakened)
 *    - Calculated chronologically from oldest to newest purchase
 * 
 * Returns (newest first):
 * - Array of rate history entries with dates and calculations
 * - Summary statistics: avg/min/max rates, avg ZWG per kWh
 * 
 * Authorization:
 * - Requires authenticated user
 * - Regular users: See only their own rate history
 * - Admin users: Can filter by userId or see all users
 * 
 * @returns 200: Rate history with summary statistics
 * @returns 401: Unauthorized (not logged in)
 * @returns 500: Server error
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    // Permissions-based filtering
    const userPermissions = (session.user.permissions || null) as Record<string, unknown> | null;
    const canViewAllReceipts =
      session.user.role === 'ADMIN' ||
      userPermissions?.canViewUsageReports === true ||
      userPermissions?.canViewFinancialReports === true ||
      userPermissions?.canViewEfficiencyReports === true ||
      userPermissions?.canViewDualCurrencyAnalysis === true ||
      userPermissions?.canViewCostAnalysis === true;

    if (!canViewAllReceipts) {
      // Non-privileged users only see their own data
      whereClause.user = { id: session.user.id };
    } else if (userId) {
      // Privileged users (admins or permissioned) can filter by userId
      whereClause.user = { id: userId };
    }

    // Fetch purchases with receipt data
    const purchases = await prisma.tokenPurchase.findMany({
      where: whereClause,
      include: {
        receiptData: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
      take: limit,
    });

    // Filter purchases that have receipt data
    const purchasesWithReceipts = purchases.filter((p) => p.receiptData !== null);

    if (purchasesWithReceipts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No receipt data found'
      });
    }

    // Calculate rate history with percentage changes
    // Process in descending order (newest first) but calculate changes chronologically
    const rateHistory = purchasesWithReceipts.map((purchase, index) => {
      const receipt = purchase.receiptData!;
      
      // Implied ZWG/USD exchange rate for this transaction
      const zwgRate = receipt.totalAmountZWG / purchase.totalPayment;
      
      // Cost per kWh in both currencies
      const zwgPerKwh = receipt.totalAmountZWG / purchase.totalTokens;
      const usdPerKwh = purchase.totalPayment / purchase.totalTokens;

      // Calculate percentage change from previous purchase (chronologically)
      // Note: Array is in descending order, so index+1 is the previous (older) purchase
      let changePercent = 0;
      if (index < purchasesWithReceipts.length - 1) {
        const prevPurchase = purchasesWithReceipts[index + 1];
        const prevReceipt = prevPurchase.receiptData!;
        const prevZwgRate = prevReceipt.totalAmountZWG / prevPurchase.totalPayment;
        
        // Positive change = ZWG weakened (more ZWG per USD)
        // Negative change = ZWG strengthened (less ZWG per USD)
        changePercent = ((zwgRate - prevZwgRate) / prevZwgRate) * 100;
      }

      return {
        date: purchase.purchaseDate.toISOString(),
        zwgRate: zwgRate,
        zwgPerKwh: zwgPerKwh,
        usdPerKwh: usdPerKwh,
        tokensKwh: purchase.totalTokens,
        changePercent: changePercent,
      };
    });

    return NextResponse.json({
      success: true,
      data: rateHistory,
      summary: {
        totalEntries: rateHistory.length,
        avgZwgRate: rateHistory.reduce((sum, r) => sum + r.zwgRate, 0) / rateHistory.length,
        minZwgRate: Math.min(...rateHistory.map(r => r.zwgRate)),
        maxZwgRate: Math.max(...rateHistory.map(r => r.zwgRate)),
        avgZwgPerKwh: rateHistory.reduce((sum, r) => sum + r.zwgPerKwh, 0) / rateHistory.length,
      },
    });
  } catch (error) {
    console.error('Error in rate-history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate history' },
      { status: 500 }
    );
  }
}
