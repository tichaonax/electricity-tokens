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

  // Create test token purchases
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

  const purchase2 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 500,
      totalPayment: 150.00,
      meterReading: 6100,
      purchaseDate: new Date('2024-06-15'),
      isEmergency: true,
      createdBy: adminUser.id,
    },
  });

  const purchase3 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 750,
      totalPayment: 180.00,
      meterReading: 6650,
      purchaseDate: new Date('2024-06-25'),
      isEmergency: false,
      createdBy: regularUser1.id,
    },
  });

  console.log('✅ Seeding completed!');
  console.log('Test users created:');
  console.log('  Admin: admin@test.com / password123');
  console.log('  User1: user1@test.com / password123');
  console.log('  User2: user2@test.com / password123');
  console.log('Test purchases created:', { purchase1: purchase1.id, purchase2: purchase2.id, purchase3: purchase3.id });
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });