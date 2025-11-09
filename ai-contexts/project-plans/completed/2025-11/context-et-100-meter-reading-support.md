# Feature Development Session Template

> **Template Type:** Feature Development  
> **Version:** 1.0  
> **Last Updated:** November 8, 2025

---

## 🎯 Purpose

For creating new features, screens, or endpoints with structured planning.

---

## 📋 Required Context Documents

**IMPORTANT:** Before starting this session, load the following context documents **IN THE EXACT ORDER LISTED BELOW**.

### Core Contexts (Load in this EXACT order - ONE AT A TIME)

**CRITICAL:** Read these files sequentially. Do not proceed to the next document until you have fully read and understood the previous one.

1. **FIRST:** `ai-contexts/master-context.md` - General principles and conventions
   - ⚠️ Contains critical instruction to read code-workflow.md
   - ⚠️ Defines operating principles
   - ⚠️ Contains mandatory workflow enforcement
   - ⚠️ Defines example adherence requirements

2. **SECOND:** `ai-contexts/code-workflow.md` - Standard workflow and task tracking
   - Contains MANDATORY workflow requirements
   - Requires creating project plan BEFORE any code changes
   - Defines approval checkpoint process

### Feature-Specific Contexts (Load as needed after core contexts)

- `ai-contexts/frontend/component-context.md` - For UI component development
- `ai-contexts/frontend/ui-context.md` - For UI consistency and styling
- `ai-contexts/backend/backend-api-context.md` - For API endpoint development
- `ai-contexts/backend/database-context.md` - For database schema changes
- `ai-contexts/testing/unit-testing-context.md` - For test coverage

### Optional Contexts

- Domain-specific contexts based on the module being developed

**How to load:** Use the Read tool to load each relevant context document before beginning work.

---

## 🚀 Session Objective

**Ticket:** ET-100

**Feature Name:** Add support for electricity supply true purchase time meter reading

**Feature Description:**

We want to extend the current functionality of meter readings to support dual-currency tracking. The electricity provider now provides official receipts showing purchase details in ZWG currency. We need to capture this official data while maintaining our internal USD payment tracking system.

**Problem Being Solved:**

- Current system only tracks USD payments and basic meter readings
- No visibility into official provider pricing (ZWG currency)
- Cost calculations don't reflect true electricity cost from provider
- Unable to compare what users pay internally vs actual provider charges
- Forecasting is limited without historical official pricing data

**Receipt Data to Capture (from provider receipt):**

- Token Number (e.g., 6447 1068 4258 9659 8834)
- Account Number (one-time capture, e.g., Meter 37266905928)
- kWh Purchased (e.g., 203.21 kWh)
- Energy Cost in ZWG (e.g., ZWG1306.60)
- Arrears/Debt in ZWG (e.g., ZWG0.00)
- REA (Regulatory levy) in ZWG (e.g., ZWG78.40)
- VAT in ZWG (e.g., ZWG195.99)
- Total Amount in ZWG (e.g., ZWG1580.99)
- Amount Tendered in ZWG (e.g., ZWG1581.00)
- Transaction Date/Time (format: dd/mm/yyyy hh:mm:ss, e.g., 16/10/25 14:02:36)

**Dual System Approach:**

- **Internal System (USD)**: Continue tracking user contributions in US dollars (existing behavior)
- **Official System (ZWG)**: Track provider's official receipt data for true cost analysis
- **Integration**: Use ZWG data to improve cost calculations and forecasting when available
- **Fallback**: If no receipt data, continue using existing USD-only algorithm

**Historical Receipt Data:**

- Users will receive historical receipts from the power company
- System must support entering receipt data for existing purchases retroactively
- Need ability to bulk import historical receipt data (CSV upload)
- Post-import analysis to recalculate cost trends and identify patterns
- Historical data will improve forecasting accuracy

**Future Enhancement (Out of Scope for Phase 1):**

- Image upload and OCR for automatic receipt data extraction
- Phase 1 focuses on manual entry with proper validation and historical data support

**Target Module/Component:**

**Backend:**

- Database: New `receipt_data` table with one-to-one relationship to `token_purchases`
- API: New `/api/receipt-data` endpoints (CRUD operations)
- Services: Enhanced cost calculation algorithm supporting dual-currency
- Validation: Zod schemas for receipt data fields

**Frontend:**

- Purchase form: Optional collapsible "Official Receipt Data" section
- Dashboard: Dual-currency summary cards (USD + ZWG)
- History table: ZWG badge indicator when receipt data exists
- Cost analysis: Charts comparing USD payments vs ZWG official costs
- Forecasting: New component showing estimated costs based on ZWG trends

**Shared:**

- Types: New TypeScript interfaces for receipt data
- Utils: ZWG currency formatter, date/time parser for dd/mm/yyyy format
- Algorithms: Updated cost calculations using ZWG data when available

