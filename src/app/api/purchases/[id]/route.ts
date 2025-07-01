import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UpdateData } from '@/types/api';
import { updateTokenPurchaseSchema, idParamSchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  sanitizeInput,
  checkPermissions,
} from '@/lib/validation-middleware';
import { validateMeterReadingChronology } from '@/lib/meter-reading-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Validate route parameters
    const validation = await validateRequest(
      request,
      {
        params: idParamSchema,
      },
      { id }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: id },
      include: {
        creator: {
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
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Validate request body and parameters
    const validation = await validateRequest(
      request,
      {
        body: updateTokenPurchaseSchema,
        params: idParamSchema,
      },
      { id }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: {
        totalTokens?: number;
        totalPayment?: number;
        meterReading?: number;
        purchaseDate?: string | Date;
        isEmergency?: boolean;
      };
    };
    const sanitizedData = sanitizeInput(body);
    const { totalTokens, totalPayment, meterReading, purchaseDate, isEmergency } =
      sanitizedData as {
        totalTokens?: number;
        totalPayment?: number;
        meterReading?: number;
        purchaseDate?: string | Date;
        isEmergency?: boolean;
      };

    // Check if purchase exists and include contribution relationship
    const existingPurchase = await prisma.tokenPurchase.findUnique({
      where: { id: id },
      include: {
        contribution: true,
      },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if purchase has contribution - prevent editing if it does
    if (existingPurchase.contribution) {
      return NextResponse.json(
        { message: 'Cannot edit purchase: This purchase already has a matching contribution.' },
        { status: 400 }
      );
    }

    // Check permissions - only creator or admin can edit
    if (
      existingPurchase.createdBy !== permissionCheck.user!.id &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own purchases' },
        { status: 403 }
      );
    }

    // Build update data from validated input
    const updateData: UpdateData = {};

    if (totalTokens !== undefined) {
      updateData.totalTokens = parseFloat(totalTokens.toString());
    }

    if (totalPayment !== undefined) {
      updateData.totalPayment = parseFloat(totalPayment.toString());
    }

    if (meterReading !== undefined) {
      updateData.meterReading = parseFloat(meterReading.toString());
    }

    if (purchaseDate !== undefined) {
      updateData.purchaseDate = new Date(purchaseDate);
    }

    if (isEmergency !== undefined) {
      updateData.isEmergency = Boolean(isEmergency);
    }

    // If meter reading or purchase date is being updated, validate chronology
    if (meterReading !== undefined || purchaseDate !== undefined) {
      const finalMeterReading = meterReading !== undefined ? meterReading : existingPurchase.meterReading;
      const finalPurchaseDate = purchaseDate !== undefined ? new Date(purchaseDate) : existingPurchase.purchaseDate;
      
      const meterValidation = await validateMeterReadingChronology(
        finalMeterReading,
        finalPurchaseDate,
        'purchase',
        id // Exclude current purchase from validation
      );
      
      if (!meterValidation.valid) {
        return NextResponse.json(
          { message: meterValidation.error || 'Invalid meter reading' },
          { status: 400 }
        );
      }
    }

    const updatedPurchase = await prisma.tokenPurchase.update({
      where: { id: id },
      data: updateData,
      include: {
        creator: {
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
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'UPDATE',
        entityType: 'TokenPurchase',
        entityId: id,
        oldValues: existingPurchase,
        newValues: updatedPurchase,
      },
    });

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Validate route parameters
    const validation = await validateRequest(
      request,
      {
        params: idParamSchema,
      },
      { id }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    // Check if purchase exists
    const existingPurchase = await prisma.tokenPurchase.findUnique({
      where: { id: id },
      include: {
        contribution: true,
      },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check permissions - only creator or admin can delete
    if (
      existingPurchase.createdBy !== permissionCheck.user!.id &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only delete your own purchases' },
        { status: 403 }
      );
    }

    // Check if purchase has contribution - prevent deletion if it does
    if (existingPurchase.contribution) {
      return NextResponse.json(
        { message: 'Cannot delete purchase with existing contribution' },
        { status: 400 }
      );
    }

    await prisma.tokenPurchase.delete({
      where: { id: id },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'DELETE',
        entityType: 'TokenPurchase',
        entityId: id,
        oldValues: existingPurchase,
      },
    });

    return NextResponse.json(
      { message: 'Purchase deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
