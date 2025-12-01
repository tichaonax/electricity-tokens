import { prisma } from '@/lib/prisma';

// Helper function to round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;

export interface ContributionForBalance {
  contributionAmount: number;
  tokensConsumed: number;
  purchase: {
    totalTokens: number;
    totalPayment: number;
    purchaseDate: Date | string;
  };
}

/**
 * Calculate a running account balance across ordered contributions.
 * This follows the logic originally implemented in `dashboard/running-balance`.
 */
export async function calculateAccountBalance(
  contributions: ContributionForBalance[]
): Promise<number> {
  if (!contributions || contributions.length === 0) return 0;

  // Get earliest purchase date
  const earliestPurchase = await prisma.tokenPurchase.findFirst({
    orderBy: { purchaseDate: 'asc' },
  });

  // Sort contributions by purchase date to ensure consistent ordering
  const sortedContributions = contributions.sort(
    (a, b) =>
      new Date(a.purchase.purchaseDate).getTime() -
      new Date(b.purchase.purchaseDate).getTime()
  );

  let runningBalance = 0;

  for (let i = 0; i < sortedContributions.length; i++) {
    const contribution = sortedContributions[i];

    const isFirstPurchase =
      earliestPurchase &&
      new Date(contribution.purchase.purchaseDate).getTime() ===
        new Date(earliestPurchase.purchaseDate).getTime();

    const effectiveTokensConsumed = isFirstPurchase
      ? 0
      : contribution.tokensConsumed;

    const fairShare =
      (effectiveTokensConsumed / contribution.purchase.totalTokens) *
      contribution.purchase.totalPayment;

    const balanceChange = contribution.contributionAmount - fairShare;
    runningBalance += balanceChange;
  }

  return round2(runningBalance);
}
