/**
 * Receipt Data API Routes
 * 
 * Handles CRUD operations for official ZWG receipt data.
 * Receipt data is optional detailed information that can be added to purchases
 * for accurate dual-currency tracking and analysis.
 * 
 * @module api/receipt-data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createReceiptDataSchema,
  receiptDataQuerySchema,
} from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import type { CreateReceiptDataInput } from '@/lib/validations';

/**
 * GET /api/receipt-data
 * 
 * Fetch receipt data for a specific purchase by purchase ID.
 * 
 * Query Parameters:
 * - purchaseId (required): ID of the purchase to fetch receipt data for
 * 
 * Authorization:
 * - Requires authenticated user
 * - Returns receipt data if found
 * 
 * @returns 200: Receipt data with purchase details
 * @returns 400: Missing purchaseId parameter
 * @returns 401: Unauthorized (not logged in)
 * @returns 404: Receipt data not found for this purchase
 * @returns 500: Server error
 */
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
      query: receiptDataQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query?: {
        purchaseId?: string;
        tokenNumber?: string;
      };
    };

    const { purchaseId, tokenNumber } = query || {};

    if (purchaseId) {
      // Fetch by purchaseId
      const receiptData = await prisma.receiptData.findUnique({
        where: { purchaseId },
        include: {
          purchase: {
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
      });
      if (!receiptData) {
        return NextResponse.json(
          { message: 'Receipt data not found for this purchase' },
          { status: 404 }
        );
      }
      return NextResponse.json(receiptData, { status: 200 });
    } else if (tokenNumber) {
      // Fetch by tokenNumber (for duplicate check)
      const receiptData = await prisma.receiptData.findFirst({
        where: { tokenNumber },
        select: {
          id: true,
          purchaseId: true,
          createdAt: true,
          purchase: {
            select: {
              user: { select: { name: true, email: true, id: true } },
              createdAt: true,
            },
          },
        },
      });
      if (!receiptData) {
        return NextResponse.json({ exists: false }, { status: 200 });
      }
      return NextResponse.json({ exists: true, receiptData }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: 'Purchase ID or Token Number is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching receipt data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch receipt data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/receipt-data
 * 
 * Create new receipt data for an existing purchase.
 * This adds official ZWG receipt details to a purchase for dual-currency tracking.
 * 
 * Request Body (CreateReceiptDataInput):
 * - purchaseId (required): ID of the purchase to add receipt data to
 * - kwhPurchased (required): Total kWh from receipt
 * - energyCostZWG (required): Energy cost in ZWG
 * - debtZWG (required): Debt amount in ZWG
 * - reaZWG (required): REA levy in ZWG
 * - vatZWG (required): VAT in ZWG
 * - totalAmountZWG (required): Total ZWG amount
 * - transactionDateTime (required): Transaction date/time from receipt
 * - accountNumber (optional): 20-digit account number (stays same for all receipts)
 * - tokenNumber (optional): Meter/token number (unique per purchase)
 * 
 * Authorization:
 * - Requires authenticated user
 * - Only admin OR the purchase creator can add receipt data
 * 
 * Business Rules:
 * - Each purchase can have only ONE receipt data record (enforced by unique constraint)
 * - Purchase must exist before adding receipt data
 * - Cannot add receipt data to another user's purchase (unless admin)
 * 
 * @returns 201: Receipt data created successfully
 * @returns 400: Invalid request body (validation errors)
 * @returns 401: Unauthorized (not logged in)
 * @returns 403: Forbidden (not purchase creator and not admin)
 * @returns 404: Purchase not found
 * @returns 409: Conflict (receipt data already exists for this purchase)
 * @returns 500: Server error
 */
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
      body: createReceiptDataSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const receiptInput = (validation.data as { body: CreateReceiptDataInput }).body;

    // Verify purchase exists and user has access
    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: receiptInput.purchaseId },
      include: {
        receiptData: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if receipt data already exists for this purchase
    if (purchase.receiptData) {
      return NextResponse.json(
        {
          message:
            'Receipt data already exists for this purchase. Use PUT to update.',
        },
        { status: 409 }
      );
    }

    // Only allow admin or the purchase creator to add receipt data
    const isAdmin = session?.user?.role === 'ADMIN';
    const isCreator = purchase.createdBy === session?.user?.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        {
          message:
            'You do not have permission to add receipt data for this purchase',
        },
        { status: 403 }
      );
    }

    // Create receipt data
    const receiptData = await prisma.receiptData.create({
      data: receiptInput,
      include: {
        purchase: {
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
    });

    return NextResponse.json(receiptData, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt data:', error);

    // Handle unique constraint violation (duplicate purchaseId)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'Receipt data already exists for this purchase' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create receipt data' },
      { status: 500 }
    );
  }
}
