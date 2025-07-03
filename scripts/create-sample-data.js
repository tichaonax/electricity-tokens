#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🔄 Creating sample data...');

    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    const regularUser = await prisma.user.findFirst({
      where: { role: 'USER' },
    });

    if (!adminUser || !regularUser) {
      console.log('❌ Please run create-test-user.js first');
      return;
    }

    // Create sample token purchases
    const purchase1 = await prisma.tokenPurchase.create({
      data: {
        totalTokens: 1000,
        totalPayment: 250.0,
        meterReading: 5000,
        purchaseDate: new Date('2024-06-01'),
        isEmergency: false,
        createdBy: adminUser.id,
      },
    });

    const purchase2 = await prisma.tokenPurchase.create({
      data: {
        totalTokens: 500,
        totalPayment: 150.0,
        meterReading: 6000, // 1000 kWh consumed since last purchase
        purchaseDate: new Date('2024-06-15'),
        isEmergency: true,
        createdBy: adminUser.id,
      },
    });

    // Create sample user contributions (one-to-one with purchases)
    await prisma.userContribution.create({
      data: {
        purchaseId: purchase1.id,
        userId: regularUser.id, // Only ONE contribution per purchase
        contributionAmount: 250.0, // Full amount for purchase1
        meterReading: 5000, // Same as purchase (no previous consumption)
        tokensConsumed: 0, // No previous purchase
      },
    });

    await prisma.userContribution.create({
      data: {
        purchaseId: purchase2.id,
        userId: adminUser.id, // Only ONE contribution per purchase
        contributionAmount: 150.0, // Full amount for purchase2
        meterReading: 6000, // Same as purchase meter reading
        tokensConsumed: 1000, // 6000 - 5000 = 1000 kWh consumed
      },
    });

    // Create audit log entries
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'CREATE',
        entityType: 'TokenPurchase',
        entityId: purchase1.id,
        newValues: purchase1,
      },
    });

    console.log('✅ Sample data created successfully!');
    console.log('- 2 token purchases');
    console.log('- 2 user contributions (one-to-one)');
    console.log('- 1 audit log entry');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
