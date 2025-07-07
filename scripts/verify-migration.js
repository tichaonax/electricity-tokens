#!/usr/bin/env node

/**
 * Migration Verification Script for Electricity Tokens Tracker v1.4.0
 *
 * This script verifies that the migration to v1.4.0 was completed successfully
 * and all features are working correctly.
 *
 * Usage: node scripts/verify-migration.js [--verbose] [--fix-issues]
 */

const { PrismaClient } = require('@prisma/client');

// Command line arguments
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose');
const shouldFixIssues = args.includes('--fix-issues');

console.log('🔍 Electricity Tokens Tracker - Migration Verification v1.4.0');
console.log('==========================================================');

if (isVerbose) {
  console.log('📝 Verbose mode enabled');
}

if (shouldFixIssues) {
  console.log('🔧 Auto-fix mode enabled');
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Verification results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  fixes: [],
};

/**
 * Log test result
 */
function logResult(test, status, message, details = null) {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${emoji} ${test}: ${message}`);

  if (details && isVerbose) {
    console.log(`   📋 ${details}`);
  }

  results[
    status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'warnings'
  ].push({
    test,
    message,
    details,
  });
}

/**
 * Fix issue automatically if possible
 */
async function attemptFix(issue, fixFunction) {
  if (!shouldFixIssues) {
    console.log(`   🔧 Auto-fix available: use --fix-issues flag`);
    return false;
  }

  try {
    await fixFunction();
    console.log(`   ✅ Fixed: ${issue}`);
    results.fixes.push(issue);
    return true;
  } catch (error) {
    console.log(`   ❌ Fix failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 1: Database Connection
 */
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    logResult(
      'Database Connection',
      'pass',
      'Successfully connected to database'
    );
    return true;
  } catch (error) {
    logResult(
      'Database Connection',
      'fail',
      'Cannot connect to database',
      error.message
    );
    return false;
  }
}

/**
 * Test 2: Schema Version
 */
async function testSchemaVersion() {
  try {
    // Check if schema_info table exists and has v1.4.0 entry
    const versionInfo = await prisma.$queryRaw`
      SELECT version, applied_at, description 
      FROM schema_info 
      WHERE version = '1.4.0' 
      ORDER BY applied_at DESC 
      LIMIT 1;
    `;

    if (versionInfo.length > 0) {
      const version = versionInfo[0];
      logResult(
        'Schema Version',
        'pass',
        `Version 1.4.0 found`,
        `Applied: ${version.applied_at}, Description: ${version.description}`
      );
      return true;
    } else {
      logResult(
        'Schema Version',
        'warn',
        'Schema version 1.4.0 not recorded in schema_info table'
      );

      // Attempt to fix
      await attemptFix('Missing schema version record', async () => {
        await prisma.$executeRaw`
          INSERT INTO schema_info (version, description) 
          VALUES ('1.4.0', 'Theme preferences, meter readings, enhanced audit logging');
        `;
      });

      return false;
    }
  } catch (error) {
    logResult(
      'Schema Version',
      'warn',
      'Cannot check schema version',
      'schema_info table may not exist (this is okay for manual migrations)'
    );
    return true; // Non-critical
  }
}

/**
 * Test 3: Required Tables Exist
 */
