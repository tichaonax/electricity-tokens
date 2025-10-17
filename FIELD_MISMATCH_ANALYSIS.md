# Comprehensive Field Mismatch Analysis

## Issue Summary
The Prisma schema defines the TokenPurchase relation field as `user`, but code throughout the application references it as `creator`.

## Schema Definition (Source of Truth)
```prisma
model TokenPurchase {
  id           String             @id
  totalTokens  Float
  totalPayment Float
  meterReading Float
  purchaseDate DateTime
  isEmergency  Boolean            @default(false)
  createdBy    String              // Foreign key field
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  user         User               @relation(fields: [createdBy], references: [id])  // ✅ Relation field name is "user"
  contribution UserContribution?
}
```

**CORRECT FIELD NAME: `user`** (not `creator`)

---

## Files Requiring Fixes

### API Routes (11 files)

#### 1. ✅ FIXED: `src/app/api/purchases/route.ts`
- **Status**: Fixed (4 occurrences)
- **Lines**: 132, 94, 107-114, 289
- **Usage**: Prisma include, where clause, orderBy, select

#### 2. `src/app/api/purchases/[id]/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Need to check if it uses `creator` in include/select

#### 3. `src/app/api/export/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Export functionality likely includes purchase data

#### 4. `src/app/api/debug-export/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Debug export may include purchase data

#### 5. `src/app/api/export-debug/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Export debug may include purchase data

#### 6. `src/app/api/test-export-simple/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Test export may include purchase data

#### 7. `src/app/api/backup/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Backup functionality likely includes all data

#### 8. `src/app/api/test-data/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Test data seeding

#### 9. `src/app/api/cost-analysis/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Cost analysis may query purchases

#### 10. `src/app/api/admin/database-performance/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Performance monitoring

#### 11. `src/app/api/admin/database-performance/optimize/route.ts`
- **Status**: NEEDS FIX
- **Search Required**: Database optimization

---

### Frontend Components (4 files)

#### 1. ✅ FIXED: `src/components/purchase-history-table.tsx`
- **Status**: Fixed (4 occurrences)
- **Lines**: Interface definition, ResponsiveTable column, hidden table display, permissions check
- **Usage**: TypeScript interface, component rendering

#### 2. `src/app/dashboard/purchases/page.tsx`
- **Status**: NEEDS FIX
- **Search Required**: Main purchases page

#### 3. `src/app/dashboard/purchases/edit/[id]/page.tsx`
- **Status**: NEEDS FIX
- **Search Required**: Purchase edit page

#### 4. `src/components/contribution-form.tsx`
- **Status**: NEEDS FIX
- **Search Required**: Contribution form component

---

### Library/Utility Files (2 files)

#### 1. `src/lib/validations.ts`
- **Status**: NEEDS FIX
- **Search Required**: Validation schemas and types

#### 2. `src/lib/backup.ts`
- **Status**: NEEDS FIX
- **Search Required**: Backup utility functions

---

## Fix Strategy

### Phase 1: Analyze Each File
For each file above, determine:
1. **Exact line numbers** where `creator` is used
2. **Context** of usage (Prisma query, TypeScript interface, component prop, etc.)
3. **Related code** that depends on the field name

### Phase 2: Systematic Fixes
Fix files in this order to minimize cascading issues:
1. Library/utility files first (validations, backup)
2. API routes (data layer)
3. Frontend components (presentation layer)

### Phase 3: Verification
1. Type check: `npx tsc --noEmit`
2. Build: `npm run build`
3. Runtime test: Start service and test each affected endpoint/page

---

## Detailed Analysis Results

### ✅ ALREADY FIXED
1. `src/app/api/purchases/route.ts` - 4 occurrences fixed
2. `src/components/purchase-history-table.tsx` - 4 occurrences fixed

### 📋 COMPLETE FIX LIST

#### Library Files (2 files, 3 occurrences)

**1. src/lib/validations.ts**
- Line 151: Enum value in validation schema
  ```typescript
  .enum(['purchaseDate', 'totalTokens', 'totalPayment', 'creator'])
  ```
  **Fix**: Keep as 'creator' - this is an API parameter name for sorting, not a Prisma field

