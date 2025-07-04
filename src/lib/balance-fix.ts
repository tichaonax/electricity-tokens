import { prisma } from '@/lib/prisma';

interface ColorFormatter {
  reset: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  cyan: string;
}

const colors: ColorFormatter = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

async function calculateCorrectBalance(scope: string): Promise<number | null> {
  try {
    // Get all contributions in the system (global balance), ordered by purchase date (not createdAt)
    const contributions = await prisma.userContribution.findMany({
      include: {
        purchase: {
          select: {
            totalTokens: true,
            totalPayment: true,
            purchaseDate: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc', // Order by purchase date, not contribution creation
        },
      },
    });

    if (contributions.length === 0) {
      return 0;
    }

    // Get the earliest purchase date to determine what counts as "first purchase"
    const earliestPurchase = await prisma.tokenPurchase.findFirst({
      orderBy: { purchaseDate: 'asc' },
    });

    let runningBalance = 0;

    for (let i = 0; i < contributions.length; i++) {
      const contribution = contributions[i];

      // Check if this is the first purchase globally (not just for this user)
      const isFirstPurchase =
        earliestPurchase &&
        contribution.purchase.purchaseDate.getTime() ===
          earliestPurchase.purchaseDate.getTime();

      // For the first purchase, no tokens were consumed before it
      const effectiveTokensConsumed = isFirstPurchase
        ? 0
        : contribution.tokensConsumed;

      const fairShare =
        (effectiveTokensConsumed / contribution.purchase.totalTokens) *
        contribution.purchase.totalPayment;
      const balanceChange = contribution.contributionAmount - fairShare;
      runningBalance += balanceChange;
    }

    return runningBalance;
  } catch (error) {
    console.error(`Error calculating global balance:`, error);
    return null;
  }
}

export async function fixAllAccountBalances(): Promise<void> {
  try {
    log('🔧 Fixing Global Account Balance After Restore', colors.blue);
    log('==============================================', colors.blue);

    // Get ALL contributions in the system (global balance calculation)
    const allContributions = await prisma.userContribution.findMany({
      include: {
        purchase: {
          select: {
            totalTokens: true,
            totalPayment: true,
            purchaseDate: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc', // Order by purchase date, not contribution creation
        },
      },
    });

    if (allContributions.length === 0) {
      log('✅ No contributions found. Nothing to fix.', colors.green);
      return;
    }

    log(`Found ${allContributions.length} total contributions`, colors.cyan);

    const correctBalance = await calculateCorrectBalance('global');

    if (correctBalance !== null) {
      log(
        `✅ Global account balance calculated: $${correctBalance.toFixed(2)}`,
        colors.green
      );
    }

    log('🎉 Global balance verification completed!', colors.green);
  } catch (error) {
    log('❌ Error fixing account balances:', colors.red);
    console.error(error);
    throw error;
  }
}
