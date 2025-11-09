# Your Purchase and Receipt Data - Explained

## ✅ Your Recent Purchase with Receipt Data

**Your Purchase ID:** `cmhquywivkadji5ufk10a1lv0nk9lkv`

**Receipt Details:**
- **Token Number:** 37266905928
- **Total kWh:** 203.21
- **Total Payment:** $51
- **Purchase Date:** October 16, 2025
- **Created:** November 8, 2025 at 22:30:47

### View Your Purchase with Receipt:

```bash
curl http://localhost:3000/api/purchases/cmhquywivkadji5ufk10a1lv0nk9lkv
```

Or in your browser (you need to be logged in):
```
http://localhost:3000/api/purchases/cmhquywivkadji5ufk10a1lv0nk9lkv
```

---

## 📊 About the "2024 Data" in Reports

### This is NOT Static Data - It's Real Database Data!

Your database currently contains:
- **3 purchases from 2024** (likely test/seed data)
- **15 purchases from 2025** (including your recent ones)

The reports API (`/api/reports/usage`) queries your **actual database** and shows:
- All purchases unless you filter by date range
- Monthly trends, cost analysis, etc. calculated from real data

### Why You See 2024 Data:

When you visit `/dashboard/reports/usage` without selecting a date range, it shows **ALL** data in the database, including the 3 purchases from 2024.

---

## 🎯 How to Filter Reports to Show Only 2025 Data

### Option 1: Use the Date Range Filter on the Reports Page

1. Go to: `http://localhost:3000/dashboard/reports/usage`
2. Click the date inputs at the top
3. Set **Start Date:** `2025-01-01`
4. Set **End Date:** `2025-12-31`
5. Reports will now show only 2025 data

### Option 2: Use Quick Filters

The reports page has quick filter buttons:
- **This Month** - Shows only November 2025
- **Last 3 Months** - Shows Sep-Nov 2025
- **All Time** - Shows everything (including 2024)

### Option 3: Query the API Directly

```bash
# Get usage trends for 2025 only
curl "http://localhost:3000/api/reports/usage?type=monthly-trends&startDate=2025-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.999Z"
```

---

## 🗑️ Clean Up Test Data (Optional)

If you want to remove the 2024 test data:

### Check what's in 2024:

```bash
PGPASSWORD=postgres psql -U postgres -d electricity_tokens -c "SELECT id, \"purchaseDate\", \"totalTokens\", \"totalPayment\" FROM token_purchases WHERE DATE_PART('year', \"purchaseDate\") = 2024;"
```

### Delete 2024 test purchases (if you want):

```bash
PGPASSWORD=postgres psql -U postgres -d electricity_tokens -c "DELETE FROM token_purchases WHERE DATE_PART('year', \"purchaseDate\") = 2024;"
```

**⚠️ Warning:** This will permanently delete the 2024 purchases. Only do this if they're test data!

---

## 📈 Your Current Database Contents

### Purchases by Year:
- **2024:** 3 purchases (test/seed data?)
- **2025:** 15 purchases (real data)

### Recent Purchases Created Today (Nov 8, 2025):

1. **cmhquywivkadji5ufk10a1lv0nk9lkv**
   - Purchase Date: Oct 16, 2025
   - Tokens: 203.21 kWh
   - Payment: $51
   - ✅ **Has Receipt Data** (Token #37266905928)

2. **purchase-1762621903025**
   - Purchase Date: Oct 16, 2025
   - Tokens: 203.21 kWh
   - Payment: $20
   - ❌ No Receipt Data

---

## 🔍 How to Verify Your Receipt Data Exists

### Method 1: Check via Purchase ID

```bash
# Using curl (replace with your actual purchase ID)
curl http://localhost:3000/api/purchases/cmhquywivkadji5ufk10a1lv0nk9lkv

# You should see:
{
  "id": "cmhquywivkadji5ufk10a1lv0nk9lkv",
  "totalTokens": 203.21,
  "totalPayment": 51,
  "purchaseDate": "2025-10-16T00:00:00.000Z",
  "receiptData": {
    "id": "cmhquywj900011pmouix9wbn5",
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

### Method 2: Query Database Directly

```bash
PGPASSWORD=postgres psql -U postgres -d electricity_tokens -c "SELECT * FROM receipt_data WHERE \"purchaseId\" = 'cmhquywivkadji5ufk10a1lv0nk9lkv';"
```

### Method 3: View All Receipts

```bash
PGPASSWORD=postgres psql -U postgres -d electricity_tokens -c "SELECT rd.\"tokenNumber\", rd.\"kwhPurchased\", rd.\"totalAmountZWG\", tp.\"purchaseDate\" FROM receipt_data rd JOIN token_purchases tp ON rd.\"purchaseId\" = tp.id ORDER BY tp.\"purchaseDate\" DESC;"
```

---

## 📊 Understanding the Reports

### Monthly Trends Report
Shows aggregated data by month:
- Total tokens purchased
- Total tokens consumed (from contributions)
- Total payment
- Emergency vs regular purchases
- Utilization rate

**Why 2024 shows up:** The database has 3 purchases from 2024, so they're included in "All Time" view.

### Cost Analysis Report
Shows cost per kWh over time:
- Individual purchase costs
- Running average
- Emergency premium

**Why 2024 shows up:** Same reason - it's querying all purchases.

### How Reports Get Data:

```typescript
// From /api/reports/usage/route.ts
async function getMonthlyUsageTrends(startDate?: string, endDate?: string) {
  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  // If no date filter, shows ALL purchases (including 2024)
  const whereClause = Object.keys(dateFilter).length > 0
    ? { purchaseDate: dateFilter }
    : {};

  const purchases = await prisma.tokenPurchase.findMany({
    where: whereClause,
    // ... rest of query
  });
}
```

---

## ✅ Summary

1. **Your Receipt is Saved:** ✅ Purchase ID `cmhquywivkadji5ufk10a1lv0nk9lkv` has receipt data
2. **Reports Show Real Data:** ✅ NOT static - queried from your database
3. **2024 Data Exists:** ✅ 3 purchases from 2024 (probably test data)
4. **Solution:** Use date range filters to show only 2025 data
5. **Duplicate Prevention:** ✅ Already working (unique constraint on purchaseId)

### Next Steps:

1. **View your receipt:**
   ```
   http://localhost:3000/api/purchases/cmhquywivkadji5ufk10a1lv0nk9lkv
   ```

2. **Filter reports to 2025 only:**
   - Go to `/dashboard/reports/usage`
   - Set start date: 2025-01-01
   - Set end date: 2025-12-31

3. **(Optional) Clean up 2024 test data:**
   - Run the DELETE query above if those 3 purchases are just test data
