const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPurchase() {
  try {
    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: 'cmihhrfxj0009va9k5q3inha7' }
    });

    if (!purchase) {
      console.log('Purchase not found');
      return;
    }

    console.log('Purchase found:', {
      id: purchase.id,
      totalTokens: purchase.totalTokens,
      totalPayment: purchase.totalPayment,
      purchaseDate: purchase.purchaseDate
    });

    // Check if it has a contribution
    const contribution = await prisma.userContribution.findUnique({
      where: { purchaseId: 'cmihhrfxj0009va9k5q3inha7' }
    });

    console.log('Has contribution:', !!contribution);

    if (contribution) {
      console.log('Contribution details:', {
        id: contribution.id,
        userId: contribution.userId,
        contributionAmount: contribution.contributionAmount
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPurchase();