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

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
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
      params
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: params.id },
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

export async function PUT(request: NextRequest, { params }: RouteContext) {
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
      params
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: {
        totalTokens?: number;
        totalPayment?: number;
        purchaseDate?: string | Date;
        isEmergency?: boolean;
      };
    };
    const sanitizedData = sanitizeInput(body);
    const { totalTokens, totalPayment, purchaseDate, isEmergency } =
      sanitizedData as {
        totalTokens?: number;
        totalPayment?: number;
        purchaseDate?: string | Date;
        isEmergency?: boolean;
      };

    // Check if purchase exists
    const existingPurchase = await prisma.tokenPurchase.findUnique({
      where: { id: params.id },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
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

    if (purchaseDate !== undefined) {
      updateData.purchaseDate = new Date(purchaseDate);
    }

    if (isEmergency !== undefined) {
      updateData.isEmergency = Boolean(isEmergency);
    }

    const updatedPurchase = await prisma.tokenPurchase.update({
      where: { id: params.id },
      data: updateData,
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
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'UPDATE',
        entityType: 'TokenPurchase',
        entityId: params.id,
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

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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
      params
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    // Check if purchase exists
    const existingPurchase = await prisma.tokenPurchase.findUnique({
      where: { id: params.id },
      include: {
        contributions: true,
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

    // Check if purchase has contributions - prevent deletion if it does
    if (existingPurchase.contributions.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete purchase with existing contributions' },
        { status: 400 }
      );
    }

    await prisma.tokenPurchase.delete({
      where: { id: params.id },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'DELETE',
        entityType: 'TokenPurchase',
        entityId: params.id,
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
