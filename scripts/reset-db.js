const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Delete in correct order due to foreign key constraints
    console.log('🗑️  Deleting audit logs...');
    await prisma.auditLog.deleteMany({});

    console.log('🗑️  Deleting user contributions...');
    await prisma.userContribution.deleteMany({});

    console.log('🗑️  Deleting token purchases...');
    await prisma.tokenPurchase.deleteMany({});

    console.log('🗑️  Deleting sessions...');
    await prisma.session.deleteMany({});

    console.log('🗑️  Deleting accounts...');
    await prisma.account.deleteMany({});

    console.log('🗑️  Deleting users...');
    await prisma.user.deleteMany({});

    console.log('🗑️  Deleting verification tokens...');
    await prisma.verificationToken.deleteMany({});

    console.log('✅ Database reset completed successfully!');

    // Show final counts to confirm
    const counts = {
      users: await prisma.user.count(),
      tokenPurchases: await prisma.tokenPurchase.count(),
      userContributions: await prisma.userContribution.count(),
      auditLogs: await prisma.auditLog.count(),
      accounts: await prisma.account.count(),
      sessions: await prisma.session.count(),
      verificationTokens: await prisma.verificationToken.count(),
    };

    console.log('📊 Final counts:', counts);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Database reset script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database reset script failed:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
