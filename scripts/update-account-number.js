/**
 * Update Account Number in Receipt Data
 * Changes: 64471068425896598834 → 37266905928
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAccountNumber() {
  console.log('🔍 Checking for records with old account number...\n');

  const oldAccountNumber = '64471068425896598834';
  const newAccountNumber = '37266905928';

  try {
    // Find all records with the old account number
    const records = await prisma.receiptData.findMany({
      where: {
        accountNumber: oldAccountNumber
      },
      include: {
        purchase: {
          select: {
            id: true,
            purchaseDate: true,
            totalPayment: true
          }
        }
      }
    });

    if (records.length === 0) {
      console.log('✅ No records found with account number:', oldAccountNumber);
      console.log('   Either already updated or no records exist.');
      return;
    }

    console.log(`📋 Found ${records.length} record(s) to update:\n`);

    records.forEach((record, index) => {
      console.log(`${index + 1}. Receipt ID: ${record.id}`);
      console.log(`   Purchase Date: ${record.purchase.purchaseDate}`);
      console.log(`   Total Amount: ZWG ${record.totalAmountZWG}`);
      console.log(`   Current Account Number: ${record.accountNumber}`);
      console.log(`   Token Number: ${record.tokenNumber || 'N/A'}`);
      console.log('');
    });

    console.log('🔄 Updating account numbers...\n');

    // Update all records
    const result = await prisma.receiptData.updateMany({
      where: {
        accountNumber: oldAccountNumber
      },
      data: {
        accountNumber: newAccountNumber
      }
    });

    console.log(`✅ Successfully updated ${result.count} record(s)`);
    console.log(`   Old Account Number: ${oldAccountNumber}`);
    console.log(`   New Account Number: ${newAccountNumber}\n`);

    // Verify the update
    const verifyRecords = await prisma.receiptData.findMany({
      where: {
        accountNumber: newAccountNumber
      }
    });

    console.log(`✅ Verification: ${verifyRecords.length} record(s) now have the new account number\n`);

  } catch (error) {
    console.error('❌ Error updating account number:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAccountNumber()
  .then(() => {
    console.log('✅ Update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });
