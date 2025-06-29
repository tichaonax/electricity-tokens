import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PurchaseWhereInput } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isEmergency = searchParams.get('isEmergency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: PurchaseWhereInput = {};

    if (isEmergency !== null && isEmergency !== undefined) {
      where.isEmergency = isEmergency === 'true';
    }

    if (startDate && endDate) {
      where.purchaseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [purchases, total] = await Promise.all([
      prisma.tokenPurchase.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contributions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { purchaseDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tokenPurchase.count({ where }),
    ]);

    return NextResponse.json({
      purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      totalTokens,
      totalPayment,
      purchaseDate,
      isEmergency = false,
    } = await request.json();

    // Validate required fields
    if (!totalTokens || !totalPayment || !purchaseDate) {
      return NextResponse.json(
        {
          message:
            'Missing required fields: totalTokens, totalPayment, purchaseDate',
        },
        { status: 400 }
      );
    }

    // Validate data types and values
    if (typeof totalTokens !== 'number' || totalTokens <= 0) {
      return NextResponse.json(
        { message: 'totalTokens must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof totalPayment !== 'number' || totalPayment <= 0) {
      return NextResponse.json(
        { message: 'totalPayment must be a positive number' },
        { status: 400 }
      );
    }

    const purchase = await prisma.tokenPurchase.create({
      data: {
        totalTokens: parseFloat(totalTokens.toString()),
        totalPayment: parseFloat(totalPayment.toString()),
        purchaseDate: new Date(purchaseDate),
        isEmergency: Boolean(isEmergency),
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'TokenPurchase',
        entityId: purchase.id,
        newValues: purchase,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
