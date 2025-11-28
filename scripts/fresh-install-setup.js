#!/usr/bin/env node

/**
 * Fresh Installation Setup Script for Remote Servers
 *
 * This script automates the setup process for fresh installations,
 * ensuring the database is properly configured to restore backups
 * from older versions of the system.
 *
 * Usage:
 *   node scripts/fresh-install-setup.js
 *   node scripts/fresh-install-setup.js --verify-only
 *   node scripts/fresh-install-setup.js --backup-file=/path/to/backup.json
 */

const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

class FreshInstallSetup {
  constructor(options = {}) {
    this.options = options;
    this.verifyOnly = options.verifyOnly || false;
    this.backupFile = options.backupFile;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const symbols = {
      INFO: 'ℹ️',
      SUCCESS: '✅',
      WARN: '⚠️',
      ERROR: '❌',
      PROGRESS: '⏳',
    };
    const symbol = symbols[level] || 'ℹ️';
    console.log(`${symbol} [${level}] ${message}`);
  }

  async checkEnvironment() {
    this.log('Checking environment variables...', 'PROGRESS');

    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

    const missingVars = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      this.log(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        'ERROR'
      );
      this.log('Please check .env.local file', 'ERROR');
      return false;
    }

    this.log('All required environment variables are set', 'SUCCESS');
    return true;
  }

  async checkDatabaseConnection() {
    this.log('Testing database connection...', 'PROGRESS');

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.$connect();
      this.log('Database connection successful', 'SUCCESS');
      await prisma.$disconnect();
      return true;
    } catch (error) {
      this.log(`Database connection failed: ${error.message}`, 'ERROR');
      this.log(
        'Please verify DATABASE_URL and ensure PostgreSQL is running',
        'ERROR'
      );
      return false;
    }
  }

  async runMigrations() {
    if (this.verifyOnly) {
      this.log('Skipping migrations (verify-only mode)', 'INFO');
      return true;
    }

    this.log('Running database migrations...', 'PROGRESS');

    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        env: { ...process.env },
      });

      if (stdout.includes('No pending migrations')) {
        this.log('Database schema is up to date', 'SUCCESS');
      } else if (stdout.includes('migrations have been applied')) {
        this.log('Database migrations applied successfully', 'SUCCESS');
        console.log(stdout);
      } else {
        this.log('Migration output:', 'INFO');
        console.log(stdout);
      }

      return true;
    } catch (error) {
      // Check if error is because migrations were already applied
      if (error.stdout && error.stdout.includes('No pending migrations')) {
        this.log('Database schema is up to date', 'SUCCESS');
        return true;
      }

      this.log(`Migration failed: ${error.message}`, 'ERROR');
      if (error.stderr) {
        console.error(error.stderr);
      }
      return false;
    }
  }

  async generatePrismaClient() {
    if (this.verifyOnly) {
      this.log('Skipping Prisma client generation (verify-only mode)', 'INFO');
      return true;
    }

    this.log('Generating Prisma Client...', 'PROGRESS');

    try {
      const { stdout } = await execAsync('npx prisma generate', {
        env: { ...process.env },
      });

      this.log('Prisma Client generated successfully', 'SUCCESS');
      return true;
    } catch (error) {
      this.log(`Prisma Client generation failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async verifySchema() {
    this.log('Verifying database schema compatibility...', 'PROGRESS');

    try {
      const {
        RestoreCompatibilityChecker,
      } = require('./verify-restore-compatibility');
      const checker = new RestoreCompatibilityChecker();

      const dbConnected = await checker.checkDatabaseConnection();
      if (!dbConnected) {
        return false;
      }

      await checker.checkMigrationStatus();
      const columnsOk = await checker.checkRequiredColumns();
      await checker.checkIndexes();

      if (this.backupFile) {
        await checker.verifyRestoreCompatibility(this.backupFile);
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$disconnect();

      if (columnsOk) {
        this.log('Schema verification passed', 'SUCCESS');
        return true;
      } else {
        this.log('Schema verification failed', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`Schema verification error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async buildApplication() {
    if (this.verifyOnly) {
      this.log('Skipping application build (verify-only mode)', 'INFO');
      return true;
    }

    this.log('Building Next.js application...', 'PROGRESS');

    try {
      // Check if we're in production
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        this.log('Building for production...', 'PROGRESS');
        const { stdout } = await execAsync('npm run build', {
          env: { ...process.env },
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });
        this.log('Production build completed', 'SUCCESS');
      } else {
        this.log('Skipping build in development mode', 'INFO');
      }

      return true;
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'WARN');
      this.log('You can build manually later with: npm run build', 'INFO');
      return true; // Don't fail setup for build errors
    }
  }

  async createAdminUser() {
    if (this.verifyOnly) {
      this.log('Skipping admin user creation (verify-only mode)', 'INFO');
      return true;
    }

    this.log('Checking for admin user...', 'PROGRESS');

    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      await prisma.$disconnect();

      if (adminCount > 0) {
        this.log(`Found ${adminCount} admin user(s)`, 'INFO');
        this.log('Skipping admin user creation', 'INFO');
        return true;
      }

      this.log('No admin users found', 'WARN');
      this.log('You can create an admin user later with:', 'INFO');
      this.log('  node scripts/seed-admin.js', 'INFO');

      return true;
    } catch (error) {
      this.log(`Error checking admin users: ${error.message}`, 'WARN');
      return true; // Don't fail setup
    }
  }

  printNextSteps() {
    console.log('\n' + '='.repeat(70));
    console.log('SETUP COMPLETE - NEXT STEPS');
    console.log('='.repeat(70) + '\n');

    if (this.verifyOnly) {
      console.log(
        '✅ Verification complete. Your system is ready for restore.\n'
      );
      console.log('To restore your backup:');
      console.log('  1. Start the application: npm run dev (or npm start)');
      console.log('  2. Log in as admin');
      console.log('  3. Navigate to Admin > Data Management > Restore');
      console.log('  4. Upload your backup file and restore\n');
      return;
    }

    console.log('✅ Fresh installation setup complete!\n');
    console.log('Next steps to restore your backup:\n');
    console.log("1. Create an admin user (if you haven't already):");
    console.log('   node scripts/seed-admin.js\n');
    console.log('2. Start the application:');
    console.log('   npm run dev          # Development');
    console.log('   npm start            # Production\n');
    console.log('3. Restore your backup:');
    console.log('   - Open the app in your browser');
    console.log('   - Log in with your admin account');
    console.log('   - Go to Admin > Data Management > Restore');
    console.log('   - Upload your backup file:\n');
    if (this.backupFile) {
      console.log(`     ${this.backupFile}\n`);
    }
    console.log('   - Click "Restore" and wait for completion\n');
    console.log('4. Verify the restored data:');
    console.log('   - Check that all users are present');
    console.log('   - Verify token purchases and contributions');
    console.log('   - Check meter readings\n');
    console.log('='.repeat(70) + '\n');
  }

  async run() {
    console.log(
      '╔═══════════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║         Fresh Installation Setup for Remote Server               ║'
    );
    console.log(
      '╚═══════════════════════════════════════════════════════════════════╝\n'
    );

    if (this.verifyOnly) {
      console.log('MODE: Verification Only\n');
    } else {
      console.log('MODE: Full Setup\n');
    }

    // Step 1: Check environment
    const envOk = await this.checkEnvironment();
    if (!envOk) {
      this.log('Setup failed: Environment check failed', 'ERROR');
      process.exit(1);
    }

    // Step 2: Check database connection
    const dbOk = await this.checkDatabaseConnection();
    if (!dbOk) {
      this.log('Setup failed: Database connection failed', 'ERROR');
      process.exit(1);
    }

    // Step 3: Run migrations
    const migrationsOk = await this.runMigrations();
    if (!migrationsOk) {
      this.log('Setup failed: Migrations failed', 'ERROR');
      process.exit(1);
    }

    // Step 4: Generate Prisma Client
    const clientOk = await this.generatePrismaClient();
    if (!clientOk) {
      this.log('Setup failed: Prisma Client generation failed', 'ERROR');
      process.exit(1);
    }

    // Step 5: Verify schema
    const schemaOk = await this.verifySchema();
    if (!schemaOk) {
      this.log('Setup failed: Schema verification failed', 'ERROR');
      process.exit(1);
    }

    // Step 6: Build application (optional)
    await this.buildApplication();

    // Step 7: Check for admin user
    await this.createAdminUser();

    // Print next steps
    this.printNextSteps();

    this.log('Setup completed successfully!', 'SUCCESS');
    process.exit(0);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    verifyOnly: args.includes('--verify-only'),
    backupFile: null,
  };

  const backupArg = args.find((arg) => arg.startsWith('--backup-file='));
  if (backupArg) {
    options.backupFile = backupArg.split('=')[1];
  }

  return options;
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  const setup = new FreshInstallSetup(options);
  setup.run().catch((error) => {
    console.error('\n❌ Setup failed with error:', error);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { FreshInstallSetup };
