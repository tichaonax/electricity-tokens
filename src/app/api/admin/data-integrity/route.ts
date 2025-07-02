import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for orphaned contributions (contributions without valid purchase)
    const orphanedContributions = await prisma.userContribution.findMany({
      where: {
        purchase: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Check for contributions with missing purchases
    const allContributions = await prisma.userContribution.findMany({
      include: {
        purchase: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    const contributionsWithMissingPurchases = allContributions.filter(
      contribution => !contribution.purchase
    );

    // Get total counts
    const totalPurchases = await prisma.tokenPurchase.count();
    const totalContributions = await prisma.userContribution.count();

    return NextResponse.json({
      summary: {
        totalPurchases,
        totalContributions,
        orphanedContributions: orphanedContributions.length,
        contributionsWithMissingPurchases: contributionsWithMissingPurchases.length,
      },
      issues: {
        orphanedContributions,
        contributionsWithMissingPurchases,
      }
    });

  } catch (error) {
    console.error('Error checking data integrity:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}