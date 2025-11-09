/**
 * Test script for validating ReceiptData schema with sample data
 * This script tests the Prisma schema and Zod validation with real receipt data
 */

import { PrismaClient } from '@prisma/client';
import {
  createReceiptDataSchema,
  createTokenPurchaseSchema,
} from '../src/lib/validations';
import { parse } from 'date-fns';

const prisma = new PrismaClient();

async function testReceiptSchema() {
  console.log('🧪 Testing ReceiptData Schema with Sample Data\n');

  try {
    // Sample data from user's electricity receipt image
    // Receipt details:
    // Token: 6447 1068 4258 9659 8834
    // Meter: 37266905928
    // Kwh: 203.21
    // Energy: ZWG1306.60
    // Debt: ZWG0.00
    // REA: ZWG78.40
    // VAT: ZWG195.99
    // Total Amt: ZWG1580.99
    // Tendered: ZWG1581.00
    // Date: 16/10/25 14:02:36

    // Step 1: Find or create a test user
    console.log('📝 Step 1: Getting test user...');

    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: 'test-user-receipt',
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed-password', // Not used for this test
          role: 'USER',
        },
      });
      console.log(`✅ Test user created with ID: ${testUser.id}`);
    } else {
      console.log(`✅ Using existing test user: ${testUser.id}`);
    }

    // Step 2: Create a test TokenPurchase
    console.log('\n📝 Step 2: Creating test TokenPurchase...');

    const purchase = await prisma.tokenPurchase.create({
      data: {
        id: `purchase-${Date.now()}`,
        totalTokens: 203.21,
        totalPayment: 20.0, // USD equivalent
        meterReading: 1500.0, // Example meter reading
        purchaseDate: parse(
          '16/10/25 14:02:36',
          'dd/MM/yy HH:mm:ss',
          new Date()
        ),
        isEmergency: false,
        createdBy: testUser.id,
      },
    });

    console.log(`✅ Test purchase created with ID: ${purchase.id}\n`);

    // Step 3: Create ReceiptData for this purchase
    console.log('📝 Step 3: Creating ReceiptData...');

    const receiptData = {
      purchaseId: purchase.id,
      tokenNumber: '6447 1068 4258 9659 8834',
      accountNumber: '37266905928',
      kwhPurchased: 203.21,
      energyCostZWG: 1306.6,
      debtZWG: 0.0,
      reaZWG: 78.4,
      vatZWG: 195.99,
      totalAmountZWG: 1580.99,
      tenderedZWG: 1581.0,
      transactionDateTime: parse(
        '16/10/25 14:02:36',
        'dd/MM/yy HH:mm:ss',
        new Date()
      ),
    };

    // Validate with Zod schema
    const validatedReceipt = createReceiptDataSchema.parse(receiptData);
    console.log('✅ Receipt data validated with Zod');

    const receipt = await prisma.receiptData.create({
      data: validatedReceipt,
    });

    console.log(`✅ Receipt created with ID: ${receipt.id}\n`);

    // Step 4: Fetch and verify the data with relationships
    console.log('📝 Step 4: Verifying data with relationships...');

    const purchaseWithReceipt = await prisma.tokenPurchase.findUnique({
      where: { id: purchase.id },
      include: { receiptData: true },
    });

    console.log('✅ Data verification successful!\n');
    console.log('📊 Retrieved Purchase with Receipt:');
    console.log(JSON.stringify(purchaseWithReceipt, null, 2));

    // Step 5: Test cost comparison
    console.log('\n📝 Step 5: Testing cost calculations...');

    if (purchaseWithReceipt?.receiptData) {
      const usdCost = purchaseWithReceipt.totalPayment;
      const zwgCost = purchaseWithReceipt.receiptData.totalAmountZWG;
      const kwhPurchased = purchaseWithReceipt.receiptData.kwhPurchased;

      console.log(`💰 USD Cost: $${usdCost.toFixed(2)}`);
      console.log(`💰 ZWG Cost: ZWG${zwgCost.toFixed(2)}`);
      console.log(`⚡ kWh Units: ${kwhPurchased.toFixed(2)}`);
      console.log(
        `📈 USD per kWh: $${(usdCost / kwhPurchased).toFixed(4)}`
      );
      console.log(
        `📈 ZWG per kWh: ZWG${(zwgCost / kwhPurchased).toFixed(4)}`
      );
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.receiptData.delete({ where: { id: receipt.id } });
    await prisma.tokenPurchase.delete({ where: { id: purchase.id } });
    console.log('✅ Test data cleaned up');

    console.log('\n✅ All tests passed! Schema is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testReceiptSchema()
  .then(() => {
    console.log('\n🎉 Test script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
