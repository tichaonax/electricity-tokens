const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`✅ Users count: ${userCount}`);
    
    // Test purchases with new schema
    const purchases = await prisma.tokenPurchase.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        contribution: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      take: 5
    });
    
    console.log(`✅ Purchases count: ${purchases.length}`);
    
    if (purchases.length > 0) {
      const purchase = purchases[0];
      console.log(`✅ First purchase: ${purchase.totalTokens} tokens, meter reading: ${purchase.meterReading}`);
      if (purchase.contribution) {
        console.log(`  -> Contribution by ${purchase.contribution.user.name}: ${purchase.contribution.tokensConsumed} kWh`);
      } else {
        console.log(`  -> No contribution yet`);
      }
    }
    
    console.log('✅ Database test successful!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();