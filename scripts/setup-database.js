#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script sets up the database for the Electricity Tokens Tracker application.
 * It should be run after creating the PostgreSQL database but before starting the app.
 *
 * Usage:
 *   node scripts/setup-database.js
 *
 * What this script does:
 * 1. Tests database connection
 * 2. Generates Prisma client
 * 3. Pushes schema to database (creates tables)
 * 4. Optionally seeds initial data
 */

const { exec } = require('child_process');
const { promisify } = require('util');

let PrismaClient;
const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  log('🔍 Testing database connection...', colors.cyan);

  try {
    // Try to require PrismaClient, generate if it doesn't exist
    try {
      ({ PrismaClient } = require('@prisma/client'));
    } catch (requireError) {
      if (
        requireError.message.includes('did not initialize yet') ||
        requireError.code === 'MODULE_NOT_FOUND'
      ) {
        log('⚠️ Prisma client not found, generating first...', colors.yellow);
        await generatePrismaClient();
        ({ PrismaClient } = require('@prisma/client'));
      } else {
        throw requireError;
      }
    }

    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    log('✅ Database connection successful!', colors.green);
    return true;
  } catch (error) {
    log('❌ Database connection failed!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    log('', colors.reset);
    log('Please check:', colors.yellow);
    log('1. PostgreSQL is running', colors.yellow);
    log(
      '2. Database exists (create database electricity_tokens)',
      colors.yellow
    );
    log('3. DATABASE_URL environment variable is correct', colors.yellow);
    log('4. Database credentials are valid', colors.yellow);
    return false;
  }
}

async function generatePrismaClient() {
  log('🔧 Generating Prisma client...', colors.cyan);

  try {
    const { stdout, stderr } = await execAsync('npx prisma generate');
    log('✅ Prisma client generated successfully!', colors.green);
    if (stderr) {
      log(`Warnings: ${stderr}`, colors.yellow);
    }
    return true;
  } catch (error) {
    log('❌ Failed to generate Prisma client!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
}

async function pushDatabaseSchema() {
  log('📊 Pushing database schema (creating tables)...', colors.cyan);

  // Check if this will reset the database
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  };

  log(
    '⚠️  WARNING: This operation may reset your database and WIPE ALL DATA!',
    colors.red
  );
  log('If you have existing data, please backup first.', colors.yellow);

  const answer = await askQuestion(
    'Do you want to continue? This will DELETE ALL EXISTING DATA! (yes/no): '
  );
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    log('❌ Operation cancelled by user. Database unchanged.', colors.yellow);
    return false;
  }

  try {
    const { stdout, stderr } = await execAsync(
      'npx prisma db push --force-reset'
    );
    log('✅ Database schema pushed successfully!', colors.green);
    log('Tables created:', colors.green);
    log('  - users', colors.green);
    log('  - accounts', colors.green);
    log('  - sessions', colors.green);
    log('  - verification_tokens', colors.green);
    log('  - token_purchases', colors.green);
    log('  - user_contributions', colors.green);
    log('  - audit_logs', colors.green);

    if (stderr) {
      log(`Warnings: ${stderr}`, colors.yellow);
    }
    return true;
  } catch (error) {
    log('❌ Failed to push database schema!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
}

async function verifyTables() {
  log('🔍 Verifying tables were created...', colors.cyan);

  try {
    const prisma = new PrismaClient();

    // Try to count records in each table to verify they exist
    const userCount = await prisma.user.count();
    const purchaseCount = await prisma.tokenPurchase.count();
    const contributionCount = await prisma.userContribution.count();
    const auditCount = await prisma.auditLog.count();
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    const tokenCount = await prisma.verificationToken.count();

    await prisma.$disconnect();

    log('✅ All tables verified successfully!', colors.green);
    log(`Current record counts:`, colors.blue);
    log(`  - Users: ${userCount}`, colors.blue);
    log(`  - Token Purchases: ${purchaseCount}`, colors.blue);
    log(`  - User Contributions: ${contributionCount}`, colors.blue);
    log(`  - Audit Logs: ${auditCount}`, colors.blue);
    log(`  - Accounts: ${accountCount}`, colors.blue);
    log(`  - Sessions: ${sessionCount}`, colors.blue);
    log(`  - Verification Tokens: ${tokenCount}`, colors.blue);

    return true;
  } catch (error) {
    log('❌ Table verification failed!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
}

async function askForSeeding() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    log('', colors.reset);
    rl.question(
      '🌱 Would you like to seed the database with sample data? (y/n): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase().startsWith('y'));
      }
    );
  });
}

async function seedDatabase() {
  log('🌱 Seeding database with sample data...', colors.cyan);

  try {
    const { stdout, stderr } = await execAsync('npx tsx prisma/seed.ts');
    log('✅ Database seeded successfully!', colors.green);
    log('Sample data created for testing and demonstration', colors.green);

    if (stderr) {
      log(`Warnings: ${stderr}`, colors.yellow);
    }
    return true;
  } catch (error) {
    log('❌ Failed to seed database!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    log(
      'This is optional - the app will still work without sample data',
      colors.yellow
    );
    return false;
  }
}

async function main() {
  log('🚀 Electricity Tokens Tracker - Database Setup', colors.blue);
  log('================================================', colors.blue);
  log('', colors.reset);

  // Step 1: Generate Prisma client first (required for connection test)
  const clientOk = await generatePrismaClient();
  if (!clientOk) {
    process.exit(1);
  }

  log('', colors.reset);

  // Step 2: Test database connection (now that client is generated)
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    process.exit(1);
  }

  log('', colors.reset);

  // Step 3: Push database schema
  const schemaOk = await pushDatabaseSchema();
  if (!schemaOk) {
    process.exit(1);
  }

  log('', colors.reset);

  // Step 4: Verify tables
  const verifyOk = await verifyTables();
  if (!verifyOk) {
    process.exit(1);
  }

  // Step 5: Optional seeding
  const shouldSeed = await askForSeeding();
  if (shouldSeed) {
    log('', colors.reset);
    await seedDatabase();
  }

  log('', colors.reset);
  log('🎉 Database setup completed successfully!', colors.green);
  log('', colors.reset);
  log('Next steps:', colors.cyan);
  log(
    '1. Start the application: npm run dev (for development) or npm run build && npm start (for production)',
    colors.cyan
  );
  log('2. Visit the app in your browser', colors.cyan);
  log('3. Register your first user account', colors.cyan);
  log(
    '4. Promote the first user to admin using: node scripts/create-admin.js',
    colors.cyan
  );
  log('', colors.reset);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log('❌ Unhandled error occurred:', colors.red);
  log(error.message, colors.red);
  process.exit(1);
});

// Run the setup
if (require.main === module) {
  main().catch((error) => {
    log('❌ Setup failed:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  });
}

module.exports = { main };
