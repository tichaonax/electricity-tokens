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
import type { UserContribution } from '@prisma/client';

// Helper function to analyze impact of purchase changes
async function analyzePurchaseChangeImpact(
  purchaseId: string,
  changes: {
    meterReading?: number;
    totalTokens?: number;
    totalPayment?: number;
  }
) {
  const impact = {
    affectedContribution: null as UserContribution | null,
    requiresRecalculation: false,
    tokenConstraintViolations: [] as string[],
    oldValues: {} as Record<string, unknown>,
    newValues: {} as Record<string, unknown>,
  };

  // Get the purchase with its contribution
  const purchase = await prisma.tokenPurchase.findUnique({
    where: { id: purchaseId },
    include: { contribution: true },
  });

  if (!purchase) return impact;

  // Check chronological constraints for meter reading changes
  if (changes.meterReading !== undefined) {
    const newMeterReading = changes.meterReading;

    // Check against previous purchase
    const previousPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        createdAt: { lt: purchase.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (previousPurchase && newMeterReading < previousPurchase.meterReading) {
      impact.tokenConstraintViolations.push(
        `New meter reading (${newMeterReading}) cannot be less than previous purchase meter reading (${previousPurchase.meterReading})`
      );
    }

    // Check against next purchase
    const nextPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        createdAt: { gt: purchase.createdAt },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (nextPurchase && newMeterReading > nextPurchase.meterReading) {
      impact.tokenConstraintViolations.push(
        `New meter reading (${newMeterReading}) cannot be greater than next purchase meter reading (${nextPurchase.meterReading})`
      );
    }
  }

  // Check if there's an associated contribution that will be affected
  if (
    purchase.contribution &&
    (changes.meterReading !== undefined || changes.totalTokens !== undefined)
  ) {
    impact.affectedContribution = purchase.contribution;
    impact.requiresRecalculation = changes.meterReading !== undefined; // Recalculate if meter reading changes

    if (changes.meterReading !== undefined) {
      // Calculate new tokensConsumed for the matching contribution
      const previousPurchase = await prisma.tokenPurchase.findFirst({
        where: {
          createdAt: { lt: purchase.createdAt },
        },
        orderBy: { createdAt: 'desc' },
      });

      const previousMeterReading = previousPurchase?.meterReading || 0;
      const newMeterReading = changes.meterReading;
      const newTokensConsumed = newMeterReading - previousMeterReading;

      // Also check impact on next contribution
      const nextPurchase = await prisma.tokenPurchase.findFirst({
        where: {
          createdAt: { gt: purchase.createdAt },
        },
        orderBy: { createdAt: 'asc' },
        include: { contribution: true },
      });

      impact.oldValues = {
        purchaseMeterReading: purchase.meterReading,
        contributionMeterReading: purchase.contribution.meterReading,
        contributionTokensConsumed: purchase.contribution.tokensConsumed,
        nextContributionTokensConsumed:
          nextPurchase?.contribution?.tokensConsumed,
      };

      impact.newValues = {
        purchaseMeterReading: newMeterReading,
        contributionMeterReading: newMeterReading, // Synced to purchase
        contributionTokensConsumed: newTokensConsumed,
        nextContributionTokensConsumed: nextPurchase?.contribution
          ? nextPurchase.contribution.meterReading - newMeterReading
          : undefined,
      };

      // Validate token constraints
      const newTotalTokens = changes.totalTokens ?? purchase.totalTokens;
      if (newTokensConsumed > newTotalTokens) {
        impact.tokenConstraintViolations.push(
          `Recalculated consumption (${newTokensConsumed} kWh) exceeds available tokens (${newTotalTokens} kWh)`
        );
      }

      if (newTokensConsumed < 0) {
        impact.tokenConstraintViolations.push(
          `Invalid calculation: New meter reading (${newMeterReading}) is less than previous purchase meter reading (${previousMeterReading})`
        );
      }
    } else if (changes.totalTokens !== undefined) {
      // Only totalTokens changed
      const currentTokensConsumed = purchase.contribution.tokensConsumed;
      const newTotalTokens = changes.totalTokens;

      if (currentTokensConsumed > newTotalTokens) {
        impact.tokenConstraintViolations.push(
          `Current consumption (${currentTokensConsumed} kWh) exceeds new available tokens (${newTotalTokens} kWh)`
        );
      }
    }
  }

  return impact;
}

// Helper function to recalculate contribution when purchase meter reading changes
async function recalculateContributionsAfterPurchaseUpdate(
  updatedPurchaseId: string,
  newMeterReading: number
) {
  const results = {
    updatedContributions: [] as UserContribution[],
    affectedPurchases: [] as string[],
  };

  // 1. Update the matching contribution's meter reading to sync with purchase
  const matchingContribution = await prisma.userContribution.findUnique({
    where: { purchaseId: updatedPurchaseId },
    include: { purchase: true },
  });

  if (matchingContribution) {
    // Get the previous purchase to calculate tokensConsumed
    const previousPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        createdAt: { lt: matchingContribution.purchase.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    });

    const previousMeterReading = previousPurchase?.meterReading || 0;
    const newTokensConsumed = newMeterReading - previousMeterReading;

    // Update the matching contribution
    const updatedContribution = await prisma.userContribution.update({
      where: { id: matchingContribution.id },
      data: {
        meterReading: newMeterReading, // Sync with purchase
        tokensConsumed: newTokensConsumed,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    results.updatedContributions.push(updatedContribution);
    results.affectedPurchases.push(updatedPurchaseId);
  }

  // 2. Find and recalculate the NEXT contribution (which uses this purchase as its previous)
  const updatedPurchase = await prisma.tokenPurchase.findUnique({
    where: { id: updatedPurchaseId },
  });

  if (updatedPurchase) {
    const nextPurchase = await prisma.tokenPurchase.findFirst({
      where: {
        createdAt: { gt: updatedPurchase.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      include: { contribution: true },
    });

    if (nextPurchase?.contribution) {
      const nextNewTokensConsumed =
        nextPurchase.contribution.meterReading - newMeterReading;

      const updatedNextContribution = await prisma.userContribution.update({
        where: { id: nextPurchase.contribution.id },
        data: {
          tokensConsumed: nextNewTokensConsumed,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      results.updatedContributions.push(updatedNextContribution);
      results.affectedPurchases.push(nextPurchase.id);
    }
  }

  return results;
}

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

    // Parse and validate request body
    const requestBody = await request.json();
    console.log(
      'Purchase update request body:',
      JSON.stringify(requestBody, null, 2)
    );

    // Validate request body directly
    try {
      const bodyValidation = updateTokenPurchaseSchema.parse(requestBody);
      console.log(
        'Body validation passed:',
        JSON.stringify(bodyValidation, null, 2)
      );
    } catch (error) {
      console.error('Body validation failed:', error);
      return NextResponse.json(
        {
          message: 'Invalid request body',
          error:
            error instanceof Error ? error.message : 'Unknown validation error',
        },
        { status: 400 }
      );
    }

    // Validate route parameters
    const paramValidation = await validateRequest(
      request,
      {
        params: idParamSchema,
      },
      { id }
    );

    if (!paramValidation.success) {
      console.error(
        'Parameter validation failed:',
        JSON.stringify(paramValidation, null, 2)
      );
      return createValidationErrorResponse(paramValidation);
    }

    const body = requestBody as {
      totalTokens?: number;
      totalPayment?: number;
      meterReading?: number;
      purchaseDate?: string | Date;
      isEmergency?: boolean;
    };
    const sanitizedData = sanitizeInput(body);
    const {
      totalTokens,
      totalPayment,
      meterReading,
      purchaseDate,
      isEmergency,
    } = sanitizedData as {
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

    // Check if purchase has contribution - prevent editing if it does (unless admin override)
    if (
      existingPurchase.contribution &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        {
          message:
            'Cannot edit purchase: This purchase already has a matching contribution.',
        },
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
      const finalMeterReading =
        meterReading !== undefined
          ? meterReading
          : existingPurchase.meterReading;
      const finalPurchaseDate =
        purchaseDate !== undefined
          ? new Date(purchaseDate)
          : existingPurchase.purchaseDate;

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

    // Analyze impact of changes before making them
    let impactAnalysis = null;

    // Analyze impact if admin is changing meter reading or tokens
    if (
      permissionCheck.user!.role === 'ADMIN' &&
      (meterReading !== undefined || totalTokens !== undefined)
    ) {
      try {
        impactAnalysis = await analyzePurchaseChangeImpact(id, {
          meterReading,
          totalTokens,
          totalPayment,
        });

        // Check for constraint violations
        if (impactAnalysis.tokenConstraintViolations.length > 0) {
          return NextResponse.json(
            {
              message:
                'Cannot apply changes: Token constraint violations detected',
              violations: impactAnalysis.tokenConstraintViolations,
              impactAnalysis,
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error analyzing purchase impact:', error);
        // Continue with update if impact analysis fails for non-critical changes
      }
    }

    const updatedPurchase = await prisma.tokenPurchase.update({
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

    // Perform contribution recalculation if meter reading changed
    let recalculationResults = null;
    if (impactAnalysis?.requiresRecalculation && meterReading !== undefined) {
      recalculationResults = await recalculateContributionsAfterPurchaseUpdate(
        id,
        meterReading
      );

      // Create audit logs for each recalculated contribution
      for (const updatedContribution of recalculationResults.updatedContributions) {
        await prisma.auditLog.create({
          data: {
            userId: permissionCheck.user!.id,
            action: 'RECALCULATE',
            entityType: 'UserContribution',
            entityId: updatedContribution.id,
            oldValues: {
              meterReading: impactAnalysis.oldValues.contributionMeterReading,
              tokensConsumed:
                impactAnalysis.oldValues.contributionTokensConsumed,
              trigger: 'Purchase meter reading changed',
              originalPurchaseMeterReading:
                impactAnalysis.oldValues.purchaseMeterReading,
            },
            newValues: {
              meterReading: updatedContribution.meterReading,
              tokensConsumed: updatedContribution.tokensConsumed,
              trigger: 'Purchase meter reading changed',
              newPurchaseMeterReading: meterReading,
            },
          },
        });
      }
    }

    // Create audit log entry for purchase update
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'UPDATE',
        entityType: 'TokenPurchase',
        entityId: id,
        oldValues: {
          ...existingPurchase,
          cascadingChanges: recalculationResults
            ? {
                affectedContributions: recalculationResults.affectedPurchases,
                recalculationPerformed: true,
              }
            : null,
        },
        newValues: {
          ...updatedPurchase,
          cascadingChanges: recalculationResults
            ? {
                affectedContributions: recalculationResults.affectedPurchases,
                recalculationPerformed: true,
                updatedContributions:
                  recalculationResults.updatedContributions.map((c) => ({
                    id: c.id,
                    meterReading: c.meterReading,
                    tokensConsumed: c.tokensConsumed,
                  })),
              }
            : null,
        },
      },
    });

    // Return response with recalculation info
    const response = {
      ...updatedPurchase,
      ...(recalculationResults && {
        recalculationSummary: {
          contributionsRecalculated: true,
          affectedContributions:
            recalculationResults.updatedContributions.length,
          updatedContributions: recalculationResults.updatedContributions.map(
            (c) => ({
              id: c.id,
              userId: c.user.id,
              userName: c.user.name,
              oldMeterReading:
                impactAnalysis?.oldValues.contributionMeterReading,
              newMeterReading: c.meterReading,
              oldTokensConsumed:
                impactAnalysis?.oldValues.contributionTokensConsumed,
              newTokensConsumed: c.tokensConsumed,
            })
          ),
          trigger: 'Purchase meter reading changed',
        },
      }),
    };

    return NextResponse.json(response);
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

    // Constraint: Only allow deletion of the globally latest purchase in the system
    const globalLatestPurchase = await prisma.tokenPurchase.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!globalLatestPurchase || globalLatestPurchase.id !== id) {
      return NextResponse.json(
        {
          message:
            'Cannot delete purchase: Only the latest purchase in the system may be deleted',
          constraint: 'GLOBAL_LATEST_PURCHASE_ONLY',
        },
        { status: 400 }
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

    // Check if purchase has contribution - prevent deletion if it does (unless admin override)
    if (
      existingPurchase.contribution &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Cannot delete purchase with existing contribution' },
        { status: 400 }
      );
    }

    try {
      await prisma.tokenPurchase.delete({
        where: { id: id },
      });
    } catch (error: unknown) {
      // If this fails due to constraint, provide helpful message for admin
      if (error instanceof Error && 'code' in error && error.code === 'P2003') {
        return NextResponse.json(
          {
            message:
              'Cannot delete purchase: It has an associated contribution. Please delete the contribution first or contact system administrator.',
            constraintViolation: true,
          },
          { status: 400 }
        );
      }
      throw error;
    }

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
