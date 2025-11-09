/**
 * Unit Tests for Cost Algorithm V2: Dual-Currency Support
 * 
 * Tests all major functions in the dual-currency cost calculation system
 */

import {
  calculateZWGCostPerKwh,
  calculateImpliedExchangeRate,
  convertZWGToUSD,
  convertUSDToZWG,
  calculateDualCurrencyCost,
  calculateDualCurrencyUserSummary,
  extractPricingTrends,
  forecastElectricityCosts,
  compareUSDvsZWG,
  type PurchaseWithReceipt,
} from '../src/lib/cost-algorithm-v2';

// Test data based on user's actual receipt
const sampleReceipt = {
  id: 'receipt-1',
  kwhPurchased: 203.21,
  energyCostZWG: 1306.6,
  debtZWG: 0.0,
  reaZWG: 78.4,
  vatZWG: 195.99,
  totalAmountZWG: 1580.99,
  transactionDateTime: new Date('2025-10-16T14:02:36'),
  tokenNumber: '6447 1068 4258 9659 8834',
  accountNumber: '37266905928',
};

const samplePurchase: PurchaseWithReceipt = {
  id: 'purchase-1',
  totalTokens: 203.21,
  totalPayment: 20.0, // USD
  purchaseDate: new Date('2025-10-16T14:02:36'),
  isEmergency: false,
  receiptData: sampleReceipt,
};

