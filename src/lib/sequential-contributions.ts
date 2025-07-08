import { prisma } from '@/lib/prisma';

// Simple in-memory cache for sequential contribution results (5 second TTL)
interface CacheEntry {
  data: SequentialContributionResult;
  timestamp: number;
}

let sequentialCache: CacheEntry | null = null;
const CACHE_TTL = 5000; // 5 seconds

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
    // Check cache first
    if (sequentialCache && Date.now() - sequentialCache.timestamp < CACHE_TTL) {
      return sequentialCache.data;
    }

    // Use Promise.all to get both the oldest purchase and count in parallel
    const [nextAvailablePurchase, totalPurchasesWithoutContributions] = await Promise.all([
      // Get only the oldest purchase without contribution (limit 1 for efficiency)
      prisma.tokenPurchase.findFirst({
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
      }),
      // Get count of purchases without contributions
      prisma.tokenPurchase.count({
        where: {
          contribution: null,
        },
      }),
    ]);

    const result = {
      nextAvailablePurchase,
      totalPurchasesWithoutContributions,
      allPurchasesHaveContributions: totalPurchasesWithoutContributions === 0,
    };

    // Cache the result
    sequentialCache = {
      data: result,
      timestamp: Date.now(),
    };

    return result;
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

/**
 * Invalidates the sequential contribution cache
 * Call this after creating/updating/deleting purchases or contributions
 */
export function invalidateSequentialCache(): void {
  sequentialCache = null;
}