**2. src/lib/backup.ts**
- Line 81: Prisma include in backup query
- Line 250: Prisma include in backup query
  ```typescript
  creator: { select: { id: true, name: true, email: true } }
  ```
  **Fix**: Change to `user`

#### API Routes (9 files, 23 occurrences)

**3. src/app/api/purchases/[id]/route.ts**
- Line 260: Prisma include
- Line 389: Comment mentions "creator"
- Line 477: Prisma include
- Line 655: Comment mentions "creator"
  **Fix**: Change Prisma includes to `user`, update comments

**4. src/app/api/export/route.ts**
- Line 246: Prisma include
- Line 280: Access `purchase.creator.name`
- Line 281: Access `purchase.creator.email`
- Line 319: Prisma include
- Line 361: Access `purchase.creator.name`
- Line 362: Access `purchase.creator.email`
  **Fix**: Change all to `user`

**5. src/app/api/backup/route.ts**
- Line 46: TypeScript interface
- Line 206: Prisma include
- Line 534-541: Variable name and logic (uses creator.email)
- Line 584: Uses creator.id
  **Fix**: Change all to `user`

**6. src/app/api/test-export-simple/route.ts**
- Line 17: Prisma include
- Line 56: Access `purchase.creator.name`
- Line 57: Access `purchase.creator.email`
  **Fix**: Change all to `user`

**7. src/app/api/debug-export/route.ts**
- Line 33: Prisma include
- Line 49: Access `purchase.creator.name`
  **Fix**: Change all to `user`

**8. src/app/api/export-debug/route.ts**
- Line 20: Prisma include
- Line 57: Access `purchase.creator.name`
- Line 58: Access `purchase.creator.email`
  **Fix**: Change all to `user`

**9. src/app/api/test-data/route.ts**
- Line 9: Prisma include
  **Fix**: Change to `user`

**10. src/app/api/cost-analysis/route.ts**
- Line 136: Prisma include
  **Fix**: Change to `user`

**11. src/app/api/admin/database-performance/route.ts**
- Line 30-31: Index name and description (metadata only)
  **Fix**: NO CHANGE NEEDED - this is just index naming

**12. src/app/api/admin/database-performance/optimize/route.ts**
- Line 12-13: SQL CREATE INDEX statement
  **Fix**: NO CHANGE NEEDED - this is just index naming

#### Frontend Components (4 files, 4 occurrences)

**13. src/app/dashboard/purchases/page.tsx**
- Line 15: TypeScript interface
- Line 196: Access `purchase.creator.name`
  **Fix**: Change all to `user`

**14. src/app/dashboard/purchases/edit/[id]/page.tsx**
- Line 17: TypeScript interface
  **Fix**: Change to `user`

**15. src/components/contribution-form.tsx**
- Line 60: TypeScript interface
  **Fix**: Change to `user`

---

## Systematic Fix Plan

### Phase 1: Library Files ✅
- [ ] src/lib/backup.ts (2 occurrences - lines 81, 250)
- [ ] src/lib/validations.ts (SKIP - API parameter name)

### Phase 2: API Routes ✅
- [ ] src/app/api/purchases/[id]/route.ts (4 occurrences)
- [ ] src/app/api/export/route.ts (6 occurrences)
- [ ] src/app/api/backup/route.ts (6 occurrences)
- [ ] src/app/api/test-export-simple/route.ts (3 occurrences)
- [ ] src/app/api/debug-export/route.ts (2 occurrences)
- [ ] src/app/api/export-debug/route.ts (3 occurrences)
- [ ] src/app/api/test-data/route.ts (1 occurrence)
- [ ] src/app/api/cost-analysis/route.ts (1 occurrence)

### Phase 3: Frontend Components ✅
- [ ] src/app/dashboard/purchases/page.tsx (2 occurrences)
- [ ] src/app/dashboard/purchases/edit/[id]/page.tsx (1 occurrence)
- [ ] src/components/contribution-form.tsx (1 occurrence)

### Phase 4: Verification ✅
- [ ] TypeScript check: `npx tsc --noEmit`
- [ ] Build: `npm run build`
- [ ] Test affected endpoints

---

## Total Impact
- **Files to fix**: 13 files
- **Total changes**: ~35 occurrences
- **Critical paths**: All purchase-related API endpoints and frontend pages