**API Endpoints (if applicable):**

**New Endpoints:**

- `POST /api/receipt-data` - Create receipt data for a purchase
- `GET /api/receipt-data?purchaseId={id}` - Get receipt data by purchase ID
- `PUT /api/receipt-data/{id}` - Update receipt data
- `DELETE /api/receipt-data/{id}` - Delete receipt data
- `POST /api/receipt-data/bulk-import` - Bulk import historical receipt data (CSV)
- `POST /api/receipt-data/analyze-historical` - Trigger post-import analysis

**Modified Endpoints:**

- `POST /api/purchases` - Accept optional `receiptData` object in request body
- `GET /api/purchases` - Include `receiptData` in response when available
- `GET /api/purchases/{id}` - Include full receipt data in detailed view
- `PUT /api/purchases/{id}` - Support updating receipt data alongside purchase

**UI/UX Requirements:**

**Purchase Creation Form:**

- Add collapsible section titled "Official Receipt Data (Optional)"
- Section contains all receipt fields with proper labels and validation
- Visual indicator showing which fields are required vs optional
- Format hints (e.g., "Date format: dd/mm/yyyy hh:mm:ss")
- Real-time validation with helpful error messages
- Preview of entered data before submission

**Purchase History Table:**

- Show small ZWG badge/icon for purchases with receipt data
- Clicking badge expands to show full receipt details
- Dual-currency display: "$15.00 USD / ZWG1580.99"

**Dashboard:**

- Two summary cards side-by-side:
  - "Your Contributions (USD)" - existing card
  - "Official Provider Cost (ZWG)" - new card showing sum of receipt data
- Exchange rate indicator if available
- Variance percentage between USD paid vs ZWG actual cost

**Cost Analysis Page:**

- New chart: "USD vs ZWG Cost Trends Over Time"
- Comparison table showing:
  - Date, kWh purchased, USD paid, ZWG official cost, Variance %
- Color coding: green (underpaid), red (overpaid), yellow (close match)

**Forecasting Component (New):**

- "Estimated Next Purchase Cost" based on:
  - Historical ZWG per kWh average
  - Recent consumption trends
  - Projected kWh needed
- Confidence level indicator (low/medium/high based on data availability)

**Historical Receipt Import:**

- CSV upload interface for bulk importing historical receipt data
- Template download for CSV format (with headers and example row)
- Preview screen showing parsed data before import
- Validation report identifying issues (missing purchase IDs, invalid data)
- Match receipt data to existing purchases by date/meter reading
- Progress indicator during bulk import
- Summary report after import (X successful, Y failed, Z warnings)
- Option to rollback import if errors detected

**Mobile Responsive:**

- Receipt form should work on mobile (stacked layout)
- ZWG badge tappable on mobile to expand details
- Dashboard cards stack vertically on small screens
- CSV upload works on mobile (file picker)

**Acceptance Criteria:**

**Functional Requirements:**

1. ✅ Users can create a purchase without receipt data (backward compatible)
2. ✅ Users can optionally add receipt data when creating a purchase
3. ✅ All receipt fields from provider receipt can be captured and stored
4. ✅ Receipt data can be added to existing purchases retroactively (one-by-one)
5. ✅ Receipt data can be edited and deleted
6. ✅ System validates receipt data (positive numbers, valid dates, etc.)
7. ✅ Purchase history shows indicator when receipt data exists
8. ✅ Dashboard displays dual-currency summary (USD + ZWG)
9. ✅ Cost calculations use ZWG data when available, fallback to USD otherwise
10. ✅ Cost analysis shows comparison between USD and ZWG
11. ✅ Bulk import historical receipt data via CSV upload
12. ✅ System matches receipt data to existing purchases automatically
13. ✅ Import validation prevents duplicate or invalid receipt data
14. ✅ Post-import analysis recalculates all cost metrics and trends
15. ✅ Historical analysis identifies patterns in ZWG pricing over time

**Data Integrity:**

1. ✅ Receipt data is optional - purchases work without it
2. ✅ One receipt data record per purchase (one-to-one relationship)
3. ✅ Deleting purchase cascades to delete receipt data
4. ✅ Deleting receipt data doesn't affect purchase record
5. ✅ All currency amounts stored with 2 decimal precision
6. ✅ Date/time stored in ISO format internally (converted from dd/mm/yyyy input)

**User Experience:**

1. ✅ Receipt data entry takes < 3 minutes for average user
2. ✅ Form provides helpful validation errors (not just "invalid")
3. ✅ Mobile users can enter receipt data without horizontal scrolling
4. ✅ Dark mode compatibility for all new components
5. ✅ Loading states shown during API calls
6. ✅ Success/error notifications appear after save/update/delete

**Performance:**

1. ✅ API endpoints respond in < 500ms (95th percentile)
2. ✅ Purchase list with receipt data loads in < 2 seconds
3. ✅ Dashboard with dual-currency cards loads in < 1.5 seconds
4. ✅ No performance degradation for users without receipt data

**Business Logic:**

1. ✅ Cost algorithm correctly calculates ZWG cost per kWh
2. ✅ Dual-currency comparison accurately identifies overpayment/underpayment
3. ✅ Forecasting uses weighted average of recent ZWG rates
4. ✅ System handles edge cases (zero debt, exact tender amount, etc.)

**Testing:**

1. ✅ Unit tests cover receipt data validation
2. ✅ Integration tests verify API CRUD operations
3. ✅ Integration tests verify bulk import with various CSV formats
4. ✅ E2E test creates purchase with receipt data and verifies display
5. ✅ E2E test bulk imports historical data and verifies post-import analysis
6. ✅ Manual testing with actual receipt data from provider
7. ✅ Manual testing with sample historical CSV (10+ receipts)
8. ✅ Accessibility testing (WCAG 2.1 Level AA)

---

## 📐 Technical Specifications

**Technologies:**

- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui components
- **Validation**: Zod schemas for runtime type checking
- **Date Handling**: date-fns library for parsing dd/mm/yyyy format
- **Charts**: Chart.js / recharts for dual-currency visualizations

**Dependencies:**

- No new external packages required (use existing stack)
- Existing dependencies sufficient for implementation:
  - `@prisma/client` - Database ORM
  - `zod` - Schema validation
  - `date-fns` - Date parsing and formatting
  - `react-hook-form` - Form state management
  - `lucide-react` - Icons (badge, currency symbols)

**Data Models:**

**New Model: ReceiptData**

```prisma
model ReceiptData {
  id                  String        @id @default(cuid())
  purchaseId          String        @unique
  tokenNumber         String?       // e.g., "6447 1068 4258 9659 8834"
  accountNumber       String?       // e.g., "37266905928"
  kwhPurchased        Float         // e.g., 203.21
  energyCostZWG       Float         // e.g., 1306.60
  debtZWG             Float         // e.g., 0.00
  reaZWG              Float         // e.g., 78.40 (Regulatory levy)
  vatZWG              Float         // e.g., 195.99
  totalAmountZWG      Float         // e.g., 1580.99
  tenderedZWG         Float         // e.g., 1581.00
  transactionDateTime DateTime      // Parsed from dd/mm/yyyy hh:mm:ss
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  purchase            TokenPurchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)

  @@map("receipt_data")
}
```

**Modified Model: TokenPurchase**

```prisma
model TokenPurchase {
  // ... existing fields ...
  receiptData ReceiptData? // One-to-one optional relationship
}
```

**Integration Points:**

- **Token Purchases**: Receipt data links to existing purchase records
- **Cost Calculations**: `src/lib/cost-calculations.ts` enhanced to use ZWG data
- **Dashboard**: `src/components/user-dashboard.tsx` shows dual-currency summary
- **Reports**: Cost analysis and forecasting components consume receipt data
- **Export/Import**: CSV export should include receipt data when available

---

## 🧪 Testing Requirements

**Unit Tests:**

1. **Receipt Data Validation** (`src/lib/validations.ts`)
   - Test Zod schema validates all required fields
   - Test positive number validation for currency fields
   - Test date/time parsing from dd/mm/yyyy hh:mm:ss format
   - Test optional fields (tokenNumber, accountNumber)
   - Test edge cases (zero debt, exact tender amount)

2. **Cost Algorithm** (`src/lib/cost-algorithm-v2.ts`)
   - Test ZWG cost per kWh calculation
   - Test dual-currency comparison logic
   - Test fallback to USD when no receipt data
   - Test overpayment/underpayment identification
   - Test forecasting with weighted averages

3. **Currency Formatting** (`src/lib/utils.ts`)
   - Test ZWG formatting (2 decimal places, proper symbol)
   - Test dual-currency display formatting
   - Test large numbers (millions)
   - Test zero and negative numbers (error cases)

**Integration Tests:**

1. **API Endpoints** (`src/app/api/receipt-data/`)
   - POST: Create receipt data successfully
   - POST: Validation errors return 400 with messages
   - GET: Retrieve receipt data by purchase ID
   - GET: Return 404 when receipt data doesn't exist
   - PUT: Update receipt data successfully
   - PUT: Prevent updating non-existent receipt data
   - DELETE: Remove receipt data, preserve purchase
   - DELETE: Cascade delete when purchase is deleted

2. **Purchase with Receipt Data** (`src/app/api/purchases/`)
   - POST purchase with receipt data creates both records atomically
   - POST purchase without receipt data works (backward compatible)
   - GET purchase includes receipt data when available
   - PUT purchase can update receipt data
   - Database transaction rollback on validation failure

**E2E Tests:**

1. **Happy Path: Create Purchase with Receipt Data**
   - Navigate to create purchase form
   - Fill in basic purchase fields (tokens, payment, meter reading)
   - Expand "Official Receipt Data" section
   - Enter all receipt fields from sample receipt
   - Submit form
   - Verify success message
   - Verify purchase appears in history with ZWG badge
   - Click badge to expand receipt details
   - Verify all fields display correctly

2. **Add Receipt Data to Existing Purchase**
   - Create purchase without receipt data
   - Navigate to purchase details/edit page
   - Add receipt data
   - Save changes
   - Verify receipt data appears in history
   - Verify cost calculations updated

3. **Dual-Currency Dashboard Display**
   - Create multiple purchases with receipt data
   - Navigate to dashboard
   - Verify USD summary card shows correct total
   - Verify ZWG summary card shows correct total
   - Verify variance percentage calculation
   - Test on mobile device (responsive layout)

4. **Cost Analysis with Dual-Currency**
   - Navigate to cost analysis/reports page
   - Verify chart shows USD and ZWG trends
   - Verify comparison table displays correctly
   - Verify color coding (overpaid/underpaid)
   - Export data and verify receipt data included

5. **Bulk Import Historical Receipt Data**
   - Download CSV template
   - Fill in 10 historical receipts (matching existing purchases)
   - Upload CSV file
   - Verify preview shows all 10 records
   - Verify validation passes (or shows clear errors)
   - Confirm import
   - Wait for import completion (progress indicator)
   - Verify success summary (10/10 imported)
   - Navigate to purchase history
   - Verify all 10 purchases now have ZWG badges
   - Check cost analysis - verify historical trends updated
   - Verify forecasting improved with more data points

---

## 📝 Session Notes

**Receipt Example (from provider):**

```
Token: 6447 1068 4258 9659 8834
Meter: 37266905928
Kwh: 203.21
Energy: ZWG1306.60
Debt: ZWG0.00
REA: ZWG78.40
VAT: ZWG195.99
Total Amt: ZWG1580.99
Tendered: ZWG1581.00
Date: 16/10/25 14:02:36
```

**Design Decisions:**

1. **Optional Receipt Data**: Making receipt data optional ensures backward compatibility and doesn't force users to enter data they may not have.

2. **Separate Table**: Using a separate `receipt_data` table instead of adding columns to `token_purchases` keeps the schema clean and allows for future expansion without affecting existing queries.

3. **One-to-One Relationship**: Each purchase can have at most one official receipt. This prevents duplicate entries and maintains data integrity.

4. **Cascade Delete**: When a purchase is deleted, receipt data should also be deleted (no orphaned records). However, deleting receipt data alone should preserve the purchase.

5. **Date Storage**: Store internally as ISO DateTime but accept dd/mm/yyyy hh:mm:ss format from users (provider's format). Use date-fns for parsing.

6. **Currency Precision**: Store all ZWG amounts as Float with 2 decimal places (standard currency precision).

7. **Algorithm Fallback**: If receipt data doesn't exist, use existing USD-only algorithm. This ensures all purchases have cost calculations.

8. **Phase 1 Scope**: Manual entry only. Image upload/OCR is future enhancement (Phase 2).

**Constraints:**

- Must maintain backward compatibility with existing purchases
- No breaking changes to existing API endpoints
- Performance must not degrade for users without receipt data
- Mobile-first design for receipt data entry
- All new features must work in dark mode

**Risk Mitigation:**

1. **Manual Entry Errors**: Strong validation, format hints, preview before save
2. **Currency Conversion**: Allow manual exchange rate entry per purchase
3. **Algorithm Complexity**: Clear documentation, tooltips, comparison views
4. **Data Migration**: Not needed - additive change only

**Success Metrics:**

- 60% adoption rate (purchases with receipt data) within 1 month
- < 5% error rate in manual entry
- < 500ms API response time (95th percentile) for single operations
- Bulk import processes 100 receipts in < 30 seconds
- Post-import analysis completes in < 10 seconds for 100 receipts
- 90%+ automatic matching rate for historical receipts
- Positive user feedback on dual-currency feature
- Historical analysis provides actionable insights (price trends, seasonal patterns)

---

## 🔄 Requirements-Plan Sync

**Last Synced**: 2025-11-08  
**Sync Status**: ✅ IN SYNC

This requirements document has been synchronized with the project plan:
`ai-contexts/project-plans/active/projectplan-et-100-meter-reading-support-2025-11-08.md`

All technical specifications, API endpoints, UI/UX requirements, and acceptance criteria have been captured from the project plan analysis.

---

## ✅ Start Session

Ready to begin feature development. Please:

1. Review the feature requirements
2. Propose an implementation plan
3. Identify technical challenges or considerations
4. Suggest a testing strategy

---
