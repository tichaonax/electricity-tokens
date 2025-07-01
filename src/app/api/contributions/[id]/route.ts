import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateBusinessRules } from '@/lib/validation-middleware';
import type { UpdateData } from '@/types/api';

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

      // Validate business rules for token consumption
      const businessRulesValidation = await validateBusinessRules(
        {
          checkTokenAvailability: {
            purchaseId: existingContribution.purchaseId,
            requestedTokens: tokensConsumed,
            excludeContributionId: id, // Exclude current contribution from availability check
          },
        },
        prisma
      );

      if (!businessRulesValidation.success) {
        return NextResponse.json(
          { message: businessRulesValidation.error },
          { status: 400 }
        );
      }

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

    // Check permissions - users can only delete their own contributions
    if (
      existingContribution.userId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only delete your own contributions' },
        { status: 403 }
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
