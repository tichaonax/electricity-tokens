import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { idParamSchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';

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

    // Get the current purchase
    const currentPurchase = await prisma.tokenPurchase.findUnique({
      where: { id: id },
    });

    if (!currentPurchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Get previous purchase (chronologically before this one)
    const previousPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        createdAt: { lt: currentPurchase.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        meterReading: true,
        totalTokens: true,
        purchaseDate: true,
      },
    });

    // Get next purchase (chronologically after this one)
    const nextPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        createdAt: { gt: currentPurchase.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        meterReading: true,
        totalTokens: true,
        purchaseDate: true,
      },
    });

    const context = {
      previousPurchase: previousPurchase ? {
        meterReading: previousPurchase.meterReading,
        totalTokens: previousPurchase.totalTokens,
        date: previousPurchase.purchaseDate.toISOString(),
      } : null,
      nextPurchase: nextPurchase ? {
        meterReading: nextPurchase.meterReading,
        totalTokens: nextPurchase.totalTokens,
        date: nextPurchase.purchaseDate.toISOString(),
      } : null,
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error('Error fetching purchase context:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}