async function testRequiredTables() {
  const requiredTables = [
    'users',
    'accounts',
    'sessions',
    'verification_tokens',
    'token_purchases',
    'user_contributions',
    'meter_readings', // New in v1.4.0
    'audit_logs',
  ];

  try {
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    const tableNames = existingTables.map((t) => t.table_name.toLowerCase());
    let allTablesExist = true;

    for (const table of requiredTables) {
      if (tableNames.includes(table.toLowerCase())) {
        if (isVerbose) {
          logResult(`Table: ${table}`, 'pass', 'Exists');
        }
      } else {
        logResult(`Table: ${table}`, 'fail', 'Missing required table');
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      logResult(
        'Required Tables',
        'pass',
        `All ${requiredTables.length} required tables exist`
      );
    } else {
      logResult('Required Tables', 'fail', 'Some required tables are missing');
    }

    return allTablesExist;
  } catch (error) {
    logResult('Required Tables', 'fail', 'Cannot check tables', error.message);
    return false;
  }
}

/**
 * Test 4: User Table Schema
 */
async function testUserTableSchema() {
  try {
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const columnNames = userColumns.map((c) => c.column_name);

    // Required columns for v1.4.0
    const requiredColumns = [
      'id',
      'email',
      'name',
      'password',
      'role',
      'locked',
      'password_reset_required', // New in v1.4.0
      'permissions',
      'theme_preference', // New in v1.4.0
      'created_at',
      'updated_at',
    ];

    let allColumnsExist = true;
    const missingColumns = [];

    for (const column of requiredColumns) {
      if (columnNames.includes(column)) {
        if (isVerbose) {
          const col = userColumns.find((c) => c.column_name === column);
          logResult(
            `Users.${column}`,
            'pass',
            `${col.data_type}, nullable: ${col.is_nullable}`
          );
        }
      } else {
        logResult(`Users.${column}`, 'fail', 'Missing column');
        missingColumns.push(column);
        allColumnsExist = false;
      }
    }

    // Attempt to fix missing columns
    if (missingColumns.length > 0) {
      for (const column of missingColumns) {
        if (column === 'theme_preference') {
          await attemptFix(
            `Missing users.theme_preference column`,
            async () => {
              await prisma.$executeRaw`
              ALTER TABLE users ADD COLUMN theme_preference VARCHAR(10) DEFAULT 'system';
            `;
            }
          );
        } else if (column === 'password_reset_required') {
          await attemptFix(
            `Missing users.password_reset_required column`,
            async () => {
              await prisma.$executeRaw`
              ALTER TABLE users ADD COLUMN password_reset_required BOOLEAN DEFAULT false NOT NULL;
            `;
            }
          );
        }
      }
    }

    if (allColumnsExist) {
      logResult('User Table Schema', 'pass', 'All required columns exist');
    } else {
      logResult(
        'User Table Schema',
        'fail',
        `Missing columns: ${missingColumns.join(', ')}`
      );
    }

    return allColumnsExist;
  } catch (error) {
    logResult(
      'User Table Schema',
      'fail',
      'Cannot check user table schema',
      error.message
    );
    return false;
  }
}

/**
 * Test 5: Meter Readings Table
 */
async function testMeterReadingsTable() {
  try {
    const meterReadingColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'meter_readings' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const requiredColumns = [
      'id',
      'user_id',
      'reading',
      'reading_date',
      'notes',
      'created_at',
      'updated_at',
    ];

    const columnNames = meterReadingColumns.map((c) => c.column_name);
    let allColumnsExist = true;

    for (const column of requiredColumns) {
      if (!columnNames.includes(column)) {
        logResult(`MeterReadings.${column}`, 'fail', 'Missing column');
        allColumnsExist = false;
      } else if (isVerbose) {
        const col = meterReadingColumns.find((c) => c.column_name === column);
        logResult(
          `MeterReadings.${column}`,
          'pass',
          `${col.data_type}, nullable: ${col.is_nullable}`
        );
      }
    }

    // Check index exists
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'meter_readings';
    `;

    const hasUserDateIndex = indexes.some(
      (idx) => idx.indexname.includes('user') && idx.indexname.includes('date')
    );

    if (!hasUserDateIndex) {
      logResult('MeterReadings Index', 'warn', 'Missing user_date index');
      await attemptFix('Missing meter_readings index', async () => {
        await prisma.$executeRaw`
          CREATE INDEX idx_meter_readings_user_date ON meter_readings(user_id, reading_date);
        `;
      });
    } else if (isVerbose) {
      logResult('MeterReadings Index', 'pass', 'User/date index exists');
    }

    if (allColumnsExist) {
      logResult('Meter Readings Table', 'pass', 'Schema is correct');
    } else {
      logResult('Meter Readings Table', 'fail', 'Schema issues found');
    }

    return allColumnsExist;
  } catch (error) {
    logResult(
      'Meter Readings Table',
      'fail',
      'Cannot check meter readings table',
      error.message
    );
    return false;
  }
}

/**
 * Test 6: Audit Logs Enhancement
 */
async function testAuditLogsEnhancement() {
  try {
    const auditColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' AND table_schema = 'public';
    `;

    const columnNames = auditColumns.map((c) => c.column_name);
    const hasMetadata = columnNames.includes('metadata');

    if (hasMetadata) {
      logResult('Audit Logs Metadata', 'pass', 'Metadata column exists');

      // Check if metadata is being used in new entries
      const recentAuditWithMetadata = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE metadata IS NOT NULL 
        AND timestamp > NOW() - INTERVAL '24 hours';
      `;

      if (recentAuditWithMetadata[0].count > 0) {
        logResult(
          'Audit Metadata Usage',
          'pass',
          'Metadata is being populated in new entries'
        );
      } else {
        logResult(
          'Audit Metadata Usage',
          'warn',
          'No recent audit entries with metadata (may be normal if no recent activity)'
        );
      }
    } else {
      logResult('Audit Logs Metadata', 'fail', 'Metadata column missing');

      await attemptFix('Missing audit_logs.metadata column', async () => {
        await prisma.$executeRaw`
          ALTER TABLE audit_logs ADD COLUMN metadata JSONB NULL;
        `;
      });
      return false;
    }

    return true;
  } catch (error) {
    logResult(
      'Audit Logs Enhancement',
      'fail',
      'Cannot check audit logs',
      error.message
    );
    return false;
  }
}

/**
 * Test 7: Data Integrity
 */
async function testDataIntegrity() {
  try {
    // Check user count
    const userCount = await prisma.user.count();
    logResult('User Data', 'pass', `${userCount} users found`);

    // Check for users with theme preferences
    const usersWithTheme = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE theme_preference IS NOT NULL;
    `;

    if (usersWithTheme[0].count === userCount) {
      logResult(
        'Theme Preferences',
        'pass',
        'All users have theme preferences set'
      );
    } else {
      logResult(
        'Theme Preferences',
        'warn',
        `${userCount - usersWithTheme[0].count} users missing theme preferences`
      );

      await attemptFix('Missing theme preferences', async () => {
        await prisma.$executeRaw`
          UPDATE users SET theme_preference = 'system' WHERE theme_preference IS NULL;
        `;
      });
    }

    // Check token purchases
    const purchaseCount = await prisma.tokenPurchase.count();
    if (purchaseCount > 0) {
      logResult(
        'Purchase Data',
        'pass',
        `${purchaseCount} token purchases found`
      );
    } else {
      logResult(
        'Purchase Data',
        'warn',
        'No token purchases found (may be normal for new installations)'
      );
    }

    // Check contributions
    const contributionCount = await prisma.userContribution.count();
    logResult(
      'Contribution Data',
      'pass',
      `${contributionCount} user contributions found`
    );

    // Check audit logs
    const auditCount = await prisma.auditLog.count();
    logResult('Audit Data', 'pass', `${auditCount} audit log entries found`);

    return true;
  } catch (error) {
    logResult(
      'Data Integrity',
      'fail',
      'Cannot verify data integrity',
      error.message
    );
    return false;
  }
}

/**
 * Test 8: Theme Functionality
 */
async function testThemeFunctionality() {
  try {
    // Test theme values
    const themeStats = await prisma.$queryRaw`
      SELECT theme_preference, COUNT(*) as count 
      FROM users 
      WHERE theme_preference IS NOT NULL 
      GROUP BY theme_preference;
    `;

    const validThemes = ['light', 'dark', 'system'];
    let hasValidThemes = true;

    for (const stat of themeStats) {
      if (validThemes.includes(stat.theme_preference)) {
        if (isVerbose) {
          logResult(
            `Theme: ${stat.theme_preference}`,
            'pass',
            `${stat.count} users`
          );
        }
      } else {
        logResult(
          `Theme: ${stat.theme_preference}`,
          'fail',
          `Invalid theme value`
        );
        hasValidThemes = false;
      }
    }

    if (hasValidThemes) {
      logResult('Theme Functionality', 'pass', 'All theme values are valid');
    } else {
      logResult('Theme Functionality', 'fail', 'Invalid theme values found');
    }

    return hasValidThemes;
  } catch (error) {
    logResult(
      'Theme Functionality',
      'fail',
      'Cannot test theme functionality',
      error.message
    );
    return false;
  }
}

/**
 * Test 9: API Endpoints (basic check)
 */
async function testAPIEndpoints() {
  try {
    // This is a basic check - full API testing would require the server to be running
    console.log('\n📡 API Endpoint Verification (requires running server):');
    console.log(
      '   To test API endpoints, ensure your application is running and visit:'
    );
    console.log('   • GET /api/health - System health check');
    console.log('   • GET /api/user/theme - Theme preference endpoint');
    console.log('   • GET /api/meter-readings - Meter readings endpoint');
    console.log('   • GET /api/audit - Enhanced audit logs endpoint');

    logResult(
      'API Endpoints',
      'warn',
      'Manual testing required - see above URLs'
    );
    return true;
  } catch (error) {
    logResult(
      'API Endpoints',
      'warn',
      'Cannot automatically test API endpoints'
    );
    return true; // Non-critical for migration verification
  }
}

/**
 * Generate migration report
 */
function generateReport() {
  console.log('\n📊 Migration Verification Report');
  console.log('================================');

  console.log(`✅ Passed: ${results.passed.length} tests`);
  console.log(`❌ Failed: ${results.failed.length} tests`);
  console.log(`⚠️  Warnings: ${results.warnings.length} issues`);

  if (shouldFixIssues && results.fixes.length > 0) {
    console.log(`🔧 Fixed: ${results.fixes.length} issues`);
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach((test) => {
      console.log(`   • ${test.test}: ${test.message}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach((warning) => {
      console.log(`   • ${warning.test}: ${warning.message}`);
    });
  }

  if (results.fixes.length > 0) {
    console.log('\n🔧 Auto-Fixes Applied:');
    results.fixes.forEach((fix) => {
      console.log(`   • ${fix}`);
    });
  }

  // Overall status
  const isSuccessful = results.failed.length === 0;
  const hasMinorIssues = results.warnings.length > 0;

  console.log('\n🎯 Overall Status:');
  if (isSuccessful && !hasMinorIssues) {
    console.log('✅ Migration verification PASSED - v1.4.0 is ready!');
  } else if (isSuccessful && hasMinorIssues) {
    console.log(
      '⚠️  Migration verification PASSED with warnings - v1.4.0 is usable but has minor issues'
    );
  } else {
    console.log(
      '❌ Migration verification FAILED - issues must be resolved before using v1.4.0'
    );
  }

  return isSuccessful;
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('\n🔍 Starting migration verification...\n');

  try {
    const tests = [
      testDatabaseConnection,
      testSchemaVersion,
      testRequiredTables,
      testUserTableSchema,
      testMeterReadingsTable,
      testAuditLogsEnhancement,
      testDataIntegrity,
      testThemeFunctionality,
      testAPIEndpoints,
    ];

    for (const test of tests) {
      await test();
    }

    return generateReport();
  } catch (error) {
    console.error('\n💥 Verification failed with error:', error.message);
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
    const success = await runVerification();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n⏱️  Verification completed in ${duration} seconds`);

    if (success) {
      console.log('\n🎉 Migration verification successful!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Test application functionality manually');
      console.log('   2. Verify mobile responsiveness');
      console.log('   3. Test theme switching');
      console.log('   4. Check audit trail functionality');
      console.log('   5. Inform users about new features');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration verification found issues');
      console.log(
        '   Review the failed tests above and fix issues before proceeding'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Unexpected verification error:', error);
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n⚠️  Verification interrupted by user');
  await prisma.$disconnect();
  process.exit(1);
});

// Run the verification
if (require.main === module) {
  main();
}

module.exports = {
  runVerification,
  results,
};
