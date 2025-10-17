import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'purchases';
    const format = url.searchParams.get('format') || 'csv';

    console.log('Testing export:', { type, format });

    let data: Record<string, unknown>[] = [];

    if (type === 'purchases') {
      const purchases = await prisma.tokenPurchase.findMany({
        include: {
          user: {
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

      data = purchases.map((purchase) => {
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
          createdBy: purchase.user.name,
          createdByEmail: purchase.user.email,
          contributionCount: purchase.contributions.length,
          totalContributions: totalContributions,
          totalTokensConsumed: totalTokensConsumed,
          tokensRemaining: purchase.totalTokens - totalTokensConsumed,
        };
      });
    }

    console.log('Processed data:', data.length, 'records');

    if (format === 'csv') {
      if (data.length === 0) {
        return new NextResponse('No data found', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="test_${type}.csv"`,
          },
        });
      }

      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = (row as any)[header];
          // Escape commas and quotes in CSV
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
          'Content-Disposition': `attachment; filename="test_${type}.csv"`,
        },
      });
    }

    return NextResponse.json({ 
      message: 'Test export', 
      type, 
      format, 
      dataCount: data.length,
      data 
    });
  } catch (error) {
    console.error('Test export error:', error);
    return NextResponse.json(
      { message: 'Test export failed', error: String(error) },
      { status: 500 }
    );
  }
}