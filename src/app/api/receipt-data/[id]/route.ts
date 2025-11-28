/**
 * Receipt Data API Routes - Individual Receipt Operations
 * 
 * Handles GET/PUT/DELETE operations for individual receipt records by receipt ID.
 * 
 * @module api/receipt-data/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateReceiptDataSchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import type { UpdateReceiptDataInput } from '@/lib/validations';

/**
 * GET /api/receipt-data/[id]
 * 
 * Fetch receipt data by receipt ID (not purchase ID).
 * Use this when you know the receipt ID directly.
 * 
 * Path Parameters:
 * - id: Receipt data record ID (UUID)
 * 
 * Authorization:
 * - Requires authenticated user
 * 
 * @returns 200: Receipt data with purchase details
 * @returns 401: Unauthorized (not logged in)
 * @returns 404: Receipt data not found
 * @returns 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const receiptData = await prisma.receiptData.findUnique({
      where: { id },
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
        { message: 'Receipt data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(receiptData, { status: 200 });
  } catch (error) {
    console.error('Error fetching receipt data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch receipt data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/receipt-data/[id]
 * 
 * Update existing receipt data (partial update supported).
 * 
 * Path Parameters:
 * - id: Receipt data record ID (UUID)
 * 
 * Request Body (UpdateReceiptDataInput - all fields optional):
 * - kwhPurchased: Total kWh from receipt
 * - energyCostZWG: Energy cost in ZWG
 * - debtZWG: Debt amount in ZWG
 * - reaZWG: REA levy in ZWG
 * - vatZWG: VAT in ZWG
 * - totalAmountZWG: Total ZWG amount
 * - transactionDateTime: Transaction date/time from receipt
 * - accountNumber: Account number
 * - tokenNumber: Meter/token number
 * 
 * Authorization:
 * - Requires authenticated user
 * - Only admin OR the purchase creator can update receipt data
 * 
 * @returns 200: Receipt data updated successfully
 * @returns 400: Invalid request body (validation errors)
 * @returns 401: Unauthorized (not logged in)
 * @returns 403: Forbidden (not purchase creator and not admin)
 * @returns 404: Receipt data not found
 * @returns 500: Server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      body: updateReceiptDataSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { id } = params;
    const updateData = (validation.data as { body: UpdateReceiptDataInput }).body;

    // Check if receipt data exists and get associated purchase
    const existingReceipt = await prisma.receiptData.findUnique({
      where: { id },
      include: {
        purchase: true,
      },
    });

    if (!existingReceipt) {
      return NextResponse.json(
        { message: 'Receipt data not found' },
        { status: 404 }
      );
    }

    // Only allow admin or the purchase creator to update receipt data
    const isAdmin = session?.user?.role === 'ADMIN';
    const isCreator = existingReceipt.purchase.createdBy === session?.user?.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        {
          message:
            'You do not have permission to update this receipt data',
        },
        { status: 403 }
      );
    }

    // Update receipt data
    const updatedReceipt = await prisma.receiptData.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedReceipt, { status: 200 });
  } catch (error) {
    console.error('Error updating receipt data:', error);
    return NextResponse.json(
      { message: 'Failed to update receipt data' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/receipt-data/[id]
 * 
 * Delete receipt data (soft delete - purchase remains intact).
 * Only the receipt data record is removed; the associated purchase is preserved.
 * 
 * Path Parameters:
 * - id: Receipt data record ID (UUID)
 * 
 * Authorization:
 * - Requires authenticated user
 * - Only admin OR the purchase creator can delete receipt data
 * 
 * Business Logic:
 * - Deletes receipt data record only
 * - Purchase record is NOT affected (remains in database)
 * - This allows re-adding receipt data later if needed
 * 
 * @returns 200: Receipt data deleted successfully
 * @returns 401: Unauthorized (not logged in)
 * @returns 403: Forbidden (not purchase creator and not admin)
 * @returns 404: Receipt data not found
 * @returns 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if receipt data exists and get associated purchase
    const existingReceipt = await prisma.receiptData.findUnique({
      where: { id },
      include: {
        purchase: true,
      },
    });

    if (!existingReceipt) {
      return NextResponse.json(
        { message: 'Receipt data not found' },
        { status: 404 }
      );
    }

    // Only allow admin or the purchase creator to delete receipt data
    const isAdmin = session?.user?.role === 'ADMIN';
    const isCreator = existingReceipt.purchase.createdBy === session?.user?.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        {
          message:
            'You do not have permission to delete this receipt data',
        },
        { status: 403 }
      );
    }

    // Delete receipt data (purchase will remain)
    await prisma.receiptData.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Receipt data deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting receipt data:', error);
    return NextResponse.json(
      { message: 'Failed to delete receipt data' },
      { status: 500 }
    );
  }
}
