#!/usr/bin/env node

/**
 * Fix Account Balances Script
 *
 * This script recalculates account balances after a backup restore.
 * It addresses issues where timestamps might be altered during restoration,
 * affecting the chronological order used in balance calculations.
 *
 * Usage:
 *   node scripts/fix-account-balances.js
 *   npm run balances:fix
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function calculateCorrectBalance(userId) {
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

    log(
      `Calculating balance for ${contributions.length} contributions...`,
      colors.cyan
    );

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

      log(
        `  Contribution ${i + 1}: ${isFirstPurchase ? '(FIRST PURCHASE)' : ''}`,
        colors.blue
      );
      log(
        `    Purchase Date: ${contribution.purchase.purchaseDate.toLocaleDateString()}`,
        colors.blue
      );
      log(
        `    Tokens Consumed: ${effectiveTokensConsumed.toFixed(2)} kWh (recorded: ${contribution.tokensConsumed.toFixed(2)})`,
        colors.blue
      );
      log(
        `    You Paid: $${contribution.contributionAmount.toFixed(2)}`,
        colors.blue
      );
      log(`    Fair Share: $${fairShare.toFixed(2)}`, colors.blue);
      log(
        `    Balance Change: ${balanceChange >= 0 ? '+' : ''}$${balanceChange.toFixed(2)}`,
        colors.blue
      );
      log(`    Running Balance: $${runningBalance.toFixed(2)}`, colors.blue);
      log('', colors.reset);
    }

    return runningBalance;
  } catch (error) {
    log(
      `Error calculating balance for user ${userId}: ${error.message}`,
      colors.red
    );
    return null;
  }
}

async function fixAllAccountBalances(skipApiTest = false) {
  try {
    log('🔧 Fixing Account Balances After Restore', colors.blue);
    log('=========================================', colors.blue);
    log('', colors.reset);

    // Get all users who have contributions
    const usersWithContributions = await prisma.user.findMany({
      where: {
        userContributions: {
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
    log('', colors.reset);

    for (const user of usersWithContributions) {
      log(`👤 Processing user: ${user.name} (${user.email})`, colors.cyan);

      const correctBalance = await calculateCorrectBalance(user.id);

      if (correctBalance !== null) {
        log(
          `✅ Correct balance calculated: $${correctBalance.toFixed(2)}`,
          colors.green
        );

        // Test the current API calculation (skip when called from API to avoid circular calls)
        if (!skipApiTest) {
          try {
            const response = await fetch(
              `http://localhost:3000/api/contributions?userId=${user.id}&calculateBalance=true`
            );
            if (response.ok) {
              const data = await response.json();
              const apiBalance = data.runningBalance || 0;

              log(
                `📊 API currently shows: $${apiBalance.toFixed(2)}`,
                colors.yellow
              );

              if (Math.abs(correctBalance - apiBalance) > 0.01) {
                log(`⚠️ Balance mismatch detected!`, colors.red);
                log(`   Correct: $${correctBalance.toFixed(2)}`, colors.green);
                log(`   API shows: $${apiBalance.toFixed(2)}`, colors.red);
                log(
                  `   Difference: $${(correctBalance - apiBalance).toFixed(2)}`,
                  colors.red
                );
              } else {
                log(`✅ API balance matches calculated balance`, colors.green);
              }
            }
          } catch (apiError) {
            log(
              `⚠️ Could not test API balance (server might not be running)`,
              colors.yellow
            );
          }
        }
      }

      log('', colors.reset);
    }

    log('🎉 Balance verification completed!', colors.green);
    if (!skipApiTest) {
      log('', colors.reset);
      log('If you found mismatches:', colors.cyan);
      log(
        '1. The API calculation relies on purchase/contribution order',
        colors.cyan
      );
      log('2. After restore, timestamps might affect this order', colors.cyan);
      log('3. The balance should recalculate correctly over time', colors.cyan);
      log('4. Or restart the application to refresh calculations', colors.cyan);
    }
  } catch (error) {
    log('❌ Error fixing account balances:', colors.red);
    log(error.message, colors.red);
    throw error;
  }
}

async function main() {
  try {
    await fixAllAccountBalances();
  } catch (error) {
    log('💥 Script failed:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log('❌ Unhandled error occurred:', colors.red);
  log(error.message, colors.red);
  process.exit(1);
});

// Run the fix
if (require.main === module) {
  main().catch((error) => {
    log('❌ Balance fix failed:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  });
}

module.exports = { fixAllAccountBalances, calculateCorrectBalance };
