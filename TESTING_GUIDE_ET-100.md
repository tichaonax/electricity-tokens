# Testing Guide: ET-100 Receipt Data Feature

> **Project:** Electricity Token Purchase Tracking  
> **Feature:** Receipt Data Capture & Analysis  
> **Date:** 2025-11-08  
> **Status:** Phase 8 - Testing & QA

---

## 📋 Overview

This guide provides step-by-step testing procedures for the Receipt Data feature (ET-100), including dual-currency tracking, bulk import, and historical analysis.

---

## ✅ Pre-Testing Checklist

- [ ] Application is running locally (http://localhost:3000)
- [ ] Database migrations are applied
- [ ] Test user account exists (both USER and ADMIN roles)
- [ ] CSV template downloaded from `/receipt-import-template.csv`
- [ ] At least 5-10 existing purchases in the system

---

## 🧪 Test Scenarios

### 1. Receipt Data Creation (Manual Entry)

**Test Case 1.1: Create Purchase WITH Receipt Data**

**Steps:**
1. Navigate to `/dashboard/contributions`
2. Click "New Purchase" button
3. Fill in purchase fields:
   - Total Tokens: `200`
   - Total Payment: `25.00`
   - Meter Reading: `12000`
   - Purchase Date: `2025-11-01`
   - Emergency: `No`
4. Check "Add Receipt Data" checkbox
5. Fill in receipt data fields:
   - Transaction Date/Time: `2025-11-01 14:30:00`
   - Token Number: `1234 5678 9012 3456 7890`
   - Account Number: `37266905928`
   - kWh Purchased: `200`
   - Energy Cost (ZWG): `1285.00`
   - Debt/Arrears (ZWG): `0.00`
   - REA Levy (ZWG): `77.10`
   - VAT (ZWG): `192.75`
   - Total Amount (ZWG): `1554.85`
   - Amount Tendered (ZWG): `1555.00`
6. Click "Create Purchase"

**Expected Results:**
- ✅ Success message appears
- ✅ Purchase appears in history table
- ✅ Receipt badge shows on purchase row
- ✅ All receipt data saved correctly in database
- ✅ Exchange rate calculated: 1554.85 / 25 = 62.194 ZWG/USD

**Validation Checks:**
```sql
-- Check purchase created
SELECT * FROM token_purchases ORDER BY "createdAt" DESC LIMIT 1;

-- Check receipt data linked
SELECT * FROM receipt_data WHERE "purchaseId" = '<purchase_id>';
```

---

**Test Case 1.2: Create Purchase WITHOUT Receipt Data**

**Steps:**
1. Create new purchase with same fields as above
2. Leave "Add Receipt Data" checkbox UNCHECKED
3. Click "Create Purchase"

**Expected Results:**
- ✅ Purchase created successfully
- ✅ No receipt badge on purchase row
- ✅ Receipt data section not visible
- ✅ No entry in `receipt_data` table

---

**Test Case 1.3: Field Validation**

**Test negative numbers:**
- Enter `-100` in kWh Purchased → Should show error
- Enter `-50` in Energy Cost → Should show error

**Test required fields:**
- Leave Total Amount empty → Should show error
- Leave kWh Purchased empty → Should show error

**Test date validation:**
- Enter invalid date `2025-13-45` → Should show error
- Enter future date `2026-01-01` → Should show warning

**Expected Results:**
- ✅ All validation errors display
- ✅ Form submission blocked until valid
- ✅ Clear error messages shown

---

### 2. Dual-Currency Calculations

**Test Case 2.1: Verify Exchange Rate Calculation**

**Formula:** `ZWG Rate = Total Amount ZWG / Total Payment USD`

**Test Data:**
- Total Payment: $25.00
- Total Amount ZWG: 1554.85 ZWG
- Expected Rate: 62.194 ZWG/USD

**Verification Steps:**
1. Navigate to `/dashboard/cost-analysis`
2. Click "USD vs ZWG" tab
3. Find the purchase in the data table
4. Verify "Rate" column shows `62.194 ZWG`

**Expected Results:**
- ✅ Rate calculated correctly
- ✅ Rate displayed in chart data table
- ✅ Formatting shows: `ZWG 62.19` or similar

---

**Test Case 2.2: Verify Cost per kWh**

**Formulas:**
- USD per kWh: `Total Payment / Total Tokens`
- ZWG per kWh: `Total Amount ZWG / Total Tokens`

**Test Data:**
- Total Payment: $25.00
- Total Tokens: 200 kWh
- Total Amount ZWG: 1554.85 ZWG
- Expected USD/kWh: $0.125
- Expected ZWG/kWh: 7.77425 ZWG

**Verification:**
1. Check dual-currency chart
2. Find purchase in data table
3. Verify "USD/kWh" = `$0.1250`
4. Verify "ZWG/kWh" = `ZWG 7.77`

---

### 3. Bulk Import Testing

**Test Case 3.1: Small CSV Import (10 receipts)**

**Preparation:**
1. Download template: `/receipt-import-template.csv`
2. Create test CSV with 10 rows
3. Ensure you have 10 purchases in system with dates matching CSV

**Sample CSV:**
```csv
Transaction Date/Time,Token Number,Account Number,kWh Purchased,Energy Cost (ZWG),Debt/Arrears (ZWG),REA Levy (ZWG),VAT (ZWG),Total Amount (ZWG),Amount Tendered (ZWG)
01/11/25 14:02:36,6447 1068 4258 9659 8834,37266905928,200.00,1285.00,0.00,77.10,192.75,1554.85,1555.00
02/11/25 09:15:22,5123 4567 8901 2345 6789,37266905928,150.00,964.50,0.00,57.87,144.68,1167.05,1200.00
03/11/25 16:30:45,7890 1234 5678 9012 3456,37266905928,180.00,1157.40,0.00,69.44,173.61,1400.45,1400.45
...7 more rows...
```

**Import Steps:**
1. Navigate to `/dashboard/receipts/import`
2. Drag-and-drop CSV file or click to upload
3. Wait for parsing and matching
4. Review preview table:
   - Green rows = High confidence (80-100%)
   - Yellow rows = Medium confidence (50-79%)
   - Red rows = Low confidence (<50%)
5. Verify match reasons shown for each row
6. Click "Import X Receipts" button
7. Wait for completion

**Expected Results:**
- ✅ All 10 rows parsed successfully
- ✅ Matching confidence scores displayed
- ✅ High/medium confidence receipts auto-selected
- ✅ Low confidence receipts require manual review
- ✅ Import completes with success count
- ✅ All receipt data visible in purchase history

**Validation:**
```sql
-- Count receipts created
SELECT COUNT(*) FROM receipt_data;

-- Check specific receipt
SELECT rd.*, tp."purchaseDate", tp."totalTokens"
FROM receipt_data rd
JOIN token_purchases tp ON rd."purchaseId" = tp.id
WHERE rd."tokenNumber" LIKE '%6447%';
```

---

**Test Case 3.2: Large CSV Import (100+ receipts)**

**Preparation:**
1. Generate CSV with 100-200 rows
2. Ensure corresponding purchases exist
3. Monitor performance

**Steps:**
1. Upload large CSV file
2. Monitor parsing time (should be <5 seconds)
3. Review matching (should be <10 seconds)
4. Verify batch processing (500 max per file)
5. Import selected receipts
6. Monitor import time (should be <30 seconds for 100 items)

**Performance Benchmarks:**
- ✅ Parsing: <5 seconds for 100 rows
- ✅ Matching: <10 seconds for 100 rows
- ✅ Import: <30 seconds for 100 receipts
- ✅ No browser freezing or timeouts
- ✅ Progress indicator works

---

**Test Case 3.3: Matching Algorithm Accuracy**

**Test Scenario: Exact Date Match**
- Purchase Date: `2025-11-01`
- Receipt Date: `2025-11-01`
- Expected: High confidence (80-100%)

**Test Scenario: Date Within 2 Days**
- Purchase Date: `2025-11-01`
- Receipt Date: `2025-11-02`
- Expected: Medium confidence (50-79%)

**Test Scenario: kWh Exact Match**
- Purchase Tokens: `200.00`
- Receipt kWh: `200.00`
- Expected: +50 confidence points

**Test Scenario: kWh Fuzzy Match (±5%)**
- Purchase Tokens: `200.00`
- Receipt kWh: `203.00` (1.5% difference)
- Expected: +40-50 confidence points

**Test Scenario: Poor Match**
- Purchase Date: `2025-11-01`
- Receipt Date: `2025-10-15` (17 days apart)
- Purchase Tokens: `200.00`
- Receipt kWh: `350.00` (75% difference)
- Expected: Low confidence (<20%)

---

### 4. Historical Analysis Testing

**Test Case 4.1: Trend Detection**

**Preparation:**
1. Import 10+ receipts spanning 3+ months
2. Ensure varying ZWG rates

**Steps:**
1. Navigate to `/dashboard`
2. View "Electricity Insights" card
3. Check trend indicator

**Test Rising Trend:**
- Month 1: 60 ZWG/USD
- Month 2: 63 ZWG/USD (+5%)
- Month 3: 66 ZWG/USD (+4.8%)
- Expected: Red TrendingUp icon, "Rising 15%" message

**Test Falling Trend:**
- Month 1: 66 ZWG/USD
- Month 2: 63 ZWG/USD (-4.5%)
- Month 3: 60 ZWG/USD (-4.8%)
- Expected: Green TrendingDown icon, "Falling 9%" message

**Test Stable Trend:**
- Month 1: 62 ZWG/USD
- Month 2: 63 ZWG/USD (+1.6%)
- Month 3: 62.5 ZWG/USD (-0.8%)
- Expected: Gray Minus icon, "Stable" message

---

**Test Case 4.2: Anomaly Detection**

**Definition:** Deviation >20% from average

**Test Scenario:**
- Average ZWG/kWh: 7.50
- Normal purchases: 7.30, 7.45, 7.60, 7.55
- Anomaly purchase: 9.50 (26.7% above average)

**Expected Results:**
- ✅ Anomaly detected as "spike"
- ✅ Severity: High (>40% = High, 30-40% = Medium, 20-30% = Low)
- ✅ Shows in "Recent Anomalies" section
- ✅ Highlighted in insights card

---

**Test Case 4.3: Recommendations**

**Test Scenarios:**

**Scenario 1: Rising Rates**
- Last 3 months show +15% increase
- Expected Recommendation: "⚠️ ZWG rates have risen 15% over the last 3 months. Consider purchasing larger quantities when rates are lower."

**Scenario 2: Falling Rates**
- Last 3 months show -12% decrease
- Expected Recommendation: "✅ ZWG rates are currently decreasing. This is a good time to make regular purchases."

**Scenario 3: Stable with Good Rate**
- Rates stable, current rate 10% below 3-month average
- Expected Recommendation: "🎯 Current rates are favorable. Excellent time to purchase tokens."

---

### 5. Edit and Delete Operations

**Test Case 5.1: Edit Receipt Data**

**Steps:**
1. Find purchase with receipt data
2. Click "Edit" button
3. Modify fields:
   - Change Energy Cost from 1285.00 to 1300.00
   - Change Total Amount from 1554.85 to 1569.85
4. Save changes

**Expected Results:**
- ✅ Fields update successfully
- ✅ `updatedAt` timestamp changes
- ✅ Recalculated exchange rate reflects changes
- ✅ Audit trail preserved

---

**Test Case 5.2: Delete Receipt Data**

**Steps:**
1. Find purchase with receipt data
2. Click "Delete Receipt" button
3. Confirm deletion

**Expected Results:**
- ✅ Receipt data removed from database
- ✅ Purchase still exists
- ✅ Receipt badge removed from UI
- ✅ No orphaned records

---

**Test Case 5.3: Cascade Delete Purchase**

**Steps:**
1. Find purchase with receipt data
2. Delete entire purchase
3. Confirm deletion

**Expected Results:**
- ✅ Purchase deleted
- ✅ Receipt data auto-deleted (CASCADE)
- ✅ No orphaned receipt records
- ✅ Both tables updated correctly

**Verification:**
```sql
-- Should return 0 rows
SELECT * FROM receipt_data WHERE "purchaseId" = '<deleted_purchase_id>';
```

---

### 6. Invalid Data Handling

**Test Case 6.1: Negative Numbers**

**Test:**
- kWh: `-100`
- Energy Cost: `-500`
- Total Amount: `-1000`

**Expected:**
- ✅ Validation error: "Must be a positive number"
- ✅ Form submission blocked
- ✅ Error displayed next to field

---

**Test Case 6.2: Invalid Dates**

**Test:**
- `2025-13-45` (invalid month/day)
- `2026-01-01` (future date)
- `abc123` (non-date string)

**Expected:**
- ✅ Date validation error
- ✅ Clear error message
- ✅ Suggested format shown

---

**Test Case 6.3: Missing Required Fields**

**Test:**
- Leave kWh Purchased empty
- Leave Total Amount empty
- Leave Transaction Date/Time empty

**Expected:**
- ✅ "Required field" errors
- ✅ Submit button disabled
- ✅ Fields highlighted in red

---

**Test Case 6.4: Extremely Large Numbers**

**Test:**
- kWh: `999999999`
- Total Amount: `999999999999`

**Expected:**
- ✅ Warning about unrealistic values
- ✅ Confirmation required
- ✅ Values stored if confirmed

---

### 7. User Interface Testing

**Test Case 7.1: Responsive Design**

**Desktop (1920x1080):**
- ✅ All tables fit properly
- ✅ Charts display full width
- ✅ No horizontal scrolling

**Tablet (768x1024):**
- ✅ Tables stack appropriately
- ✅ Charts resize correctly
- ✅ Mobile view triggers

**Mobile (375x667):**
- ✅ Card views replace tables
- ✅ Touch targets ≥44px
- ✅ Forms usable on small screens

---

**Test Case 7.2: Dark Mode**

**Steps:**
1. Toggle dark mode in user settings
2. Visit all receipt-related pages

**Expected:**
- ✅ All text readable
- ✅ Proper contrast ratios
- ✅ Charts render correctly
- ✅ No white backgrounds bleeding

---

### 8. API Testing

**Test Case 8.1: Create Receipt Data API**

**Endpoint:** `POST /api/receipt-data`

**Test Request:**
```bash
curl -X POST http://localhost:3000/api/receipt-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "purchaseId": "<purchase_id>",
    "tokenNumber": "1234 5678 9012 3456 7890",
    "accountNumber": "37266905928",
    "kwhPurchased": 200,
    "energyCostZWG": 1285.00,
    "debtZWG": 0,
    "reaZWG": 77.10,
    "vatZWG": 192.75,
    "totalAmountZWG": 1554.85,
    "tenderedZWG": 1555.00,
    "transactionDateTime": "2025-11-01T14:30:00Z"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Receipt data created successfully",
  "receiptData": {
    "id": "...",
    "purchaseId": "...",
    "tokenNumber": "1234 5678 9012 3456 7890",
    ...
  }
}
```

---

**Test Case 8.2: Dual-Currency Analysis API**

**Endpoint:** `GET /api/receipt-data/dual-currency-analysis?timeRange=30d`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-01T00:00:00Z",
      "usdCost": 25.00,
      "zwgCost": 1554.85,
      "zwgRate": 62.194,
      "tokensKwh": 200,
      "usdPerKwh": 0.125,
      "zwgPerKwh": 7.77425
    }
  ],
  "summary": {
    "avgUsdPerKwh": 0.125,
    "avgZwgPerKwh": 7.77,
    "avgExchangeRate": 62.19,
    ...
  }
}
```

---

**Test Case 8.3: Historical Analysis API**

**Endpoint:** `GET /api/receipt-data/analyze-historical`

**Expected Response (200):**
```json
{
  "success": true,
  "analysis": {
    "summary": {
      "totalReceipts": 10,
      "avgZwgPerKwh": 7.65,
      "dateRange": {...}
    },
    "trends": [
      {
        "month": "2025-11",
        "avgZwgPerKwh": 7.77,
        "minZwgPerKwh": 7.50,
        "maxZwgPerKwh": 8.10,
        "direction": "rising",
        "changePercent": 3.5
      }
    ],
    "anomalies": [
      {
        "date": "2025-11-15",
        "zwgPerKwh": 9.50,
        "deviation": 26.7,
        "type": "spike",
        "severity": "high"
      }
    ],
    "recommendations": [
      "⚠️ ZWG rates have risen 15% over the last 3 months..."
    ]
  }
}
```

---

## 🐛 Known Issues & Limitations

1. **Batch Size:** Bulk import limited to 500 receipts per file
2. **Matching:** Requires purchases to exist before importing receipts
3. **Time Zone:** All dates stored in UTC, may need timezone conversion
4. **Exchange Rate:** Calculated from receipt data, not fetched from external API
5. **Historical Data:** Analysis requires minimum 3 receipts for trends

---

## 📊 Test Results Template

| Test Case | Status | Notes | Tester | Date |
|-----------|--------|-------|--------|------|
| 1.1 Create with Receipt | ⏳ | | | |
| 1.2 Create without Receipt | ⏳ | | | |
| 1.3 Field Validation | ⏳ | | | |
| 2.1 Exchange Rate Calc | ⏳ | | | |
| 2.2 Cost per kWh Calc | ⏳ | | | |
| 3.1 Small CSV Import | ⏳ | | | |
| 3.2 Large CSV Import | ⏳ | | | |
| 3.3 Matching Accuracy | ⏳ | | | |
| 4.1 Trend Detection | ⏳ | | | |
| 4.2 Anomaly Detection | ⏳ | | | |
| 4.3 Recommendations | ⏳ | | | |
| 5.1 Edit Receipt | ⏳ | | | |
| 5.2 Delete Receipt | ⏳ | | | |
| 5.3 Cascade Delete | ⏳ | | | |
| 6.1 Negative Numbers | ⏳ | | | |
| 6.2 Invalid Dates | ⏳ | | | |
| 6.3 Missing Fields | ⏳ | | | |
| 6.4 Large Numbers | ⏳ | | | |
| 7.1 Responsive Design | ⏳ | | | |
| 7.2 Dark Mode | ⏳ | | | |
| 8.1 Create API | ⏳ | | | |
| 8.2 Analysis API | ⏳ | | | |
| 8.3 Historical API | ⏳ | | | |

**Legend:**
- ⏳ Not Started
- 🔄 In Progress
- ✅ Passed
- ❌ Failed
- ⚠️ Passed with Issues

---

## 📝 Notes

- All timestamps in UTC
- Test with both USER and ADMIN roles
- Clear browser cache between major test runs
- Check console for errors during testing
- Monitor network tab for API response times

---

**END OF TESTING GUIDE**
