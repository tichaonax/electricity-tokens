import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UpdateData } from '@/types/api';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { totalTokens, totalPayment, purchaseDate, isEmergency } =
      await request.json();

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
      existingPurchase.createdBy !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own purchases' },
        { status: 403 }
      );
    }

    // Validate data if provided
    const updateData: UpdateData = {};

    if (totalTokens !== undefined) {
      if (typeof totalTokens !== 'number' || totalTokens <= 0) {
        return NextResponse.json(
          { message: 'totalTokens must be a positive number' },
          { status: 400 }
        );
      }
      updateData.totalTokens = parseFloat(totalTokens.toString());
    }

    if (totalPayment !== undefined) {
      if (typeof totalPayment !== 'number' || totalPayment <= 0) {
        return NextResponse.json(
          { message: 'totalPayment must be a positive number' },
          { status: 400 }
        );
      }
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
        userId: session.user.id,
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

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
      existingPurchase.createdBy !== session.user.id &&
      session.user.role !== 'ADMIN'
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
        userId: session.user.id,
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