function testZWGCostPerKwh() {
  console.log('\n🧪 Test 1: Calculate ZWG Cost per kWh');
  
  const costPerKwh = calculateZWGCostPerKwh(sampleReceipt);
  const expected = 1580.99 / 203.21; // ~7.78 ZWG per kWh
  
  console.log(`   Result: ZWG ${costPerKwh.toFixed(4)} per kWh`);
  console.log(`   Expected: ZWG ${expected.toFixed(4)} per kWh`);
  
  const passed = Math.abs(costPerKwh - expected) < 0.01;
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testImpliedExchangeRate() {
  console.log('\n🧪 Test 2: Calculate Implied Exchange Rate');
  
  const exchangeRate = calculateImpliedExchangeRate(
    samplePurchase.totalPayment,
    sampleReceipt.totalAmountZWG
  );
  const expected = 1580.99 / 20.0; // ~79.05 ZWG per USD
  
  console.log(`   Result: ${exchangeRate.toFixed(4)} ZWG per USD`);
  console.log(`   Expected: ${expected.toFixed(4)} ZWG per USD`);
  console.log(`   Interpretation: USD 1 = ZWG ${exchangeRate.toFixed(2)}`);
  
  const passed = Math.abs(exchangeRate - expected) < 0.01;
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testCurrencyConversion() {
  console.log('\n🧪 Test 3: Currency Conversion (ZWG ↔ USD)');
  
  const exchangeRate = 79.05;
  
  // ZWG to USD
  const zwgAmount = 1580.99;
  const usdResult = convertZWGToUSD(zwgAmount, exchangeRate);
  const expectedUSD = zwgAmount / exchangeRate; // ~20.00
  
  console.log(`   ZWG ${zwgAmount} → USD ${usdResult.toFixed(2)}`);
  console.log(`   Expected: USD ${expectedUSD.toFixed(2)}`);
  
  // USD to ZWG
  const usdAmount = 20.0;
  const zwgResult = convertUSDToZWG(usdAmount, exchangeRate);
  const expectedZWG = usdAmount * exchangeRate; // ~1581
  
  console.log(`   USD ${usdAmount} → ZWG ${zwgResult.toFixed(2)}`);
  console.log(`   Expected: ZWG ${expectedZWG.toFixed(2)}`);
  
  const passed1 = Math.abs(usdResult - expectedUSD) < 0.1;
  const passed2 = Math.abs(zwgResult - expectedZWG) < 1;
  const passed = passed1 && passed2;
  
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testDualCurrencyCost() {
  console.log('\n🧪 Test 4: Dual Currency Cost Calculation');
  
  const tokensConsumed = 100.0; // User consumed 100 kWh
  const result = calculateDualCurrencyCost(samplePurchase, tokensConsumed);
  
  if (!result) {
    console.log('   ❌ FAILED: No result returned');
    return false;
  }
  
  console.log(`   Tokens Consumed: ${result.tokensConsumed} kWh`);
  console.log(`   USD Cost: $${result.usd.totalPaid.toFixed(2)} (${result.usd.costPerKwh.toFixed(4)}/kWh)`);
  console.log(`   ZWG Cost: ZWG ${result.zwg.totalCost.toFixed(2)} (${result.zwg.costPerKwh.toFixed(4)}/kWh)`);
  console.log(`   Exchange Rate: ${result.impliedExchangeRate.toFixed(4)} ZWG/USD`);
  console.log(`   Variance: $${result.variance.absolute.toFixed(2)} (${result.variance.percentage.toFixed(2)}%)`);
  console.log(`   Direction: ${result.variance.direction}`);
  
  // Expected proportional costs
  const expectedUSD = (tokensConsumed / 203.21) * 20.0; // ~9.84 USD
  const expectedZWG = (tokensConsumed / 203.21) * 1580.99; // ~778.07 ZWG
  
  const passed = Math.abs(result.usd.totalPaid - expectedUSD) < 0.1 &&
                 Math.abs(result.zwg.totalCost - expectedZWG) < 1;
  
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testUserSummary() {
  console.log('\n🧪 Test 5: Dual Currency User Summary');
  
  const contributions = [
    {
      id: 'contrib-1',
      userId: 'user-1',
      contributionAmount: 10.0,
      tokensConsumed: 100.0,
      purchase: samplePurchase,
    },
    {
      id: 'contrib-2',
      userId: 'user-1',
      contributionAmount: 8.0,
      tokensConsumed: 80.0,
      purchase: {
        ...samplePurchase,
        id: 'purchase-2',
        totalTokens: 200.0,
        totalPayment: 18.0,
        receiptData: {
          ...sampleReceipt,
          id: 'receipt-2',
          kwhPurchased: 200.0,
          totalAmountZWG: 1400.0,
        },
      },
    },
  ];
  
  const summary = calculateDualCurrencyUserSummary(contributions);
  
  console.log(`   User ID: ${summary.userId}`);
  console.log(`   Total Tokens Used: ${summary.totalTokensUsed} kWh`);
  console.log(`   USD Paid: $${summary.usd.totalPaid.toFixed(2)}`);
  console.log(`   USD Avg: $${summary.usd.averageCostPerKwh.toFixed(4)}/kWh`);
  console.log(`   ZWG True Cost: ZWG ${summary.zwg.totalTrueCost.toFixed(2)}`);
  console.log(`   ZWG Avg: ZWG ${summary.zwg.averageCostPerKwh.toFixed(4)}/kWh`);
  console.log(`   Account Balance: $${summary.usd.accountBalance.toFixed(2)}`);
  console.log(`   Avg Exchange Rate: ${summary.averageExchangeRate.toFixed(4)} ZWG/USD`);
  console.log(`   Data Completeness: ${summary.completeness.toFixed(1)}%`);
  
  const passed = summary.totalTokensUsed === 180.0 &&
                 summary.usd.totalPaid === 18.0 &&
                 summary.receiptsAvailable === 2;
  
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testPricingTrends() {
  console.log('\n🧪 Test 6: Extract Pricing Trends');
  
  const purchases: PurchaseWithReceipt[] = [
    samplePurchase,
    {
      id: 'purchase-2',
      totalTokens: 150.0,
      totalPayment: 16.0,
      purchaseDate: new Date('2025-09-15'),
      isEmergency: false,
      receiptData: {
        id: 'receipt-2',
        kwhPurchased: 150.0,
        energyCostZWG: 900.0,
        debtZWG: 0,
        reaZWG: 60.0,
        vatZWG: 140.0,
        totalAmountZWG: 1100.0,
        transactionDateTime: new Date('2025-09-15'),
      },
    },
  ];
  
  const trends = extractPricingTrends(purchases);
  
  console.log(`   Trends Extracted: ${trends.length}`);
  trends.forEach((trend, index) => {
    console.log(`   [${index + 1}] ${trend.date.toLocaleDateString()}: ZWG ${trend.zwgPerKwh.toFixed(4)}/kWh, USD ${trend.usdPerKwh.toFixed(4)}/kWh`);
  });
  
  const passed = trends.length === 2;
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testForecasting() {
  console.log('\n🧪 Test 7: Cost Forecasting');
  
  const purchases: PurchaseWithReceipt[] = [
    {
      id: 'p1',
      totalTokens: 150.0,
      totalPayment: 14.0,
      purchaseDate: new Date('2025-07-01'),
      isEmergency: false,
      receiptData: {
        id: 'r1',
        kwhPurchased: 150.0,
        energyCostZWG: 800.0,
        debtZWG: 0,
        reaZWG: 50.0,
        vatZWG: 120.0,
        totalAmountZWG: 970.0,
        transactionDateTime: new Date('2025-07-01'),
      },
    },
    {
      id: 'p2',
      totalTokens: 160.0,
      totalPayment: 15.5,
      purchaseDate: new Date('2025-08-01'),
      isEmergency: false,
      receiptData: {
        id: 'r2',
        kwhPurchased: 160.0,
        energyCostZWG: 900.0,
        debtZWG: 0,
        reaZWG: 55.0,
        vatZWG: 135.0,
        totalAmountZWG: 1090.0,
        transactionDateTime: new Date('2025-08-01'),
      },
    },
    {
      id: 'p3',
      totalTokens: 170.0,
      totalPayment: 17.0,
      purchaseDate: new Date('2025-09-01'),
      isEmergency: false,
      receiptData: {
        id: 'r3',
        kwhPurchased: 170.0,
        energyCostZWG: 1000.0,
        debtZWG: 0,
        reaZWG: 60.0,
        vatZWG: 150.0,
        totalAmountZWG: 1210.0,
        transactionDateTime: new Date('2025-09-01'),
      },
    },
    samplePurchase,
  ];
  
  const forecast = forecastElectricityCosts(purchases, 30);
  
  console.log(`   Predicted ZWG/kWh: ZWG ${forecast.predictedZWGPerKwh.toFixed(4)}`);
  console.log(`   Predicted USD/kWh: USD ${forecast.predictedUSDEquivalent.toFixed(4)}`);
  console.log(`   Trend: ${forecast.trendDirection}`);
  console.log(`   Confidence: ${forecast.confidenceLevel}`);
  console.log(`   Based on: ${forecast.basedOnDataPoints} data points`);
  console.log(`   Forecast Period: ${forecast.forecastPeriod}`);
  
  const passed = forecast.basedOnDataPoints === 4 &&
                 forecast.predictedZWGPerKwh > 0;
  
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

function testUSDvsZWGComparison() {
  console.log('\n🧪 Test 8: USD vs ZWG Cost Comparison');
  
  const usdPaid = 20.0;
  const zwgTrueCost = 1580.99;
  const exchangeRate = 79.05;
  
  const comparison = compareUSDvsZWG(usdPaid, zwgTrueCost, exchangeRate);
  
  console.log(`   USD Paid: $${comparison.usdPaid.toFixed(2)}`);
  console.log(`   ZWG True Cost: ZWG ${comparison.zwgTrueCost.toFixed(2)}`);
  console.log(`   ZWG in USD: $${comparison.zwgInUSD.toFixed(2)}`);
  console.log(`   Variance: $${comparison.variance.toFixed(2)} (${comparison.variancePercentage.toFixed(2)}%)`);
  console.log(`   Effective Savings: $${comparison.effectiveSavings.toFixed(2)}`);
  console.log(`   Recommendation: ${comparison.recommendation}`);
  
  const passed = Math.abs(comparison.zwgInUSD - 20.0) < 0.1;
  console.log(passed ? '   ✅ PASSED' : '   ❌ FAILED');
  return passed;
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Cost Algorithm V2 Tests');
  console.log('=' .repeat(60));
  console.log('\nUsing sample receipt data:');
  console.log(`  kWh: ${sampleReceipt.kwhPurchased}`);
  console.log(`  Energy: ZWG ${sampleReceipt.energyCostZWG}`);
  console.log(`  Debt: ZWG ${sampleReceipt.debtZWG}`);
  console.log(`  REA: ZWG ${sampleReceipt.reaZWG}`);
  console.log(`  VAT: ZWG ${sampleReceipt.vatZWG}`);
  console.log(`  Total: ZWG ${sampleReceipt.totalAmountZWG}`);
  console.log(`  USD Paid: $${samplePurchase.totalPayment}`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  const tests = [
    testZWGCostPerKwh,
    testImpliedExchangeRate,
    testCurrencyConversion,
    testDualCurrencyCost,
    testUserSummary,
    testPricingTrends,
    testForecasting,
    testUSDvsZWGComparison,
  ];

  for (const test of tests) {
    results.total++;
    const passed = test();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
