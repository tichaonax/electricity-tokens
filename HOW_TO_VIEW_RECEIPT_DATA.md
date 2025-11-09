# How to View and Manage Receipt Data

## ✅ Your receipt was saved successfully!

When you create a purchase with receipt data, it's automatically linked to the purchase.

---

## 1. View Receipt Data - Three Ways

### Method 1: View Specific Purchase with Receipt

**Endpoint:** `GET /api/purchases/{purchaseId}`

**Example:**
```bash
# Get purchase details including receipt data
curl http://localhost:3000/api/purchases/c1a2b3c4d5e6f7g8h9i0j1k2
```

**Response includes receipt data:**
```json
{
  "id": "c1a2b3c4d5e6f7g8h9i0j1k2",
  "totalTokens": 203.21,
  "totalPayment": 51,
  "meterReading": 750,
  "purchaseDate": "2025-10-16T00:00:00.000Z",
  "isEmergency": false,
  "receiptData": {
    "id": "clxyz123abc",
    "purchaseId": "c1a2b3c4d5e6f7g8h9i0j1k2",
    "tokenNumber": "37266905928",
    "accountNumber": "64471068425896598834",
    "kwhPurchased": 203.21,
    "energyCostZWG": 1306.6,
    "debtZWG": 0,
    "reaZWG": 78.4,
    "vatZWG": 195.99,
    "totalAmountZWG": 1580.99,
    "tenderedZWG": 1581,
    "transactionDateTime": "2025-10-16T14:02:36.000Z"
  }
}
```

---

### Method 2: List All Purchases with Receipts

**Endpoint:** `GET /api/purchases?includeReceipts=true`

**Example:**
```bash
# Get all your purchases with receipt data
curl http://localhost:3000/api/purchases?includeReceipts=true
```

---

### Method 3: Get Specific Receipt by Purchase ID

**Endpoint:** `GET /api/receipt-data?purchaseId={id}`

**Example:**
```bash
# Get just the receipt data for a specific purchase
curl http://localhost:3000/api/receipt-data?purchaseId=c1a2b3c4d5e6f7g8h9i0j1k2
```

---

## 2. Check if Receipt Data Exists

**Quick Check:**
```bash
# Try to get receipt data by purchase ID
curl http://localhost:3000/api/receipt-data?purchaseId=YOUR_PURCHASE_ID
```

**Responses:**
- **200 OK** - Receipt data exists (returns the receipt)
- **404 Not Found** - No receipt data for this purchase

---

## 3. Duplicate Prevention - Already Built In! ✅

### Database Level Protection
The `ReceiptData` table has a **UNIQUE constraint** on `purchaseId`:

```prisma
model ReceiptData {
  id         String @id @default(cuid())
  purchaseId String @unique  // ⬅️ This prevents duplicates!
  // ... other fields
}
```

### Application Level Protection

#### Scenario 1: Creating Purchase with Receipt (First Time)
✅ **Works** - Creates purchase and receipt together

#### Scenario 2: Trying to Add Receipt to Purchase That Already Has One
❌ **Blocked** - API returns:
```json
{
  "message": "Receipt data already exists for this purchase. Use PUT to update.",
  "status": 409
}
```

#### Scenario 3: Trying to Create Duplicate Receipt Directly
❌ **Blocked** - Database returns unique constraint violation error

---

## 4. Update Existing Receipt Data

If you need to update receipt data (e.g., fix a typo):

**Endpoint:** `PUT /api/receipt-data/{receiptId}`

**Example:**
```json
PUT /api/receipt-data/clxyz123abc
{
  "tokenNumber": "CORRECTED_TOKEN_NUMBER",
  "energyCostZWG": 1350.5
}
```

---

## 5. View in Dashboard

### Option A: Purchases Page
1. Go to: `http://localhost:3000/dashboard/purchases`
2. View your purchases list
3. Click on a purchase to see full details including receipt

### Option B: Receipts Page (if exists)
1. Go to: `http://localhost:3000/dashboard/receipts`
2. View all receipts with their associated purchases

---

## 6. Reports with Receipt Data

Now that `/dashboard/reports` is fixed, you can view:

### Usage Report
`http://localhost:3000/dashboard/reports/usage`
- Shows kWh consumption over time
- Includes receipt data if available

### Financial Report
`http://localhost:3000/dashboard/reports/financial`
- Dual-currency analysis (USD vs ZWG)
- Exchange rate trends
- Uses receipt data for ZWG amounts

### Efficiency Report
`http://localhost:3000/dashboard/reports/efficiency`
- Cost per kWh analysis
- Efficiency trends

---

## 7. Advanced: Bulk Receipt Analysis

### Dual-Currency Analysis
**Endpoint:** `GET /api/receipt-data/dual-currency-analysis`

**Query Parameters:**
- `timeRange`: `7d`, `30d`, `90d`, `1y`, `all`

**Example:**
```bash
curl http://localhost:3000/api/receipt-data/dual-currency-analysis?timeRange=30d
```

**Returns:**
```json
{
  "period": {
    "from": "2024-10-08T00:00:00.000Z",
    "to": "2025-11-08T00:00:00.000Z"
  },
  "summary": {
    "totalReceipts": 15,
    "totalKwh": 2500.5,
    "totalZWG": 18500.75,
    "totalUSD": 750.25,
    "averageRate": 24.65
  },
  "receipts": [...]
}
```

### Historical Analysis
**Endpoint:** `GET /api/receipt-data/analyze-historical`

**Returns:**
```json
{
  "summary": {
    "totalReceipts": 15,
    "totalKwh": 2500.5,
    "averageCostPerKwh": 7.40
  },
  "trends": [...],
  "anomalies": [...],
  "recommendations": [...]
}
```

---

## 8. Quick Verification Script

Create a simple test to verify your receipt exists:

```javascript
// test-receipt.js
async function checkReceipt(purchaseId) {
  const response = await fetch(
    `http://localhost:3000/api/purchases/${purchaseId}`
  );
  
  if (response.ok) {
    const data = await response.json();
    console.log('Purchase found!');
    console.log('Receipt data:', data.receiptData ? 'YES ✓' : 'NO ✗');
    if (data.receiptData) {
      console.log('Token Number:', data.receiptData.tokenNumber);
      console.log('Total ZWG:', data.receiptData.totalAmountZWG);
    }
  } else {
    console.log('Purchase not found');
  }
}

// Replace with your actual purchase ID
checkReceipt('YOUR_PURCHASE_ID_HERE');
```

---

## Summary

✅ **Receipt Saved:** Your receipt data is stored in the database  
✅ **Duplicate Prevention:** Database + API prevent duplicate receipts  
✅ **Viewing Options:** 3 ways to view (purchase endpoint, receipts endpoint, dashboard)  
✅ **Reports Fixed:** `/dashboard/reports` now redirects to usage report  
✅ **Update Capability:** Can update receipt data if needed (PUT endpoint)

**Next Steps:**
1. Note your purchase ID from the create response
2. Use `GET /api/purchases/{id}` to view purchase with receipt
3. Visit `http://localhost:3000/dashboard/reports/usage` to see reports
