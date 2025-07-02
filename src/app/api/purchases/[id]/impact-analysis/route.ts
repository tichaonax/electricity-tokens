import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to analyze impact of purchase changes (duplicated for analysis endpoint)
async function analyzePurchaseChangeImpact(
  purchaseId: string,
  changes: { meterReading?: number; totalTokens?: number; totalPayment?: number }
) {
  const impact = {
    affectedContribution: null as any,
    requiresRecalculation: false,
    tokenConstraintViolations: [] as string[],
    oldValues: {} as any,
    newValues: {} as any,
    summary: '',
  };

  // Get the purchase with its contribution
  const purchase = await prisma.tokenPurchase.findUnique({
    where: { id: purchaseId },
    include: { 
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

  if (!purchase) return impact;

  // Check if there's an associated contribution that will be affected
  if (purchase.contribution && (changes.meterReading !== undefined || changes.totalTokens !== undefined)) {
    impact.affectedContribution = purchase.contribution;
    impact.requiresRecalculation = true;
    
    // Calculate old and new tokensConsumed
    const oldTokensConsumed = purchase.contribution.tokensConsumed;
    const newMeterReading = changes.meterReading ?? purchase.meterReading;
    const newTokensConsumed = purchase.contribution.meterReading - newMeterReading;
    
    impact.oldValues = {
      purchaseMeterReading: purchase.meterReading,
      contributionTokensConsumed: oldTokensConsumed,
      totalTokens: purchase.totalTokens,
    };
    
    impact.newValues = {
      purchaseMeterReading: newMeterReading,
      contributionTokensConsumed: newTokensConsumed,
      totalTokens: changes.totalTokens ?? purchase.totalTokens,
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
        `Invalid calculation: Contribution meter reading (${purchase.contribution.meterReading}) is less than purchase meter reading (${newMeterReading})`
      );
    }

    // Generate summary message
    const userName = purchase.contribution.user.name;
    const tokenDiff = newTokensConsumed - oldTokensConsumed;
    impact.summary = `Changing this purchase will automatically recalculate ${userName}'s contribution. ` +
      `Tokens consumed will change from ${oldTokensConsumed} kWh to ${newTokensConsumed} kWh ` +
      `(${tokenDiff >= 0 ? '+' : ''}${tokenDiff} kWh difference).`;
  } else {
    impact.summary = 'No associated contribution will be affected by these changes.';
  }

  return impact;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    // Only admins can perform impact analysis for purchases with contributions
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { meterReading, totalTokens, totalPayment } = body;

    // Perform impact analysis
    const impact = await analyzePurchaseChangeImpact(id, {
      meterReading,
      totalTokens,
      totalPayment,
    });

    return NextResponse.json({
      success: impact.tokenConstraintViolations.length === 0,
      impact,
      canProceed: impact.tokenConstraintViolations.length === 0,
      warnings: impact.tokenConstraintViolations,
    });

  } catch (error) {
    console.error('Error analyzing purchase impact:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}