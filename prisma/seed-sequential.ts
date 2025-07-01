import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with sequential purchase-contribution workflow...');

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: await hash('password123', 12),
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@test.com',
      name: 'John Doe',
      password: await hash('password123', 12),
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@test.com',
      name: 'Jane Smith',
      password: await hash('password123', 12),
      role: 'USER',
    },
  });

  console.log('✅ Users created');

  // Month 1: January 2024 - First purchase (no previous consumption)
  console.log('📊 Month 1: Creating first purchase...');
  
  const purchase1 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 1000,
      totalPayment: 250.00,
      meterReading: 5000, // Starting meter reading
      purchaseDate: new Date('2024-01-01'),
      isEmergency: false,
      createdBy: adminUser.id,
    },
  });
  console.log(`  ✅ Purchase 1: ${purchase1.totalTokens} tokens, meter: ${purchase1.meterReading}`);

  // Contribution for Purchase 1 (same meter reading, no previous consumption)
  const contribution1 = await prisma.userContribution.create({
    data: {
      purchaseId: purchase1.id,
      userId: user1.id,
      contributionAmount: 250.00,
      meterReading: 5000, // Same as purchase meter reading (constraint 2)
      tokensConsumed: 0, // No previous purchase, so no consumption
    },
  });
  console.log(`  ✅ Contribution 1: User ${user1.name}, consumed: ${contribution1.tokensConsumed} kWh`);

  // Month 2: February 2024 - Usage happened, new purchase
  console.log('📊 Month 2: Creating second purchase...');
  
  const purchase2 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 800,
      totalPayment: 220.00,
      meterReading: 5750, // 750 kWh consumed since last purchase
      purchaseDate: new Date('2024-02-01'),
      isEmergency: false,
      createdBy: user2.id,
    },
  });
  console.log(`  ✅ Purchase 2: ${purchase2.totalTokens} tokens, meter: ${purchase2.meterReading}`);

  // Contribution for Purchase 2 (750 kWh consumed from previous)
  const contribution2 = await prisma.userContribution.create({
    data: {
      purchaseId: purchase2.id,
      userId: user2.id,
      contributionAmount: 187.50, // Proportional to usage
      meterReading: 5750, // Same as purchase meter reading (constraint 2)
      tokensConsumed: 750, // 5750 - 5000 = 750 kWh from previous purchase
    },
  });
  console.log(`  ✅ Contribution 2: User ${user2.name}, consumed: ${contribution2.tokensConsumed} kWh`);

  // Month 3: March 2024 - Emergency purchase
  console.log('📊 Month 3: Creating emergency purchase...');
  
  const purchase3 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 500,
      totalPayment: 175.00, // Higher rate for emergency
      meterReading: 6100, // 350 kWh consumed since last purchase
      purchaseDate: new Date('2024-03-01'),
      isEmergency: true,
      createdBy: adminUser.id,
    },
  });
  console.log(`  ✅ Purchase 3: ${purchase3.totalTokens} tokens, meter: ${purchase3.meterReading} (EMERGENCY)`);

  // Contribution for Purchase 3 (350 kWh consumed from previous)
  const contribution3 = await prisma.userContribution.create({
    data: {
      purchaseId: purchase3.id,
      userId: user1.id,
      contributionAmount: 122.50, // Proportional to emergency rate
      meterReading: 6100, // Same as purchase meter reading (constraint 2)
      tokensConsumed: 350, // 6100 - 5750 = 350 kWh from previous purchase
    },
  });
  console.log(`  ✅ Contribution 3: User ${user1.name}, consumed: ${contribution3.tokensConsumed} kWh`);

  // Month 4: April 2024 - Regular purchase
  console.log('📊 Month 4: Creating fourth purchase...');
  
  const purchase4 = await prisma.tokenPurchase.create({
    data: {
      totalTokens: 900,
      totalPayment: 225.00,
      meterReading: 6520, // 420 kWh consumed since last purchase
      purchaseDate: new Date('2024-04-01'),
      isEmergency: false,
      createdBy: user1.id,
    },
  });
  console.log(`  ✅ Purchase 4: ${purchase4.totalTokens} tokens, meter: ${purchase4.meterReading}`);

  // Leave Purchase 4 WITHOUT contribution to test constraint 1
  console.log('  ⚠️  Purchase 4 left without contribution (to test constraint validation)');

  console.log('\n🎯 **Sequential Workflow Summary:**');
  console.log('   Purchase 1 (Jan): 1000 tokens, meter 5000 → Contribution ✅');
  console.log('   Purchase 2 (Feb): 800 tokens, meter 5750 (750 consumed) → Contribution ✅');
  console.log('   Purchase 3 (Mar): 500 tokens, meter 6100 (350 consumed) → Contribution ✅');
  console.log('   Purchase 4 (Apr): 900 tokens, meter 6520 (420 consumed) → NO Contribution ❌');
  console.log('\n📋 **Constraint Testing:**');
  console.log('   ✅ Constraint 1: Try creating Purchase 5 → Should be BLOCKED');
  console.log('   ✅ Constraint 2: All contributions have matching meter readings');
  console.log('   ✅ Tokens consumed calculated from previous purchase meter reading');

  console.log('\n✅ **Seeding completed successfully!**');
  console.log('\n🔑 **Test Login Credentials:**');
  console.log('   Admin: admin@test.com / password123');
  console.log('   User1: user1@test.com / password123 (John Doe)');
  console.log('   User2: user2@test.com / password123 (Jane Smith)');
  
  console.log('\n🧪 **Test Cases to Verify:**');
  console.log('   1. Try to create a new purchase → Should fail (need contribution for Purchase 4)');
  console.log('   2. Add contribution for Purchase 4 → Should succeed');
  console.log('   3. Then create Purchase 5 → Should succeed');
  console.log('   4. Check contribution form auto-sets meter reading');
  console.log('   5. Check tokens consumed calculation from previous purchase');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });