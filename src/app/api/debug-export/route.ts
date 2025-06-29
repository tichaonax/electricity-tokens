import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug export started');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Session found:', session.user.email);
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'purchases';
    const format = url.searchParams.get('format') || 'csv';
    
    console.log('Export params:', { type, format });
    
    // Try a simple database query
    const userCount = await prisma.user.count();
    console.log('Database connected, user count:', userCount);
    
    // Try to get purchases
    const purchases = await prisma.tokenPurchase.findMany({
      take: 5,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    
    console.log('Purchases found:', purchases.length);
    
    const data = purchases.map(purchase => ({
      id: purchase.id,
      purchaseDate: purchase.purchaseDate.toISOString().split('T')[0],
      totalTokens: purchase.totalTokens,
      totalPayment: purchase.totalPayment,
      createdBy: purchase.creator.name,
    }));
    
    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => 
        headers.map(header => (row as any)[header]).join(',')
      );
      const csv = [csvHeaders, ...csvRows].join('\\n');
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="debug_purchases.csv"`,
        },
      });
    }
    
    return NextResponse.json({ data, userCount, message: 'Debug export successful' });
  } catch (error) {
    console.error('Debug export error:', error);
    return NextResponse.json(
      { 
        message: 'Debug export failed', 
        error: String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}