/**
 * Dual Currency Analysis API
 * 
 * Compares USD purchase costs vs ZWG receipt costs over time to analyze:
 * - Exchange rate trends (implied ZWG/USD rate)
 * - Cost per kWh in both currencies
 * - Total spending in USD vs ZWG
 * - Average rates and spending patterns
 * 
 * This endpoint helps users understand if they're paying fair prices when
 * converting USD to ZWG for electricity purchases, and track exchange rate
 * volatility over time.
 * 
 * @module api/receipt-data/dual-currency-analysis
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/receipt-data/dual-currency-analysis
 * 
 * Analyze USD vs ZWG costs for purchases with receipt data.
 * 
 * Query Parameters:
 * - timeRange (optional): Predefined range - '7d', '30d', '90d', '1y', 'all' (default: '30d')
 * - startDate (optional): Custom start date (overrides timeRange if provided)
 * - endDate (optional): Custom end date (defaults to now)
 * - userId (optional, admin only): Filter by specific user
 * 
 * Exchange Rate Calculation:
 * For each purchase with receipt data:
 * - Implied ZWG/USD rate = totalAmountZWG / totalPaymentUSD
 * - This shows the effective exchange rate at time of purchase
 * - Tracking over time reveals currency volatility trends
 * 
 * Cost Per kWh Calculation:
 * - USD per kWh = totalPaymentUSD / totalTokensKwh
 * - ZWG per kWh = totalAmountZWG / totalTokensKwh
 * - Comparison shows currency-specific pricing trends
 * 
 * Authorization:
 * - Requires authenticated user
 * - Regular users: See only their own purchases
 * - Admin users: Can filter by userId or see all purchases
 * 
 * @returns 200: Analysis data with summary statistics
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
    const timeRange = searchParams.get('timeRange') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on timeRange parameter or custom dates
    const now = new Date();
    let fromDate = new Date();
    
    if (startDate) {
      fromDate = new Date(startDate);
    } else {
      // Map time range strings to actual date ranges
      switch (timeRange) {
        case '7d':
          fromDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          fromDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          fromDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          fromDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          fromDate = new Date(0); // Beginning of time (1970-01-01)
          break;
        default:
          fromDate.setDate(now.getDate() - 30); // Default to 30 days
      }
    }

    const toDate = endDate ? new Date(endDate) : now;

    // Build where clause for database query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      purchaseDate: {
        gte: fromDate,
        lte: toDate,
      },
    };

    // Permissions-based filtering: admins or permissioned users see global data
    const userPermissions = (session.user.permissions || null) as Record<string, unknown> | null;
    const canViewAllDualCurrency =
      session.user.role === 'ADMIN' ||
      userPermissions?.canViewDualCurrencyAnalysis === true ||
      userPermissions?.canViewUsageReports === true ||
      userPermissions?.canViewFinancialReports === true ||
      userPermissions?.canViewCostAnalysis === true;

    if (!canViewAllDualCurrency) {
      // Non-privileged users: restrict to their own purchases
      whereClause.user = { id: session.user.id };
    } else if (userId) {
      // Privileged users can filter by specific user
      whereClause.user = { id: userId };
    }
    // Admin without userId: shows all users' purchases (no user filter)

    // Fetch purchases with receipt data
    const purchases = await prisma.tokenPurchase.findMany({
      where: whereClause,
      include: {
        receiptData: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'asc',
      },
    });

    // Filter to only purchases that have receipt data (dual-currency tracking)
    // Purchases without receipt data cannot be analyzed for currency comparison
    const purchasesWithReceipts = purchases.filter((p) => p.receiptData !== null);

    if (purchasesWithReceipts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No receipt data found for the selected period. Add receipt data to enable dual-currency analysis.'
      });
    }

    // Transform data for dual currency analysis
    // Calculate exchange rates and costs per kWh for each purchase
    const analysisData = purchasesWithReceipts.map((purchase) => {
      const receipt = purchase.receiptData!;
      
      // Calculate implied ZWG/USD exchange rate at time of purchase
      // This shows the effective exchange rate used for this transaction
      // Formula: ZWG rate = Total ZWG Amount / Total USD Payment
      // Example: 5000 ZWG / 1 USD = 5000 ZWG/USD exchange rate
      const zwgRate = receipt.totalAmountZWG / purchase.totalPayment;
      
      return {
        date: purchase.purchaseDate.toISOString(),
        usdCost: purchase.totalPayment,
        zwgCost: receipt.totalAmountZWG,
        zwgRate: zwgRate,
        tokensKwh: purchase.totalTokens,
        usdPerKwh: purchase.totalPayment / purchase.totalTokens,
        zwgPerKwh: receipt.totalAmountZWG / purchase.totalTokens,
        userName: purchase.user.name,
      };
    });

    return NextResponse.json({
      success: true,
      data: analysisData,
      summary: {
        totalPurchases: analysisData.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        avgUsdPerKwh: analysisData.reduce((sum: number, d) => sum + d.usdPerKwh, 0) / analysisData.length,
        avgZwgPerKwh: analysisData.reduce((sum: number, d) => sum + d.zwgPerKwh, 0) / analysisData.length,
        avgExchangeRate: analysisData.reduce((sum: number, d) => sum + d.zwgRate, 0) / analysisData.length,
        totalKwh: analysisData.reduce((sum: number, d) => sum + d.tokensKwh, 0),
        totalUsdSpent: analysisData.reduce((sum: number, d) => sum + d.usdCost, 0),
        totalZwgSpent: analysisData.reduce((sum: number, d) => sum + d.zwgCost, 0),
      },
    });
  } catch (error) {
    console.error('Error in dual-currency-analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dual currency analysis' },
      { status: 500 }
    );
  }
}
