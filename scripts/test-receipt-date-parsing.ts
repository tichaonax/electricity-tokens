/**
 * Test script for receipt data date parsing
 * Tests the DD/MM/YY HH:MM:SS format from Zimbabwe ZESA receipts
 */

import { createReceiptDataWithPurchaseSchema } from '../src/lib/validations';

// Test data with various date formats
const testCases = [
  {
    name: 'Zimbabwe ZESA format (DD/MM/YY HH:MM:SS)',
    data: {
      tokenNumber: '37266905928',
      accountNumber: '64471068425896598834',
      kwhPurchased: 203.21,
      energyCostZWG: 1306.6,
      debtZWG: 0,
      reaZWG: 78.4,
      vatZWG: 195.99,
      totalAmountZWG: 1580.99,
      tenderedZWG: 1581,
      transactionDateTime: '16/10/25 14:02:36',
    },
    expectedDate: new Date('2025-10-16T14:02:36.000Z'),
  },
  {
    name: 'ISO 8601 format',
    data: {
      tokenNumber: '37266905928',
      accountNumber: '64471068425896598834',
      kwhPurchased: 203.21,
      energyCostZWG: 1306.6,
      debtZWG: 0,
      reaZWG: 78.4,
      vatZWG: 195.99,
      totalAmountZWG: 1580.99,
      tenderedZWG: 1581,
      transactionDateTime: '2025-10-16T14:02:36.000Z',
    },
    expectedDate: new Date('2025-10-16T14:02:36.000Z'),
  },
  {
    name: 'Another ZESA format example',
    data: {
      tokenNumber: '12345678901',
      accountNumber: '98765432109876543210',
      kwhPurchased: 150.5,
      energyCostZWG: 1000,
      debtZWG: 50,
      reaZWG: 60,
      vatZWG: 150,
      totalAmountZWG: 1260,
      tenderedZWG: 1300,
      transactionDateTime: '01/11/25 08:30:15',
    },
    expectedDate: new Date('2025-11-01T08:30:15.000Z'),
  },
];

console.log('Testing Receipt Data Date Parsing\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`);
  console.log(`Input: ${testCase.data.transactionDateTime}`);

  try {
    const result = createReceiptDataWithPurchaseSchema.parse(testCase.data);
    console.log(`✓ Validation passed`);
    console.log(`  Parsed date: ${result.transactionDateTime}`);
    console.log(`  Expected:    ${testCase.expectedDate.toISOString()}`);

    // Check if dates match
    const parsedDate = new Date(result.transactionDateTime);
    if (parsedDate.toISOString() === testCase.expectedDate.toISOString()) {
      console.log(`✓ Date matches expected value`);
      passed++;
    } else {
      console.log(`✗ Date mismatch!`);
      failed++;
    }
  } catch (error: any) {
    console.log(`✗ Validation failed`);
    console.log(`  Error:`, error.errors || error.message);
    failed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
