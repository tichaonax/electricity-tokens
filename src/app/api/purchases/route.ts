import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PurchaseWhereInput } from '@/types/api';
import {
  createTokenPurchaseSchema,
  purchaseQuerySchema,
  createReceiptDataWithPurchaseSchema,
} from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  sanitizeInput,
  checkPermissions,
  validateBusinessRules,
} from '@/lib/validation-middleware';
import { validateMeterReadingChronology } from '@/lib/meter-reading-validation';
import { findOldestPurchaseWithoutContribution } from '@/lib/sequential-contributions';
import type { CreateReceiptDataWithPurchaseInput } from '@/lib/validations';

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
        before?: string;
        sortBy?: 'purchaseDate' | 'totalTokens' | 'totalPayment' | 'creator';
        sortDirection?: 'asc' | 'desc';
        search?: string;
      };
    };
    const {
      page = 1,
      limit = 10,
      isEmergency,
      startDate,
      endDate,
      before,
      sortBy = 'purchaseDate',
      sortDirection = 'desc',
      search,
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
    } else if (before) {
      // Find purchases before a specific date (for previous purchase lookup)
      where.purchaseDate = {
        lt: new Date(before),
      };
    }

    // Add search filter for creator name
    if (search && search.trim()) {
      where.user = {
        name: {
          contains: search.trim(),
          mode: 'insensitive', // Case-insensitive search
        },
      };
    }

    // Build orderBy clause based on sortBy parameter
    let orderBy:
      | { purchaseDate: 'asc' | 'desc' }
      | { totalTokens: 'asc' | 'desc' }
      | { totalPayment: 'asc' | 'desc' }
      | { user: { name: 'asc' | 'desc' } };
    switch (sortBy) {
      case 'creator':
        orderBy = {
          user: {
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

    const [purchases, total, sequentialResult] = await Promise.all([
      prisma.tokenPurchase.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contribution: {
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
          receiptData: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.tokenPurchase.count({ where }),
      findOldestPurchaseWithoutContribution(),
    ]);

    // Add canContribute field to each purchase based on sequential constraint
    const isAdmin = permissionCheck.user?.role === 'ADMIN';
    const nextAvailablePurchaseId = sequentialResult.nextAvailablePurchase?.id;

    const purchasesWithContributeFlag = purchases.map((purchase) => ({
      ...purchase,
      canContribute:
        !purchase.contribution &&
        (isAdmin || // Admin can bypass constraint
          purchase.id === nextAvailablePurchaseId), // Or it's the next available purchase
    }));

    return NextResponse.json({
      purchases: purchasesWithContributeFlag,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      sequentialInfo: {
        nextAvailablePurchaseId,
        totalPurchasesWithoutContributions:
          sequentialResult.totalPurchasesWithoutContributions,
        allPurchasesHaveContributions:
          sequentialResult.allPurchasesHaveContributions,
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

    // Parse request body
    const requestBody = await request.json();
    const { receiptData, ...purchaseData } = requestBody;

    // Validate purchase data
    const validation = await validateRequest(
      new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify(purchaseData),
        headers: request.headers,
      }),
      {
        body: createTokenPurchaseSchema,
      }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    // Validate receipt data if provided
    let validatedReceiptData: CreateReceiptDataWithPurchaseInput | null = null;
    if (receiptData) {
      const receiptValidation = createReceiptDataWithPurchaseSchema.safeParse(receiptData);
      if (!receiptValidation.success) {
        return NextResponse.json(
          {
            message: 'Invalid receipt data',
            errors: receiptValidation.error.errors,
          },
          { status: 400 }
        );
      }
      validatedReceiptData = receiptValidation.data;
    }

    const { body } = validation.data as {
      body: {
        totalTokens: number;
        totalPayment: number;
        meterReading: number;
        purchaseDate: string | Date;
        isEmergency?: boolean;
      };
    };
    const sanitizedData = sanitizeInput(body);
    const {
      totalTokens,
      totalPayment,
      meterReading,
      purchaseDate,
      isEmergency = false,
    } = sanitizedData as {
      totalTokens: number;
      totalPayment: number;
      meterReading: number;
      purchaseDate: string | Date;
      isEmergency: boolean;
    };

    // Validate meter reading chronology
    const purchaseDateObj = new Date(purchaseDate);
    const meterValidation = await validateMeterReadingChronology(
      meterReading,
      purchaseDateObj,
      'purchase'
    );

    if (!meterValidation.valid) {
      return NextResponse.json(
        { message: meterValidation.error || 'Invalid meter reading' },
        { status: 400 }
      );
    }

    // Validate sequential purchase-contribution order (constraint 1)
    const sequentialValidation = await validateBusinessRules(
      {
        checkSequentialPurchaseOrder: {
          purchaseDate: purchaseDateObj,
          bypassAdmin: permissionCheck.user!.role === 'ADMIN', // Admin can bypass
        },
      },
      prisma
    );

    if (!sequentialValidation.success) {
      return NextResponse.json(
        { message: sequentialValidation.error },
        { status: 400 }
      );
    }

    // Generate a CUID for the token purchase
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    const purchaseId = `c${timestamp}${randomPart}${randomPart2}`;

    // Use transaction to create purchase and receipt data atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create purchase
      const purchase = await tx.tokenPurchase.create({
        data: {
          id: purchaseId,
          totalTokens: parseFloat(totalTokens.toString()),
          totalPayment: parseFloat(totalPayment.toString()),
          meterReading: parseFloat(meterReading.toString()),
          purchaseDate: new Date(purchaseDate),
          isEmergency: Boolean(isEmergency),
          createdBy: permissionCheck.user!.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create receipt data if provided
      let receipt = null;
      if (validatedReceiptData) {
        receipt = await tx.receiptData.create({
          data: {
            ...validatedReceiptData,
            purchaseId: purchase.id, // Override with actual purchase ID
          },
        });
      }

      // Generate a CUID for the audit log
      const auditTimestamp = Date.now().toString(36);
      const auditRandomPart = Math.random().toString(36).substring(2, 15);
      const auditRandomPart2 = Math.random().toString(36).substring(2, 15);
      const auditLogId = `c${auditTimestamp}${auditRandomPart}${auditRandomPart2}`;

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          id: auditLogId,
          userId: permissionCheck.user!.id,
          action: 'CREATE',
          entityType: 'TokenPurchase',
          entityId: purchase.id,
          newValues: { purchase, receipt },
        },
      });

      return { purchase, receipt };
    });

    // Return purchase with receipt data if created
    const responseData = {
      ...result.purchase,
      receiptData: result.receipt,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
