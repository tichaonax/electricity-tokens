#!/usr/bin/env node

/**
 * Backup Restore Compatibility Verification Script
 *
 * This script verifies that the database schema is compatible with
 * restoring backups from older versions of the system.
 *
 * Run this before attempting to restore a backup to ensure all
 * required schema changes are in place.
 */

const { PrismaClient } = require('@prisma/client');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

// Load environment variables - check multiple locations like db-setup-auto.js does
const appRoot = path.resolve(__dirname, '..');
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  const envPath = path.join(appRoot, envFile);
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📝 Loaded environment from: ${envFile}`);
    break;
  }
}

const prisma = new PrismaClient();

class RestoreCompatibilityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    console.log(`${prefix} ${message}`);

    if (level === 'ERROR') this.errors.push(message);
    else if (level === 'WARN') this.warnings.push(message);
    else this.info.push(message);
  }

  async checkDatabaseConnection() {
    this.log('Checking database connection...');
    try {
      await prisma.$connect();
      this.log('✅ Database connection successful', 'INFO');
      return true;
    } catch (error) {
      this.log(`❌ Database connection failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async checkMigrationStatus() {
    this.log('Checking migration status...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate status');

      if (
        stdout.includes('Database schema is up to date') ||
        stdout.includes('No pending migrations')
      ) {
        this.log('✅ All migrations are applied', 'INFO');
        return true;
      } else if (stdout.includes('pending migrations')) {
        this.log('⚠️ Pending migrations detected', 'WARN');
        this.log('Run: npx prisma migrate deploy', 'WARN');
        return false;
      } else {
        this.log('ℹ️ Migration status:', 'INFO');
        this.log(stdout, 'INFO');
        return true;
      }
    } catch (error) {
      // prisma migrate status exits with code 1 if there are pending migrations
      if (error.stdout && error.stdout.includes('pending migrations')) {
        this.log('⚠️ Pending migrations detected', 'WARN');
        this.log('Run: npx prisma migrate deploy', 'WARN');
        return false;
      }
      this.log(`⚠️ Could not check migration status: ${error.message}`, 'WARN');
      return true; // Continue anyway
    }
  }

  async checkRequiredColumns() {
    this.log('Checking required columns for backward compatibility...');

    const requiredColumns = {
      users: [
        { name: 'id', type: 'text', nullable: false },
        { name: 'email', type: 'text', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'password', type: 'text', nullable: true },
        { name: 'role', nullable: false },
        { name: 'locked', type: 'boolean', nullable: false },
        { name: 'passwordResetRequired', type: 'boolean', nullable: false },
        { name: 'permissions', type: 'jsonb', nullable: true },
        { name: 'themePreference', type: 'text', nullable: true },
        { name: 'lastLoginAt', nullable: true },
        { name: 'createdAt', nullable: false },
        { name: 'updatedAt', nullable: false },
        // New columns added by migration - these must exist with defaults
        {
          name: 'isActive',
          type: 'boolean',
          nullable: false,
          hasDefault: true,
        },
        { name: 'deactivatedAt', nullable: true },
        { name: 'deactivationReason', type: 'text', nullable: true },
        { name: 'deactivatedBy', type: 'text', nullable: true },
      ],
    };

    try {
      const result = await prisma.$queryRaw`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `;

      const existingColumns = new Map(
        result.map((col) => [col.column_name, col])
      );

      let allColumnsValid = true;

      for (const required of requiredColumns.users) {
        const existing = existingColumns.get(required.name);

        if (!existing) {
          this.log(
            `❌ Missing required column: users.${required.name}`,
            'ERROR'
          );
          allColumnsValid = false;
          continue;
        }

        // Check nullable constraint
        const isNullable = existing.is_nullable === 'YES';
        if (
          required.nullable !== isNullable &&
          required.nullable !== undefined
        ) {
          this.log(
            `⚠️ Column users.${required.name} nullable mismatch: expected ${required.nullable}, got ${isNullable}`,
            'WARN'
          );
        }

        // Check default value for critical columns
        if (required.hasDefault && !existing.column_default) {
          this.log(
            `⚠️ Column users.${required.name} missing default value`,
            'WARN'
          );
        }

        // Special check for isActive - critical for old backup compatibility
        if (required.name === 'isActive') {
          if (
            !existing.column_default ||
            !existing.column_default.includes('true')
          ) {
            this.log(
              `❌ Column users.isActive must have DEFAULT true for old backup compatibility`,
              'ERROR'
            );
            allColumnsValid = false;
          } else {
            this.log(
              `✅ Column users.isActive has correct default value`,
              'INFO'
            );
          }
        }
      }

      if (allColumnsValid) {
        this.log('✅ All required columns present and valid', 'INFO');
        return true;
      } else {
        this.log('❌ Schema validation failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error checking columns: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async checkIndexes() {
    this.log('Checking required indexes...');
    try {
      const result = await prisma.$queryRaw`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'users';
      `;

      const indexes = result.map((r) => r.indexname);

      const requiredIndexes = [
        'users_pkey', // Primary key
        'users_email_key', // Unique email
        'users_isActive_idx', // Performance index for filtering
      ];

      let allIndexesExist = true;
      for (const required of requiredIndexes) {
        if (indexes.includes(required)) {
          this.log(`✅ Index ${required} exists`, 'INFO');
        } else {
          this.log(`⚠️ Index ${required} missing`, 'WARN');
          allIndexesExist = false;
        }
      }

      return allIndexesExist;
    } catch (error) {
      this.log(`⚠️ Error checking indexes: ${error.message}`, 'WARN');
      return true; // Not critical
    }
  }

  async checkBackupRestoreApi() {
    this.log('Checking backup restore API availability...');
    try {
      const fs = require('fs');
      const path = require('path');

      const restoreApiPath = path.join(
        process.cwd(),
        'src',
        'app',
        'api',
        'backup',
        'route.ts'
      );

      if (fs.existsSync(restoreApiPath)) {
        this.log('✅ Backup restore API found', 'INFO');
        return true;
      } else {
        this.log('❌ Backup restore API not found', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`⚠️ Error checking API: ${error.message}`, 'WARN');
      return true; // Not critical for CLI restore
    }
  }

  async verifyRestoreCompatibility(backupFilePath) {
    if (!backupFilePath) {
      this.log('ℹ️ No backup file provided for verification', 'INFO');
      return true;
    }

    this.log(`Verifying backup file compatibility: ${backupFilePath}`, 'INFO');

    try {
      const fs = require('fs');
      const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

      if (!backupData.metadata) {
        this.log('❌ Invalid backup file: missing metadata', 'ERROR');
        return false;
      }

      this.log(`Backup metadata:`, 'INFO');
      this.log(`  - Type: ${backupData.metadata.type}`, 'INFO');
      this.log(`  - Timestamp: ${backupData.metadata.timestamp}`, 'INFO');
      this.log(`  - Version: ${backupData.metadata.version}`, 'INFO');

      // Check if backup has users
      if (backupData.users && backupData.users.length > 0) {
        const firstUser = backupData.users[0];
        const hasIsActive = 'isActive' in firstUser;

        if (!hasIsActive) {
          this.log(
            '✅ Backup is from older version (no isActive field) - compatible with current schema',
            'INFO'
          );
          this.log(
            '   Users will be created with isActive=true (default)',
            'INFO'
          );
        } else {
          this.log(
            '✅ Backup includes isActive field - fully compatible',
            'INFO'
          );
        }

        this.log(`Backup contains ${backupData.users.length} users`, 'INFO');
      }

      if (backupData.metadata.recordCounts) {
        this.log('Record counts:', 'INFO');
        Object.entries(backupData.metadata.recordCounts).forEach(
          ([table, count]) => {
            this.log(`  - ${table}: ${count}`, 'INFO');
          }
        );
      }

      return true;
    } catch (error) {
      this.log(`❌ Error verifying backup file: ${error.message}`, 'ERROR');
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(70));

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((err) => console.log(`   - ${err}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warn) => console.log(`   - ${warn}`));
    }

    console.log('\n' + '='.repeat(70));

    if (this.errors.length === 0) {
      console.log('✅ VERIFICATION PASSED');
      console.log(
        '\nYour database is ready to restore backups from older versions.'
      );
      console.log('\nNext steps:');
      console.log('  1. Ensure your application is stopped');
      console.log('  2. Run the restore via API or admin panel');
      console.log('  3. Verify the restored data');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log(
        '\nPlease fix the errors above before attempting to restore.'
      );
      console.log('\nCommon fixes:');
      console.log('  - Run: npx prisma migrate deploy');
      console.log('  - Run: npx prisma db push (development only)');
      console.log('  - Check DATABASE_URL environment variable');
    }

    console.log('='.repeat(70) + '\n');

    return this.errors.length === 0;
  }
}

async function main() {
  const checker = new RestoreCompatibilityChecker();
  const backupFile = process.argv[2]; // Optional backup file to verify

  console.log(
    '╔═══════════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║     Backup Restore Compatibility Verification                    ║'
  );
  console.log(
    '╚═══════════════════════════════════════════════════════════════════╝\n'
  );

  try {
    // Run all checks
    const dbConnected = await checker.checkDatabaseConnection();
    if (!dbConnected) {
      await checker.printSummary();
      process.exit(1);
    }

    await checker.checkMigrationStatus();
    await checker.checkRequiredColumns();
    await checker.checkIndexes();
    await checker.checkBackupRestoreApi();

    if (backupFile) {
      await checker.verifyRestoreCompatibility(backupFile);
    }

    // Print summary and exit with appropriate code
    const success = checker.printSummary();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Verification failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { RestoreCompatibilityChecker };
