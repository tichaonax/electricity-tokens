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

async function calculateCorrectBalance(userId: string): Promise<number | null> {
  try {
    // Get all contributions for this user, ordered by purchase date (not createdAt)
    const contributions = await prisma.userContribution.findMany({
      where: { userId },
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
    console.error(`Error calculating balance for user ${userId}:`, error);
    return null;
  }
}

export async function fixAllAccountBalances(): Promise<void> {
  try {
    log('🔧 Fixing Account Balances After Restore', colors.blue);
    log('=========================================', colors.blue);

    // Get all users who have contributions
    const usersWithContributions = await prisma.user.findMany({
      where: {
        contributions: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (usersWithContributions.length === 0) {
      log(
        '✅ No users with contributions found. Nothing to fix.',
        colors.green
      );
      return;
    }

    log(
      `Found ${usersWithContributions.length} users with contributions`,
      colors.cyan
    );

    for (const user of usersWithContributions) {
      log(`👤 Processing user: ${user.name} (${user.email})`, colors.cyan);

      const correctBalance = await calculateCorrectBalance(user.id);

      if (correctBalance !== null) {
        log(
          `✅ Correct balance calculated: $${correctBalance.toFixed(2)}`,
          colors.green
        );
      }
    }

    log('🎉 Balance verification completed!', colors.green);
  } catch (error) {
    log('❌ Error fixing account balances:', colors.red);
    console.error(error);
    throw error;
  }
}
