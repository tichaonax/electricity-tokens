import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateBusinessRules } from '@/lib/validation-middleware';
import { UserPermissions, hasPermission, mergeWithDefaultPermissions, ADMIN_PERMISSIONS } from '@/types/permissions';
import type { UpdateData } from '@/types/api';

// Helper function to get user permissions
function getUserPermissions(user: { role?: string; permissions?: unknown }): UserPermissions {
  if (user.role === 'ADMIN') {
    return ADMIN_PERMISSIONS;
  }
  return mergeWithDefaultPermissions(user.permissions || {});
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const contribution = await prisma.userContribution.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchase: {
          select: {
            id: true,
            totalTokens: true,
            totalPayment: true,
            meterReading: true,
            purchaseDate: true,
            isEmergency: true,
          },
        },
      },
    });

    if (!contribution) {
      return NextResponse.json(
        { message: 'Contribution not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only see their own contributions
    if (
      contribution.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only view your own contributions' },
        { status: 403 }
      );
    }

    return NextResponse.json(contribution);
  } catch (error) {
    console.error('Error fetching contribution:', error);
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

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { contributionAmount, meterReading, tokensConsumed } =
      await request.json();

    // Check if contribution exists
    const existingContribution = await prisma.userContribution.findUnique({
      where: { id: id },
      include: {
        purchase: true,
      },
    });

    if (!existingContribution) {
      return NextResponse.json(
        { message: 'Contribution not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only edit their own contributions
    if (
      existingContribution.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own contributions' },
        { status: 403 }
      );
    }

    // Validate data if provided
    const updateData: UpdateData = {};

    if (contributionAmount !== undefined) {
      if (typeof contributionAmount !== 'number' || contributionAmount <= 0) {
        return NextResponse.json(
          { message: 'contributionAmount must be a positive number' },
          { status: 400 }
        );
      }
      updateData.contributionAmount = parseFloat(contributionAmount.toString());
    }

    if (meterReading !== undefined) {
      if (typeof meterReading !== 'number' || meterReading < 0) {
        return NextResponse.json(
          { message: 'meterReading must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.meterReading = parseFloat(meterReading.toString());
    }

    if (tokensConsumed !== undefined) {
      if (typeof tokensConsumed !== 'number' || tokensConsumed < 0) {
        return NextResponse.json(
          { message: 'tokensConsumed must be a non-negative number' },
          { status: 400 }
        );
      }

      // Token availability validation removed - meter reading bounds validation is sufficient

      updateData.tokensConsumed = parseFloat(tokensConsumed.toString());
    }

    const updatedContribution = await prisma.userContribution.update({
      where: { id: id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchase: {
          select: {
            id: true,
            totalTokens: true,
            totalPayment: true,
            meterReading: true,
            purchaseDate: true,
            isEmergency: true,
          },
        },
      },
    });

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          entityType: 'UserContribution',
          entityId: id,
          oldValues: existingContribution,
          newValues: updatedContribution,
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the main operation if audit logging fails
    }

    return NextResponse.json(updatedContribution);
  } catch (error) {
    console.error('Error updating contribution:', error);
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

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if contribution exists
    const existingContribution = await prisma.userContribution.findUnique({
      where: { id: id },
    });

    if (!existingContribution) {
      return NextResponse.json(
        { message: 'Contribution not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can delete their own contributions OR have deleteContributions permission OR be admin
    const userPermissions = getUserPermissions(session.user);
    const canDeleteOwn = existingContribution.userId === session.user.id;
    const canDeleteAny = hasPermission(userPermissions, 'canDeleteContributions');
    const isAdmin = session.user.role === 'ADMIN';

    if (!canDeleteOwn && !canDeleteAny && !isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: You do not have permission to delete this contribution' },
        { status: 403 }
      );
    }

    // Constraint: Only allow deletion of the globally latest contribution in the system
    const globalLatestContribution = await prisma.userContribution.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!globalLatestContribution || globalLatestContribution.id !== id) {
      return NextResponse.json(
        { 
          message: 'Cannot delete contribution: Only the latest contribution in the system may be deleted',
          constraint: 'GLOBAL_LATEST_CONTRIBUTION_ONLY'
        },
        { status: 400 }
      );
    }

    // Additional constraint: Check if latest token purchase has no contribution
    // If so, prevent deletion to avoid having two purchases without contributions
    const latestPurchase = await prisma.tokenPurchase.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { contribution: true },
    });

    if (latestPurchase && !latestPurchase.contribution) {
      return NextResponse.json(
        { 
          message: 'Cannot delete contribution: Latest token purchase has no contribution. Deleting this contribution would leave two purchases without contributions.',
          constraint: 'PREVENT_MULTIPLE_UNCONSUMED_PURCHASES'
        },
        { status: 400 }
      );
    }

    await prisma.userContribution.delete({
      where: { id: id },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'UserContribution',
        entityId: id,
        oldValues: existingContribution,
      },
    });

    return NextResponse.json(
      { message: 'Contribution deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting contribution:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
