/**
 * API Test Script for Receipt Data Endpoints
 * 
 * This script tests all receipt data endpoints with various scenarios:
 * - Create purchase with receipt data
 * - Create purchase without receipt data, add later
 * - Fetch receipt data
 * - Update receipt data
 * - Delete receipt data
 * - Error handling
 */

import { parse } from 'date-fns';

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test credentials (update these based on your test environment)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword',
};

let authToken: string | null = null;
let testPurchaseId: string | null = null;
let testReceiptId: string | null = null;

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * Test 1: Authenticate user
 */
async function testAuthentication() {
  console.log('\n🔐 Test 1: Authentication');
  
  try {
    const response = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed');
      console.log('Note: Using session-based auth, proceeding without token');
      return true; // Continue with session-based auth
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return false;
  }
}

/**
 * Test 2: Create purchase with receipt data (atomic)
 */
async function testCreatePurchaseWithReceipt() {
  console.log('\n📝 Test 2: Create Purchase with Receipt Data (Atomic)');

  const purchaseData = {
    totalTokens: 203.21,
    totalPayment: 20.0,
    meterReading: 1500.5,
    purchaseDate: new Date().toISOString(),
    isEmergency: false,
    receiptData: {
      tokenNumber: '6447 1068 4258 9659 8834',
      accountNumber: '37266905928',
      kwhPurchased: 203.21,
      energyCostZWG: 1306.6,
      debtZWG: 0.0,
      reaZWG: 78.4,
      vatZWG: 195.99,
      totalAmountZWG: 1580.99,
      tenderedZWG: 1581.0,
      transactionDateTime: parse('16/10/25 14:02:36', 'dd/MM/yy HH:mm:ss', new Date()),
    },
  };

  try {
    const response = await apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });

    const data = await response.json();

    if (response.ok && data.receiptData) {
      testPurchaseId = data.id;
      testReceiptId = data.receiptData.id;
      console.log('✅ Purchase created with receipt data');
      console.log(`   Purchase ID: ${testPurchaseId}`);
      console.log(`   Receipt ID: ${testReceiptId}`);
      return true;
    } else {
      console.log('❌ Failed to create purchase with receipt');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 3: Fetch receipt data by purchase ID
 */
async function testFetchReceiptByPurchaseId() {
  console.log('\n📖 Test 3: Fetch Receipt Data by Purchase ID');

  if (!testPurchaseId) {
    console.log('⚠️  Skipping: No test purchase ID available');
    return false;
  }

  try {
    const response = await apiRequest(`/receipt-data?purchaseId=${testPurchaseId}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Receipt data fetched successfully');
      console.log(`   ZWG Total: ZWG ${data.totalAmountZWG}`);
      console.log(`   kWh: ${data.kwhPurchased}`);
      return true;
    } else {
      console.log('❌ Failed to fetch receipt data');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 4: Fetch receipt data by receipt ID
 */
async function testFetchReceiptById() {
  console.log('\n📖 Test 4: Fetch Receipt Data by Receipt ID');

  if (!testReceiptId) {
    console.log('⚠️  Skipping: No test receipt ID available');
    return false;
  }

  try {
    const response = await apiRequest(`/receipt-data/${testReceiptId}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Receipt data fetched by ID successfully');
      console.log(`   Account: ${data.accountNumber}`);
      console.log(`   Token: ${data.tokenNumber}`);
      return true;
    } else {
      console.log('❌ Failed to fetch receipt by ID');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 5: Update receipt data
 */
async function testUpdateReceipt() {
  console.log('\n✏️  Test 5: Update Receipt Data');

  if (!testReceiptId) {
    console.log('⚠️  Skipping: No test receipt ID available');
    return false;
  }

  const updateData = {
    debtZWG: 50.0, // Updated debt amount
    totalAmountZWG: 1630.99, // Updated total
  };

  try {
    const response = await apiRequest(`/receipt-data/${testReceiptId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Receipt data updated successfully');
      console.log(`   New Debt: ZWG ${data.debtZWG}`);
      console.log(`   New Total: ZWG ${data.totalAmountZWG}`);
      return true;
    } else {
      console.log('❌ Failed to update receipt');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 6: Create separate receipt data for existing purchase
 */
async function testCreateSeparateReceipt() {
  console.log('\n📝 Test 6: Create Separate Receipt for Existing Purchase');

  // First create a purchase without receipt
  const purchaseData = {
    totalTokens: 150.0,
    totalPayment: 15.0,
    meterReading: 1650.0,
    purchaseDate: new Date().toISOString(),
    isEmergency: false,
  };

  try {
    // Create purchase
    const purchaseResponse = await apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });

    const purchase = await purchaseResponse.json();

    if (!purchaseResponse.ok) {
      console.log('❌ Failed to create purchase');
      return false;
    }

    const newPurchaseId = purchase.id;
    console.log(`   Purchase created: ${newPurchaseId}`);

    // Now add receipt data
    const receiptData = {
      purchaseId: newPurchaseId,
      kwhPurchased: 150.0,
      energyCostZWG: 900.0,
      debtZWG: 0.0,
      reaZWG: 45.0,
      vatZWG: 135.0,
      totalAmountZWG: 1080.0,
      tenderedZWG: 1080.0,
      transactionDateTime: new Date(),
    };

    const receiptResponse = await apiRequest('/receipt-data', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });

    const receipt = await receiptResponse.json();

    if (receiptResponse.ok) {
      console.log('✅ Separate receipt created successfully');
      console.log(`   Receipt ID: ${receipt.id}`);
      return true;
    } else {
      console.log('❌ Failed to create separate receipt');
      console.log('   Response:', receipt);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 7: Error handling - duplicate receipt
 */
async function testDuplicateReceiptError() {
  console.log('\n❌ Test 7: Error Handling - Duplicate Receipt');

  if (!testPurchaseId) {
    console.log('⚠️  Skipping: No test purchase ID available');
    return false;
  }

  const duplicateReceipt = {
    purchaseId: testPurchaseId,
    kwhPurchased: 100.0,
    energyCostZWG: 600.0,
    debtZWG: 0.0,
    reaZWG: 30.0,
    vatZWG: 90.0,
    totalAmountZWG: 720.0,
    tenderedZWG: 720.0,
    transactionDateTime: new Date(),
  };

  try {
    const response = await apiRequest('/receipt-data', {
      method: 'POST',
      body: JSON.stringify(duplicateReceipt),
    });

    const data = await response.json();

    if (response.status === 409) {
      console.log('✅ Correctly rejected duplicate receipt (409 Conflict)');
      return true;
    } else {
      console.log(`❌ Unexpected response: ${response.status}`);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Test 8: Delete receipt data
 */
async function testDeleteReceipt() {
  console.log('\n🗑️  Test 8: Delete Receipt Data');

  if (!testReceiptId) {
    console.log('⚠️  Skipping: No test receipt ID available');
    return false;
  }

  try {
    const response = await apiRequest(`/receipt-data/${testReceiptId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Receipt data deleted successfully');
      
      // Verify deletion
      const verifyResponse = await apiRequest(`/receipt-data/${testReceiptId}`);
      if (verifyResponse.status === 404) {
        console.log('✅ Deletion verified (404 Not Found)');
        return true;
      } else {
        console.log('❌ Receipt still exists after deletion');
        return false;
      }
    } else {
      console.log('❌ Failed to delete receipt');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting Receipt Data API Tests\n');
  console.log('=' .repeat(50));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  const tests = [
    testAuthentication,
    testCreatePurchaseWithReceipt,
    testFetchReceiptByPurchaseId,
    testFetchReceiptById,
    testUpdateReceipt,
    testCreateSeparateReceipt,
    testDuplicateReceiptError,
    testDeleteReceipt,
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
