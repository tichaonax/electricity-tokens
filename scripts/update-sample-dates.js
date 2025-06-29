#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSampleDates() {
  try {
    console.log('🔄 Updating sample data dates to current month...');

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5); // 5th of this month
    const lastWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7
    );

    // Update purchase dates to current dates
    const purchases = await prisma.tokenPurchase.findMany();

    if (purchases.length >= 2) {
      await prisma.tokenPurchase.update({
        where: { id: purchases[0].id },
        data: { purchaseDate: thisMonth },
      });

      await prisma.tokenPurchase.update({
        where: { id: purchases[1].id },
        data: { purchaseDate: lastWeek },
      });

      console.log('✅ Updated purchase dates to:', {
        purchase1: thisMonth.toISOString().split('T')[0],
        purchase2: lastWeek.toISOString().split('T')[0],
      });
    }

    console.log('✅ Sample data dates updated successfully!');
  } catch (error) {
    console.error('❌ Error updating sample dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSampleDates();
