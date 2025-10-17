import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check what data we have in the database
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
    });

    const contributions = await prisma.userContribution.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        purchase: {
          select: {
            purchaseDate: true,
            totalTokens: true,
            totalPayment: true,
            isEmergency: true,
          },
        },
      },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locked: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Database contents',
      counts: {
        purchases: purchases.length,
        contributions: contributions.length,
        users: users.length,
      },
      data: {
        purchases: purchases,
        contributions: contributions,
        users: users,
      }
    });
  } catch (error) {
    console.error('Test data error:', error);
    return NextResponse.json(
      { message: 'Test data failed', error: String(error) },
      { status: 500 }
    );
  }
}