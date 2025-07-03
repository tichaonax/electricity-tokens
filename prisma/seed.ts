import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: await hash('password123', 12),
      role: 'ADMIN',
    },
  });

  const regularUser1 = await prisma.user.create({
    data: {
      email: 'user1@test.com',
      name: 'John Doe',
      password: await hash('password123', 12),
      role: 'USER',
    },
  });

  const regularUser2 = await prisma.user.create({
    data: {
      email: 'user2@test.com',
      name: 'Jane Smith',
      password: await hash('password123', 12),
      role: 'USER',
    },
  });

  // Create test token purchases with proper one-to-one contributions
  console.log('Creating Purchase 1...');
  const purchase1 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 1000,
      totalPayment: 250.00,
      meterReading: 5000,
      purchaseDate: new Date('2024-06-01'),
      isEmergency: false,
      createdBy: adminUser.id,
    },
  });

  // Create matching contribution for Purchase 1
  await prisma.userContribution.create({
    data: {
      purchaseId: purchase1.id,
      userId: regularUser1.id,
      contributionAmount: 250.00,
      meterReading: 5000, // Same as purchase (no previous consumption)
      tokensConsumed: 0, // No previous purchase
    },
  });

  console.log('Creating Purchase 2...');
  const purchase2 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 500,
      totalPayment: 150.00,
      meterReading: 6100, // 1100 kWh consumed since last purchase
      purchaseDate: new Date('2024-06-15'),
      isEmergency: true,
      createdBy: adminUser.id,
    },
  });

  // Create matching contribution for Purchase 2
  await prisma.userContribution.create({
    data: {
      purchaseId: purchase2.id,
      userId: regularUser2.id,
      contributionAmount: 143.00, // Proportional to emergency rate
      meterReading: 6100, // Same as purchase
      tokensConsumed: 1100, // 6100 - 5000 = 1100 kWh consumed
    },
  });

  console.log('Creating Purchase 3...');
  const purchase3 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 750,
      totalPayment: 180.00,
      meterReading: 6650, // 550 kWh consumed since last purchase
      purchaseDate: new Date('2024-06-25'),
      isEmergency: false,
      createdBy: regularUser1.id,
    },
  });

  // Create matching contribution for Purchase 3
  await prisma.userContribution.create({
    data: {
      purchaseId: purchase3.id,
      userId: regularUser1.id,
      contributionAmount: 132.00, // Proportional to usage (550/750 * 180)
      meterReading: 6650, // Same as purchase
      tokensConsumed: 550, // 6650 - 6100 = 550 kWh consumed
    },
  });

  console.log('✅ Seeding completed!');
  console.log('Test users created:');
  console.log('  Admin: admin@test.com / password123');
  console.log('  User1: user1@test.com / password123');
  console.log('  User2: user2@test.com / password123');
  console.log('Test purchases created with matching contributions:');
  console.log(`  Purchase 1: ${purchase1.totalTokens} tokens → Contribution by ${regularUser1.name}`);
  console.log(`  Purchase 2: ${purchase2.totalTokens} tokens → Contribution by ${regularUser2.name}`);
  console.log(`  Purchase 3: ${purchase3.totalTokens} tokens → Contribution by ${regularUser1.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });