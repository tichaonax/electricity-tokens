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
        purchaseDate: new Date('2024-06-01'),
        isEmergency: false,
        createdBy: adminUser.id,
      },
    });

    const purchase2 = await prisma.tokenPurchase.create({
      data: {
        totalTokens: 500,
        totalPayment: 150.0,
        purchaseDate: new Date('2024-06-15'),
        isEmergency: true,
        createdBy: adminUser.id,
      },
    });

    // Create sample user contributions
    await prisma.userContribution.create({
      data: {
        purchaseId: purchase1.id,
        userId: adminUser.id,
        contributionAmount: 125.0,
        meterReading: 5000,
        tokensConsumed: 500,
      },
    });

    await prisma.userContribution.create({
      data: {
        purchaseId: purchase1.id,
        userId: regularUser.id,
        contributionAmount: 125.0,
        meterReading: 4800,
        tokensConsumed: 500,
      },
    });

    await prisma.userContribution.create({
      data: {
        purchaseId: purchase2.id,
        userId: regularUser.id,
        contributionAmount: 150.0,
        meterReading: 5300,
        tokensConsumed: 500,
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
    console.log('- 3 user contributions');
    console.log('- 1 audit log entry');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
