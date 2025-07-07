# 🗄️ Database Setup Guide

## Issue: 500 Error on First Sign-in

If you're experiencing a 500 error when trying to sign in for the first time, it's likely because the database tables haven't been created yet. This guide will help you set up the database properly.

## 🚨 Problem Diagnosis

The error occurs because:

1. PostgreSQL database exists but is empty (no tables)
2. The application tries to query tables that don't exist
3. Database schema hasn't been applied to the production database

## 🔧 Quick Fix (For Deployment Workstation)

### Option 1: Automated Setup (Recommended)

Run the database initialization script:

```bash
# Navigate to your application directory
cd /path/to/electricity-tokens

# Run the automated database setup
npm run db:init
```

This will:

- Test database connection
- Generate Prisma client
- Create all required tables
- Verify setup was successful

### Option 2: Manual Setup

If the automated script fails, run these commands manually:

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push --accept-data-loss

# Verify tables were created
npm run db:test
```

### Option 3: Interactive Setup

For a guided setup with options:

```bash
npm run db:setup
```

This provides an interactive experience with explanations and optional sample data seeding.

## 📊 Required Database Tables

The application requires these tables to function:

| Table Name            | Purpose                                                   |
| --------------------- | --------------------------------------------------------- |
| `users`               | User accounts and authentication (with theme preferences) |
| `accounts`            | OAuth accounts (NextAuth)                                 |
| `sessions`            | User sessions (NextAuth)                                  |
| `verification_tokens` | Email verification tokens                                 |
| `token_purchases`     | Electricity token purchase records                        |
| `user_contributions`  | User contributions to purchases                           |
| `meter_readings`      | Individual meter readings for consumption tracking        |
| `audit_logs`          | System audit trail (with enhanced metadata)               |

## 🔍 Verification

After running the setup, verify everything is working:

1. **Check database tables**:

   ```bash
   # Connect to your database
   psql -U postgres -d electricity_tokens

   # List all tables
   \dt

   # Should show all 7 tables listed above
   \q
   ```

2. **Test application**:

   ```bash
   # Start the application
   npm run dev  # or npm start for production

   # Visit the health endpoint to check database status
   # http://localhost:3000/api/health (or your deployed URL)
   # Should show "status": "healthy" and database connection info

   # Try signing up/signing in - should work without 500 errors
   ```

## 🚀 Production Deployment Process

For future deployments, follow this sequence:

1. **Set up PostgreSQL database**:

   ```sql
   CREATE DATABASE electricity_tokens;
   ```

2. **Configure environment variables**:

   ```env
   DATABASE_URL="postgresql://username:password@host:5432/electricity_tokens"
   NEXTAUTH_URL="https://your-domain.com"
   NEXTAUTH_SECRET="your-secret-here"
   ```

3. **Initialize database**:

   ```bash
   npm run db:init
   ```

4. **Start application**:
   ```bash
   npm run build
   npm start
   ```

## 🛠 Troubleshooting

### Error: "database does not exist"

Create the database first:

```bash
psql -U postgres -c "CREATE DATABASE electricity_tokens;"
```

### Error: "connection refused"

Check that PostgreSQL is running:

```bash
# On Windows
services.msc  # Look for PostgreSQL service

# On Linux/Mac
sudo systemctl status postgresql
```

### Error: "authentication failed"

Verify your DATABASE_URL credentials in `.env.local`:

```env
DATABASE_URL="postgresql://username:password@host:5432/electricity_tokens"
```

### Error: "permission denied"

Ensure the database user has sufficient privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE electricity_tokens TO your_username;
```

## 📝 Available Database Commands

### Schema Migration Commands

| Command                             | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `npm run db:init`                   | Initialize database (production)        |
| `npm run db:setup`                  | Interactive database setup              |
| `npm run db:reset`                  | Clear all data (destructive)            |
| `npm run db:seed`                   | Add sample test data                    |
| `npx prisma migrate deploy`         | Apply production migrations             |
| `npx prisma migrate dev`            | Create and apply development migrations |
| `npx prisma migrate status`         | Check migration status                  |
| `node scripts/test-db.js`           | Test database connection                |
| `node scripts/migrate-to-v1.4.0.js` | Upgrade existing data to v1.4.0         |

## 🔄 Schema Updates

When the application schema changes:

1. **Development**: Use `npx prisma db push`
2. **Production**: Use migrations for safe updates

### Current Schema Version: 1.4.0

Latest changes include:

- Added `themePreference` field to users table
- Added `passwordResetRequired` field to users table
- Added `meter_readings` table for consumption tracking
- Enhanced `audit_logs` table with metadata field
- Updated constraints for one-to-one purchase-contribution relationship

### Upgrading Existing Deployments

For existing deployments upgrading to v1.4.0:

#### Step 1: Backup Your Data

```bash
# Create a complete backup before upgrading
pg_dump -U username -h hostname electricity_tokens > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Run Migration

```bash
# Apply schema changes safely
npx prisma migrate deploy

# Or if using db push (development only)
npx prisma db push
```

#### Step 3: Verify Migration

```bash
# Check that new fields exist
psql -U username -d electricity_tokens -c "\d users"
psql -U username -d electricity_tokens -c "\d meter_readings"
psql -U username -d electricity_tokens -c "\d audit_logs"
```

#### Step 4: Data Migration (if needed)

```bash
# Run data migration script if upgrading from pre-1.4.0
node scripts/migrate-to-v1.4.0.js
```

### Rolling Back

If you need to rollback:

```bash
# Stop the application
npm run stop

# Restore from backup
psql -U username -d electricity_tokens < backup_20240115_120000.sql

# Restart with previous version
git checkout v1.3.0
npm install
npm run build
npm start
```

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NextAuth.js Database Setup](https://next-auth.js.org/adapters/prisma)

## 🆘 Getting Help

If you continue to experience issues:

1. Check the application logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Test database connectivity independently of the application

The most common cause of the 500 error on first sign-in is missing database tables, which these scripts will resolve.
