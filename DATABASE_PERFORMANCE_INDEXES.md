# Database Performance Indexes

## Overview

This document describes the performance indexes added to optimize database query performance for the Electricity Tokens Tracker application.

## Index List

### 1. TokenPurchase_purchaseDate_idx
**Purpose**: Optimizes purchase date sorting queries
**SQL**: `CREATE INDEX IF NOT EXISTS "TokenPurchase_purchaseDate_idx" ON "token_purchases" ("purchaseDate" DESC);`
**Impact**: High - Significantly improves purchase history page load times
**Use Cases**: 
- Purchase history pagination
- Date-based filtering
- Default purchase list ordering

### 2. TokenPurchase_creator_name_idx
**Purpose**: Improves creator name search performance
**SQL**: `CREATE INDEX IF NOT EXISTS "TokenPurchase_creator_name_idx" ON "token_purchases" ("createdBy");`
**Impact**: Medium - Faster user-based purchase filtering
**Use Cases**:
- Filtering purchases by creator
- User-specific purchase queries
- Admin purchase reviews

### 3. TokenPurchase_isEmergency_idx
**Purpose**: Optimizes emergency purchase filtering
**SQL**: `CREATE INDEX IF NOT EXISTS "TokenPurchase_isEmergency_idx" ON "token_purchases" ("isEmergency");`
**Impact**: Low - Improves emergency purchase queries
**Use Cases**:
- Emergency purchase reports
- Cost analysis filtering
- Purchase categorization

### 4. TokenPurchase_date_range_idx
**Purpose**: Composite index for complex date range queries
**SQL**: `CREATE INDEX IF NOT EXISTS "TokenPurchase_date_range_idx" ON "token_purchases" ("purchaseDate" DESC, "isEmergency", "createdBy");`
**Impact**: High - Optimizes complex filtering operations
**Use Cases**:
- Date range queries with additional filters
- Combined search operations
- Report generation with multiple criteria

### 5. TokenPurchase_tokens_payment_idx
**Purpose**: Optimizes token and payment amount sorting
**SQL**: `CREATE INDEX IF NOT EXISTS "TokenPurchase_tokens_payment_idx" ON "token_purchases" ("totalTokens", "totalPayment");`
**Impact**: Low - Improves sorting by amounts
**Use Cases**:
- Sorting by purchase amount
- Token quantity analysis
- Financial reporting queries

## Migration Information

### Migration File
- **Location**: `prisma/migrations/20250708120000_add_performance_indexes/migration.sql`
- **Applied**: Automatically during database migration process
- **Version**: v1.4.0+

### Manual Application
If you need to apply these indexes manually:

```sql
-- Run these commands in your PostgreSQL database
CREATE INDEX IF NOT EXISTS "TokenPurchase_purchaseDate_idx" ON "token_purchases" ("purchaseDate" DESC);
CREATE INDEX IF NOT EXISTS "TokenPurchase_creator_name_idx" ON "token_purchases" ("createdBy");
CREATE INDEX IF NOT EXISTS "TokenPurchase_isEmergency_idx" ON "token_purchases" ("isEmergency");
CREATE INDEX IF NOT EXISTS "TokenPurchase_date_range_idx" ON "token_purchases" ("purchaseDate" DESC, "isEmergency", "createdBy");
CREATE INDEX IF NOT EXISTS "TokenPurchase_tokens_payment_idx" ON "token_purchases" ("totalTokens", "totalPayment");
```

### Verification
To verify indexes are created:

```sql
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename = 'token_purchases' 
AND indexname LIKE 'TokenPurchase_%';
```

## Performance Management

### Database Performance Tool
The application includes an admin dashboard tool for managing these indexes:

1. **Access**: Admin Panel → Database Performance
2. **Features**:
   - Check current index status
   - Run optimization to create missing indexes
   - View performance metrics
   - Monitor index effectiveness

### Maintenance
- **Weekly**: Check index usage and performance
- **Monthly**: Run optimization during maintenance windows
- **Quarterly**: Analyze performance improvements
- **Annually**: Review and update index strategy

## Expected Performance Improvements

### Before Indexes
- Purchase history queries: 200-500ms
- Date range filtering: 300-800ms
- Creator-based searches: 150-400ms

### After Indexes
- Purchase history queries: 50-150ms (60-70% improvement)
- Date range filtering: 80-250ms (60-70% improvement)
- Creator-based searches: 30-100ms (70-80% improvement)

## Storage Impact

### Index Storage Requirements
- Each index: ~1-5MB depending on data volume
- Total additional storage: ~10-25MB for typical dataset
- Growth rate: Proportional to purchase data growth

### Maintenance Overhead
- Index maintenance: ~5-10% additional write overhead
- Rebuild time: 1-5 minutes for typical dataset
- Vacuum impact: Minimal additional maintenance time

## Troubleshooting

### Common Issues

1. **Index Not Created**
   - Check migration status: `npx prisma migrate status`
   - Verify database permissions
   - Run optimization via admin tool

2. **Performance Not Improved**
   - Check if queries are using indexes: `EXPLAIN ANALYZE`
   - Verify index statistics are up to date: `ANALYZE token_purchases;`
   - Consider additional optimization strategies

3. **High Storage Usage**
   - Monitor index sizes: `SELECT pg_size_pretty(pg_total_relation_size('index_name'));`
   - Consider archiving old data
   - Review index necessity periodically

## Monitoring

### Key Metrics
- Query execution time
- Index usage statistics
- Database size growth
- Cache hit ratios

### Tools
- PostgreSQL query statistics
- Admin dashboard performance tool
- Application monitoring logs
- Database profiling tools

## Future Considerations

### Planned Improvements
- Additional indexes for contribution queries
- Partial indexes for specific use cases
- Covering indexes for read-heavy operations

### Optimization Strategy
- Regular performance reviews
- Query pattern analysis
- Index usage monitoring
- Continuous improvement based on usage patterns