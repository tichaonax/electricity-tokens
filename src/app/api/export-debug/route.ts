import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Export debug called');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', session.user.email);

    // Test the exact same query as exportPurchases but without date filtering
    const purchases = await prisma.tokenPurchase.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        contributions: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    console.log('Found purchases:', purchases.length);

    const data = purchases.map((purchase) => {
      const totalContributions = purchase.contributions.reduce(
        (sum, c) => sum + c.contributionAmount,
        0
      );
      const totalTokensConsumed = purchase.contributions.reduce(
        (sum, c) => sum + c.tokensConsumed,
        0
      );

      return {
        id: purchase.id,
        purchaseDate: purchase.purchaseDate.toISOString().split('T')[0],
        totalTokens: purchase.totalTokens,
        totalPayment: purchase.totalPayment,
        costPerToken: purchase.totalPayment / purchase.totalTokens,
        isEmergency: purchase.isEmergency ? 'Yes' : 'No',
        createdBy: purchase.creator.name,
        createdByEmail: purchase.creator.email,
        contributionCount: purchase.contributions.length,
        totalContributions: totalContributions,
        totalTokensConsumed: totalTokensConsumed,
        tokensRemaining: purchase.totalTokens - totalTokensConsumed,
      };
    });

    // Return as CSV
    if (data.length === 0) {
      return new NextResponse('No purchases found', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="debug_purchases.csv"',
        },
      });
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = (row as any)[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    const csv = [csvHeaders, ...csvRows].join('\\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="debug_purchases.csv"',
      },
    });

  } catch (error) {
    console.error('Export debug error:', error);
    return NextResponse.json(
      { message: 'Export debug failed', error: String(error) },
      { status: 500 }
    );
  }
}