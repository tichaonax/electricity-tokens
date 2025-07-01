import { prisma } from '@/lib/prisma';

export interface SequentialContributionResult {
  nextAvailablePurchase: {
    id: string;
    purchaseDate: Date;
    totalTokens: number;
    totalPayment: number;
    isEmergency: boolean;
  } | null;
  totalPurchasesWithoutContributions: number;
  allPurchasesHaveContributions: boolean;
}

/**
 * Finds the oldest token purchase without a contribution
 * This enforces the sequential contribution constraint
 */
export async function findOldestPurchaseWithoutContribution(): Promise<SequentialContributionResult> {
  try {
    // Find all purchases without contributions, ordered by date (oldest first)
    const purchasesWithoutContributions = await prisma.tokenPurchase.findMany({
      where: {
        contribution: null, // No contribution exists for this purchase
      },
      select: {
        id: true,
        purchaseDate: true,
        totalTokens: true,
        totalPayment: true,
        isEmergency: true,
      },
      orderBy: {
        purchaseDate: 'asc', // Oldest first
      },
    });

    const nextAvailablePurchase =
      purchasesWithoutContributions.length > 0
        ? purchasesWithoutContributions[0]
        : null;

    return {
      nextAvailablePurchase,
      totalPurchasesWithoutContributions: purchasesWithoutContributions.length,
      allPurchasesHaveContributions: purchasesWithoutContributions.length === 0,
    };
  } catch (error) {
    console.error('Error finding oldest purchase without contribution:', error);
    return {
      nextAvailablePurchase: null,
      totalPurchasesWithoutContributions: 0,
      allPurchasesHaveContributions: true,
    };
  }
}

/**
 * Checks if a specific purchase can accept contributions based on sequential constraint
 * @param purchaseId - The purchase to check
 * @param isAdmin - Whether the user is an admin (can bypass constraint)
 */
export async function canPurchaseAcceptContribution(
  purchaseId: string,
  isAdmin: boolean = false
): Promise<{
  canContribute: boolean;
  reason?: string;
  nextAvailablePurchaseId?: string;
}> {
  try {
    // Admin can bypass sequential constraint
    if (isAdmin) {
      // Still check if the purchase exists and doesn't already have a contribution
      const purchase = await prisma.tokenPurchase.findUnique({
        where: { id: purchaseId },
        include: { contribution: true },
      });

      if (!purchase) {
        return {
          canContribute: false,
          reason: 'Purchase not found',
        };
      }

      if (purchase.contribution) {
        return {
          canContribute: false,
          reason: 'Purchase already has a contribution',
        };
      }

      return { canContribute: true };
    }

    // For regular users, enforce sequential constraint
    const sequentialResult = await findOldestPurchaseWithoutContribution();

    if (sequentialResult.allPurchasesHaveContributions) {
      return {
        canContribute: false,
        reason: 'All purchases already have contributions',
      };
    }

    if (sequentialResult.nextAvailablePurchase?.id === purchaseId) {
      return { canContribute: true };
    }

    return {
      canContribute: false,
      reason: 'You must contribute to older purchases first',
      nextAvailablePurchaseId: sequentialResult.nextAvailablePurchase?.id,
    };
  } catch (error) {
    console.error('Error checking if purchase can accept contribution:', error);
    return {
      canContribute: false,
      reason: 'Unable to validate purchase eligibility',
    };
  }
}

/**
 * Gets contribution progress information for UI display
 */
export async function getContributionProgress(): Promise<{
  totalPurchases: number;
  purchasesWithContributions: number;
  nextPurchaseToContribute: {
    id: string;
    purchaseDate: Date;
    totalTokens: number;
    isEmergency: boolean;
  } | null;
  progressPercentage: number;
}> {
  try {
    const [totalPurchases, purchasesWithContributions, sequentialResult] =
      await Promise.all([
        prisma.tokenPurchase.count(),
        prisma.tokenPurchase.count({
          where: {
            contribution: {
              isNot: null,
            },
          },
        }),
        findOldestPurchaseWithoutContribution(),
      ]);

    const progressPercentage =
      totalPurchases > 0
        ? Math.round((purchasesWithContributions / totalPurchases) * 100)
        : 100;

    return {
      totalPurchases,
      purchasesWithContributions,
      nextPurchaseToContribute: sequentialResult.nextAvailablePurchase,
      progressPercentage,
    };
  } catch (error) {
    console.error('Error getting contribution progress:', error);
    return {
      totalPurchases: 0,
      purchasesWithContributions: 0,
      nextPurchaseToContribute: null,
      progressPercentage: 100,
    };
  }
}
