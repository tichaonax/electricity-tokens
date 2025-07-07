#!/usr/bin/env node

/**
 * Migration Script for Electricity Tokens Tracker v1.4.0
 *
 * This script safely migrates existing deployments to schema v1.4.0
 * Includes: theme preferences, meter readings table, enhanced audit logging
 *
 * Usage: node scripts/migrate-to-v1.4.0.js [--dry-run] [--force]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

console.log('🔄 Electricity Tokens Tracker - Migration to v1.4.0');
console.log('=====================================================');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Migration configuration
const MIGRATION_CONFIG = {
  targetVersion: '1.4.0',
  schemaChanges: [
    'Add themePreference field to users table',
    'Add passwordResetRequired field to users table',
    'Create meter_readings table',
    'Add metadata field to audit_logs table',
    'Update constraints for one-to-one purchase-contribution relationship',
  ],
  backupRequired: true,
  estimatedDuration: '5-10 minutes',
};

/**
 * Check current database state
 */
async function checkCurrentState() {
  console.log('\n📊 Checking current database state...');

  try {
    // Check if we can connect to database
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    const tableNames = tables.map((t) => t.table_name);
    console.log('📋 Existing tables:', tableNames.join(', '));

    // Check for v1.4.0 features
    const hasThemePreference = await checkColumnExists(
      'users',
      'theme_preference'
    );
    const hasMeterReadings = tableNames.includes('meter_readings');
    const hasAuditMetadata = await checkColumnExists('audit_logs', 'metadata');

    const currentState = {
      hasThemePreference,
      hasMeterReadings,
      hasAuditMetadata,
      isV14Compatible:
        hasThemePreference && hasMeterReadings && hasAuditMetadata,
    };

    console.log('\n🔍 Migration Status:');
    console.log(`   Theme Preferences: ${hasThemePreference ? '✅' : '❌'}`);
    console.log(`   Meter Readings Table: ${hasMeterReadings ? '✅' : '❌'}`);
    console.log(`   Enhanced Audit Logging: ${hasAuditMetadata ? '✅' : '❌'}`);

    if (currentState.isV14Compatible) {
      console.log('✅ Database already appears to be v1.4.0 compatible!');
      return { needsMigration: false, currentState };
    }

    return { needsMigration: true, currentState };
  } catch (error) {
    console.error('❌ Error checking database state:', error.message);
    throw error;
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName, columnName) {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${tableName} 
      AND column_name = ${columnName}
      AND table_schema = 'public';
    `;
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Create pre-migration backup
 */
async function createBackup() {
  console.log('\n💾 Creating pre-migration backup...');

  if (isDryRun) {
    console.log('🔍 DRY RUN: Would create backup here');
    return true;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = './backups';

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Note: Actual pg_dump would need to be run outside this script
    // This is a placeholder for backup verification
    const backupPath = path.join(
      backupDir,
      `pre-v1.4.0-migration-${timestamp}.sql`
    );

    console.log('📋 Backup recommendations:');
    console.log(
      `   1. Run: pg_dump -U [username] -h [host] [database] > ${backupPath}`
    );
    console.log(`   2. Verify backup integrity`);
    console.log(`   3. Store backup in secure location`);

    if (!isForce) {
      console.log('\n⚠️  Please create a backup before proceeding.');
      console.log('   Use --force flag to skip this check (NOT RECOMMENDED)');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return false;
  }
}

/**
 * Apply schema migrations
 */
async function applyMigrations(currentState) {
  console.log('\n🔄 Applying schema migrations...');

  const migrations = [];

  // Migration 1: Add theme preference to users table
  if (!currentState.hasThemePreference) {
    migrations.push({
      name: 'Add theme preference field',
      sql: `ALTER TABLE users ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'system';`,
      verify: () => checkColumnExists('users', 'theme_preference'),
    });
  }

  // Migration 2: Add password reset required field
  const hasPasswordResetRequired = await checkColumnExists(
    'users',
    'password_reset_required'
  );
  if (!hasPasswordResetRequired) {
    migrations.push({
      name: 'Add password reset required field',
      sql: `ALTER TABLE users ADD COLUMN password_reset_required BOOLEAN DEFAULT false NOT NULL;`,
      verify: () => checkColumnExists('users', 'password_reset_required'),
    });
  }

  // Migration 3: Create meter readings table
  if (!currentState.hasMeterReadings) {
    migrations.push({
      name: 'Create meter readings table',
      sql: `
        CREATE TABLE meter_readings (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          reading DECIMAL(10,2) NOT NULL,
          reading_date TIMESTAMP NOT NULL,
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        CREATE INDEX idx_meter_readings_user_date ON meter_readings(user_id, reading_date);
      `,
      verify: async () => {
        const tables = await prisma.$queryRaw`
          SELECT table_name FROM information_schema.tables 
          WHERE table_name = 'meter_readings' AND table_schema = 'public';
        `;
        return tables.length > 0;
      },
    });
  }

  // Migration 4: Add metadata to audit logs
  if (!currentState.hasAuditMetadata) {
    migrations.push({
      name: 'Add metadata field to audit logs',
      sql: `ALTER TABLE audit_logs ADD COLUMN metadata JSONB NULL;`,
      verify: () => checkColumnExists('audit_logs', 'metadata'),
    });
  }

  // Execute migrations
  for (const migration of migrations) {
    console.log(`\n🔄 ${migration.name}...`);

    if (isDryRun) {
      console.log(`🔍 DRY RUN: Would execute:\n${migration.sql}`);
      continue;
    }

    try {
      await prisma.$executeRawUnsafe(migration.sql);

      // Verify migration
      const isVerified = await migration.verify();
      if (isVerified) {
        console.log(`✅ ${migration.name} completed successfully`);
      } else {
        console.log(`❌ ${migration.name} verification failed`);
        throw new Error(`Migration verification failed: ${migration.name}`);
      }
    } catch (error) {
      console.error(`❌ Error in ${migration.name}:`, error.message);
      throw error;
    }
  }

  return migrations.length;
}

/**
 * Migrate existing data if needed
 */
async function migrateData() {
  console.log('\n📊 Checking for data migration needs...');

  try {
    // Check if users need default theme preferences
    const usersWithoutTheme = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE theme_preference IS NULL;
    `;

    if (usersWithoutTheme[0].count > 0) {
      console.log(
        `🔄 Setting default theme for ${usersWithoutTheme[0].count} users...`
      );

      if (!isDryRun) {
        await prisma.$executeRaw`
          UPDATE users SET theme_preference = 'system' WHERE theme_preference IS NULL;
        `;
        console.log('✅ Default themes applied');
      } else {
        console.log('🔍 DRY RUN: Would set default themes');
      }
    }

    // Check audit logs for missing metadata
    const auditLogsWithoutMetadata = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM audit_logs WHERE metadata IS NULL;
    `;

    if (auditLogsWithoutMetadata[0].count > 0) {
      console.log(
        `📋 Found ${auditLogsWithoutMetadata[0].count} audit logs without metadata (this is expected for historical data)`
      );
    }

    return true;
  } catch (error) {
    console.error('❌ Error migrating data:', error.message);
    throw error;
  }
}

/**
 * Verify migration completion
 */
async function verifyMigration() {
  console.log('\n✅ Verifying migration completion...');

  try {
    const verification = await checkCurrentState();

    if (verification.currentState.isV14Compatible) {
      console.log('✅ Migration verification successful!');
      console.log('✅ Database is now v1.4.0 compatible');
      return true;
    } else {
      console.log('❌ Migration verification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
    return false;
  }
}

/**
 * Update schema version tracking
 */
async function updateSchemaVersion() {
  console.log('\n📝 Updating schema version...');

  if (isDryRun) {
    console.log('🔍 DRY RUN: Would update schema version to 1.4.0');
    return;
  }

  try {
    // Create schema_info table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS schema_info (
        id SERIAL PRIMARY KEY,
        version VARCHAR(10) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW(),
        description TEXT
      );
    `;

    // Insert version record
    await prisma.$executeRaw`
      INSERT INTO schema_info (version, description) 
      VALUES ('1.4.0', 'Theme preferences, meter readings, enhanced audit logging');
    `;

    console.log('✅ Schema version updated to 1.4.0');
  } catch (error) {
    console.error('❌ Error updating schema version:', error.message);
    // Non-fatal error - migration can still be considered successful
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    console.log('\n🚀 Starting migration process...');
    console.log(`📅 Target Version: ${MIGRATION_CONFIG.targetVersion}`);
    console.log(
      `⏱️  Estimated Duration: ${MIGRATION_CONFIG.estimatedDuration}`
    );

    // Step 1: Check current state
    const stateCheck = await checkCurrentState();

    if (!stateCheck.needsMigration) {
      console.log('\n🎉 No migration needed - database is already up to date!');
      return true;
    }

    // Step 2: Create backup
    if (MIGRATION_CONFIG.backupRequired) {
      const backupCreated = await createBackup();
      if (!backupCreated) {
        console.log('\n❌ Migration aborted - backup required');
        return false;
      }
    }

    // Step 3: Apply schema migrations
    const migrationsApplied = await applyMigrations(stateCheck.currentState);
    console.log(`\n✅ Applied ${migrationsApplied} schema migrations`);

    // Step 4: Migrate existing data
    await migrateData();

    // Step 5: Verify migration
    const isVerified = await verifyMigration();
    if (!isVerified) {
      throw new Error('Migration verification failed');
    }

    // Step 6: Update schema version
    await updateSchemaVersion();

    // Success!
    console.log('\n🎉 Migration to v1.4.0 completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your application');
    console.log('   2. Test new features (theme preferences, mobile design)');
    console.log('   3. Verify user access and functionality');
    console.log('   4. Monitor system performance');
    console.log('   5. Inform users about new features');

    return true;
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔄 Rollback recommendations:');
    console.log('   1. Stop the application');
    console.log('   2. Restore database from backup');
    console.log('   3. Revert application code to previous version');
    console.log('   4. Restart application');
    console.log('   5. Verify system functionality');

    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Script entry point
 */
async function main() {
  const startTime = Date.now();

  try {
    const success = await runMigration();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n⏱️  Migration completed in ${duration} seconds`);

    if (success) {
      console.log('✅ Migration successful - ready for v1.4.0!');
      process.exit(0);
    } else {
      console.log('❌ Migration failed - see error details above');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n⚠️  Migration interrupted by user');
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Migration terminated');
  await prisma.$disconnect();
  process.exit(1);
});

// Run the migration
if (require.main === module) {
  main();
}

module.exports = {
  runMigration,
  checkCurrentState,
  MIGRATION_CONFIG,
};
