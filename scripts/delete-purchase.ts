import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deletePurchaseAndContribution(purchaseId: string) {
  try {
    console.log(`🔍 Looking up purchase ${purchaseId}...`);

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        contribution: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!purchase) {
      console.log('❌ Purchase not found');
      return;
    }

    console.log('📋 Purchase details:');
    console.log(`   ID: ${purchase.id}`);
    console.log(`   Tokens: ${purchase.totalTokens}`);
    console.log(`   Payment: $${purchase.totalPayment}`);
    console.log(`   Date: ${purchase.purchaseDate.toISOString()}`);
    console.log(`   User: ${purchase.user.name} (${purchase.user.email})`);
    console.log(`   Has contribution: ${!!purchase.contribution}`);

    if (purchase.contribution) {
      console.log(`   Contribution ID: ${purchase.contribution.id}`);
      console.log(`   Contribution Amount: $${purchase.contribution.contributionAmount}`);
    }

    // Delete in transaction to maintain data integrity
    await prisma.$transaction(async (tx) => {
      if (purchase.contribution) {
        console.log('🗑️ Deleting contribution...');
        await tx.userContribution.delete({
          where: { id: purchase.contribution.id }
        });
        console.log('✅ Contribution deleted');
      }

      console.log('🗑️ Deleting purchase...');
      await tx.tokenPurchase.delete({
        where: { id: purchaseId }
      });
      console.log('✅ Purchase deleted');
    });

    console.log('🎉 Successfully deleted purchase and its contribution');

    // Run balance recalculation after deletion
    console.log('🔧 Recalculating account balances...');
    const { fixAllAccountBalances } = await import('../src/lib/balance-fix');
    await fixAllAccountBalances();
    console.log('✅ Account balances recalculated');

  } catch (error) {
    console.error('❌ Error deleting purchase:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get purchase ID from command line argument
const purchaseId = process.argv[2];
if (!purchaseId) {
  console.error('❌ Please provide a purchase ID as an argument');
  console.error('Usage: npx tsx delete-purchase.ts <purchase-id>');
  process.exit(1);
}

deletePurchaseAndContribution(purchaseId);