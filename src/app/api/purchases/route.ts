import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PurchaseWhereInput } from '@/types/api';
import {
  createTokenPurchaseSchema,
  purchaseQuerySchema,
} from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  sanitizeInput,
  checkPermissions,
} from '@/lib/validation-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate query parameters
    const validation = await validateRequest(request, {
      query: purchaseQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query?: {
        page?: number;
        limit?: number;
        isEmergency?: boolean;
        startDate?: string;
        endDate?: string;
        sortBy?: 'purchaseDate' | 'totalTokens' | 'totalPayment' | 'creator';
        sortDirection?: 'asc' | 'desc';
      };
    };
    const {
      page = 1,
      limit = 10,
      isEmergency,
      startDate,
      endDate,
      sortBy = 'purchaseDate',
      sortDirection = 'desc',
    } = query || {};

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: PurchaseWhereInput = {};

    if (isEmergency !== undefined) {
      where.isEmergency = isEmergency;
    }

    if (startDate && endDate) {
      where.purchaseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Build orderBy clause based on sortBy parameter
    let orderBy:
      | { purchaseDate: 'asc' | 'desc' }
      | { totalTokens: 'asc' | 'desc' }
      | { totalPayment: 'asc' | 'desc' }
      | { creator: { name: 'asc' | 'desc' } };
    switch (sortBy) {
      case 'creator':
        orderBy = {
          creator: {
            name: sortDirection,
          },
        };
        break;
      case 'totalTokens':
        orderBy = { totalTokens: sortDirection };
        break;
      case 'totalPayment':
        orderBy = { totalPayment: sortDirection };
        break;
      case 'purchaseDate':
      default:
        orderBy = { purchaseDate: sortDirection };
        break;
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
        orderBy,
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

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, {
      body: createTokenPurchaseSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: {
        totalTokens: number;
        totalPayment: number;
        purchaseDate: string | Date;
        isEmergency?: boolean;
      };
    };
    const sanitizedData = sanitizeInput(body);
    const {
      totalTokens,
      totalPayment,
      purchaseDate,
      isEmergency = false,
    } = sanitizedData as {
      totalTokens: number;
      totalPayment: number;
      purchaseDate: string | Date;
      isEmergency: boolean;
    };

    const purchase = await prisma.tokenPurchase.create({
      data: {
        totalTokens: parseFloat(totalTokens.toString()),
        totalPayment: parseFloat(totalPayment.toString()),
        purchaseDate: new Date(purchaseDate),
        isEmergency: Boolean(isEmergency),
        createdBy: permissionCheck.user!.id,
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
        userId: permissionCheck.user!.id,
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
