const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createOrUpdateUser(userData) {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    console.log(`  ℹ️  User ${userData.email} already exists, skipping...`);
    return existingUser;
  }

  const user = await prisma.user.create({
    data: {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
    },
  });

  console.log(`  ✅ Created user: ${user.email}`);
  return user;
}

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create admin user (always needed)
    const adminUser = await createOrUpdateUser({
      email: 'admin@test.com',
      name: 'Admin User',
      password: await hash('password123', 12),
      role: 'ADMIN',
    });

    // Create test users only if we don't have any purchases yet (fresh install)
    const existingPurchases = await prisma.tokenPurchase.count();

    if (existingPurchases === 0) {
      console.log('🔄 Fresh database detected, creating test data...');

      const regularUser1 = await createOrUpdateUser({
        email: 'user1@test.com',
        name: 'John Doe',
        password: await hash('password123', 12),
        role: 'USER',
      });

      const regularUser2 = await createOrUpdateUser({
        email: 'user2@test.com',
        name: 'Jane Smith',
        password: await hash('password123', 12),
        role: 'USER',
      });

      // Create test purchases with proper one-to-one contributions
      console.log('Creating Purchase 1...');
      const purchase1 = await prisma.tokenPurchase.create({
        data: {
          id: `purchase_${Date.now()}_1`,
          totalTokens: 1000,
          totalPayment: 250.00,
          meterReading: 5000,
          purchaseDate: new Date('2024-06-01'),
          isEmergency: false,
          createdBy: adminUser.id,
        },
      });

      await prisma.userContribution.create({
        data: {
          id: `contribution_${Date.now()}_1`,
          purchaseId: purchase1.id,
          userId: regularUser1.id,
          contributionAmount: 250.00,
          meterReading: 5000,
          tokensConsumed: 1000,
        },
      });

      console.log('Creating Purchase 2...');
      const purchase2 = await prisma.tokenPurchase.create({
        data: {
          id: `purchase_${Date.now()}_2`,
          totalTokens: 500,
          totalPayment: 125.00,
          meterReading: 6000,
          purchaseDate: new Date('2024-06-15'),
          isEmergency: false,
          createdBy: adminUser.id,
        },
      });

      await prisma.userContribution.create({
        data: {
          id: `contribution_${Date.now()}_2`,
          purchaseId: purchase2.id,
          userId: regularUser2.id,
          contributionAmount: 125.00,
          meterReading: 6000,
          tokensConsumed: 500,
        },
      });

      console.log('Creating Purchase 3...');
      const purchase3 = await prisma.tokenPurchase.create({
        data: {
          id: `purchase_${Date.now()}_3`,
          totalTokens: 750,
          totalPayment: 180.00,
          meterReading: 6650,
          purchaseDate: new Date('2024-07-01'),
          isEmergency: false,
          createdBy: adminUser.id,
        },
      });

      await prisma.userContribution.create({
        data: {
          id: `contribution_${Date.now()}_3`,
          purchaseId: purchase3.id,
          userId: regularUser1.id,
          contributionAmount: 132.00,
          meterReading: 6650,
          tokensConsumed: 550,
        },
      });

      console.log('✅ Test data created successfully!');
      console.log(`  Purchase 1: ${purchase1.totalTokens} tokens → Contribution by ${regularUser1.name}`);
      console.log(`  Purchase 2: ${purchase2.totalTokens} tokens → Contribution by ${regularUser2.name}`);
      console.log(`  Purchase 3: ${purchase3.totalTokens} tokens → Contribution by ${regularUser1.name}`);
    } else {
      console.log(`⚡ Database already has ${existingPurchases} purchases, skipping test data creation`);
    }

    console.log('✅ Seeding completed successfully!');
    console.log('📝 Admin credentials:');
    console.log('  🔐 Admin: admin@test.com / password123');
    if (existingPurchases === 0) {
      console.log('  👤 User1: user1@test.com / password123');
      console.log('  👤 User2: user2@test.com / password123');
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Fatal seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
