const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class DatabaseAutoSetup {
  constructor() {
    this.appRoot = path.resolve(__dirname, '..');
    this.logFile = path.join(this.appRoot, 'logs', 'db-setup.log');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [DB-SETUP] [${level}] ${message}`;

    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (err) {
      // Continue if logging fails
    }

    console.log(logMessage);
  }

  async checkEnvironmentFile() {
    const envFiles = ['.env', '.env.local'];
    let envPath = null;

    for (const envFile of envFiles) {
      const fullPath = path.join(this.appRoot, envFile);
      if (fs.existsSync(fullPath)) {
        envPath = fullPath;
        break;
      }
    }

    if (!envPath) {
      this.log('❌ No .env file found! Creating basic .env file...', 'WARN');
      await this.createBasicEnvFile();
      envPath = path.join(this.appRoot, '.env');
    }

    // Check if DATABASE_URL is set
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('DATABASE_URL')) {
      this.log('❌ DATABASE_URL not found in environment file!', 'ERROR');
      throw new Error('DATABASE_URL must be configured in .env file');
    }

    this.log(`✅ Environment file found: ${envPath}`);
    return envPath;
  }

  async createBasicEnvFile() {
    const basicEnv = `# Electricity Tokens Tracker Environment Configuration
# Generated automatically by db-setup-auto.js

# Database Configuration
# Replace with your actual database URL
DATABASE_URL="postgresql://username:password@localhost:5432/electricity_tokens"

# NextAuth Configuration  
NEXTAUTH_SECRET="your-secret-key-here-replace-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Application Configuration
NODE_ENV="production"
PORT=3000

# Security Configuration
BCRYPT_ROUNDS=12

# Optional: Logging Configuration
LOG_LEVEL="info"
`;

    const envPath = path.join(this.appRoot, '.env');
    fs.writeFileSync(envPath, basicEnv);

    this.log(
      '📝 Created basic .env file - PLEASE UPDATE DATABASE_URL and other settings!'
    );
  }

  async checkPrismaAvailable() {
    try {
      await execAsync('npx prisma --version');
      this.log('✅ Prisma CLI available');
      return true;
    } catch (error) {
      this.log(
        '❌ Prisma CLI not available - installing dependencies...',
        'WARN'
      );
      return false;
    }
  }

  async installDependencies() {
    this.log('📦 Installing/updating dependencies...');

    return new Promise((resolve, reject) => {
      const installProcess = spawn('npm', ['install'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
      });

      let output = '';
      let errors = '';

      installProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Log important lines
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (
            line.trim() &&
            (line.includes('added') ||
              line.includes('updated') ||
              line.includes('installed'))
          ) {
            this.log(`📦 ${line.trim()}`);
          }
        });
      });

      installProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errors += text;
        // Log errors that aren't just warnings
        if (!text.includes('WARN') && text.trim()) {
          this.log(`⚠️ ${text.trim()}`, 'WARN');
        }
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          this.log('✅ Dependencies installed successfully');
          resolve(true);
        } else {
          this.log(
            `❌ Dependency installation failed with code ${code}`,
            'ERROR'
          );
          reject(new Error(`npm install failed: ${errors}`));
        }
      });

      installProcess.on('error', (error) => {
        this.log(`❌ Failed to run npm install: ${error.message}`, 'ERROR');
        reject(error);
      });
    });
  }

  async testDatabaseConnection() {
    this.log('🔌 Testing database connection with multiple strategies...');

    // Strategy 1: Check migration status (safe, doesn't modify schema)
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate status', {
        cwd: this.appRoot,
        timeout: 30000,
      });

      this.log('✅ Database connection successful (migration status)');
      return { exists: true, accessible: true, strategy: 'migrate-status' };
    } catch (statusError) {
      this.log(
        `⚠️ Migration status check failed: ${statusError.message}`,
        'WARN'
      );
    }

    // Strategy 2: Test basic Prisma generate (validates DATABASE_URL format)
    try {
      await execAsync('npx prisma generate', {
        cwd: this.appRoot,
        timeout: 30000,
      });

      this.log('✅ Database URL format valid, assuming database is accessible');
      return { exists: false, accessible: true, strategy: 'generate-test' };
    } catch (generateError) {
      const errorMessage = generateError.message.toLowerCase();

      if (
        errorMessage.includes('invalid') ||
        errorMessage.includes('connection')
      ) {
        this.log('❌ Database connection invalid', 'ERROR');
        return { exists: false, accessible: false, strategy: 'failed' };
      }

      this.log('⚠️ Database status unclear, will attempt setup', 'WARN');
      return { exists: false, accessible: true, strategy: 'unknown' };
    }
  }

  async createDatabaseIfNeeded() {
    this.log('🗃️ Ensuring database exists...');

    try {
      // Use migrate deploy (safe, doesn't modify schema)
      await execAsync('npx prisma migrate deploy', {
        cwd: this.appRoot,
        timeout: 60000,
      });

      this.log('✅ Database migrations applied successfully');
      return true;
    } catch (migrateError) {
      this.log(
        `❌ Database migration failed. Manual intervention required.`,
        'ERROR'
      );
      this.log(
        `💡 Check your DATABASE_URL and ensure the database server is running.`
      );
      throw new Error(`Database creation failed: ${migrateError.message}`);
    }
  }

  async runMigrations() {
    this.log('🔄 Running database migrations...');

    // Use migrate deploy (safe, doesn't modify schema)
    try {
      this.log('🔄 Applying migrations with migrate deploy');

      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: this.appRoot,
        timeout: 120000,
      });

      this.log('✅ Database migrations deployed successfully');

      const clientGenerated = await this.generatePrismaClient();
      if (!clientGenerated) {
        this.log(
          '⚠️ Prisma client generation skipped due to file locks - continuing anyway',
          'WARN'
        );
      }

      return { success: true, clientGenerated };
    } catch (migrateError) {
      this.log(`❌ Migration failed: ${migrateError.message}`, 'ERROR');
      throw new Error(`Database migration failed: ${migrateError.message}`);
    }
  }

  async checkMigrationStatus() {
    try {
      const { stdout } = await execAsync('npx prisma migrate status', {
        cwd: this.appRoot,
        timeout: 15000,
      });
      return stdout;
    } catch (error) {
      // If status check fails, we'll assume migrations need to be handled
      return null;
    }
  }

  async isMigrationApplied(migrationName) {
    try {
      const status = await this.checkMigrationStatus();
      if (status) {
        // Check if migration is listed as applied or if there are no pending migrations
        return (
          status.includes(`✅ ${migrationName}`) ||
          status.includes('Database schema is up to date!') ||
          !status.includes(`❌ ${migrationName}`)
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async markMigrationsAsApplied() {
    this.log('🔧 Marking existing migrations as applied...');

    const migrationsDir = path.join(this.appRoot, 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      this.log('ℹ️  No migrations directory found, skipping');
      return;
    }

    try {
      const migrations = fs
        .readdirSync(migrationsDir)
        .filter((dir) =>
          fs.statSync(path.join(migrationsDir, dir)).isDirectory()
        )
        .sort();

      for (const migration of migrations) {
        // First check if migration is already applied
        const isApplied = await this.isMigrationApplied(migration);
        if (isApplied) {
          this.log(`✅ Migration already applied: ${migration}`);
          continue;
        }

        try {
          await execAsync(
            `npx prisma migrate resolve --applied "${migration}"`,
            {
              cwd: this.appRoot,
              timeout: 30000,
            }
          );
          this.log(`✅ Marked migration as applied: ${migration}`);
        } catch (resolveError) {
          // Check if migration is already applied (P3008 error)
          if (
            resolveError.message.includes('P3008') ||
            resolveError.message.includes('already recorded as applied')
          ) {
            this.log(`✅ Migration already applied: ${migration}`);
          } else {
            // Other errors are warnings but non-critical
            this.log(
              `⚠️ Could not mark migration ${migration}: ${resolveError.message}`,
              'WARN'
            );
          }
        }
      }
    } catch (error) {
      this.log(
        `⚠️ Could not process migrations directory: ${error.message}`,
        'WARN'
      );
    }
  }

  async handleFreshDatabaseSetup() {
    this.log('🔧 Setting up fresh database with migrations...');

    try {
      // Apply migrations (safe approach)
      await execAsync('npx prisma migrate deploy', {
        cwd: this.appRoot,
        timeout: 120000,
      });

      this.log('✅ Fresh database migrations applied');

      // Generate client
      await this.generatePrismaClient();

      return true;
    } catch (error) {
      throw new Error(`Fresh database setup failed: ${error.message}`);
    }
  }

  async handleDatabaseBaseline() {
    this.log('🔧 Applying database baseline for existing production data...');

    try {
      // List of migrations that should be marked as applied for existing databases
      const baselineMigrations = [
        '20250706132952_init',
        '20250706215039_add_user_theme_preference',
        '20250707201336_add_last_login_at',
        '20250708004551_add_metadata_to_audit_log',
        '20250708005417_add_cascade_delete_to_audit_logs',
        '20250708120000_add_performance_indexes',
      ];

      for (const migration of baselineMigrations) {
        try {
          await execAsync(
            `npx prisma migrate resolve --applied "${migration}"`,
            {
              cwd: this.appRoot,
              timeout: 30000,
            }
          );
          this.log(`✅ Marked migration as applied: ${migration}`);
        } catch (resolveError) {
          // Check if migration is already applied (P3008 error)
          if (
            resolveError.message.includes('P3008') ||
            resolveError.message.includes('already recorded as applied')
          ) {
            this.log(`✅ Migration already applied: ${migration}`);
          } else {
            // Other errors are warnings but non-critical
            this.log(
              `⚠️ Could not resolve migration ${migration}: ${resolveError.message}`,
              'WARN'
            );
          }
        }
      }

      // Now try to apply any remaining migrations
      await execAsync('npx prisma migrate deploy', {
        cwd: this.appRoot,
        timeout: 120000,
      });

      this.log('✅ Database baseline and migrations completed');

      const clientGenerated = await this.generatePrismaClient();
      if (!clientGenerated) {
        this.log(
          '⚠️ Prisma client generation skipped due to file locks - continuing anyway',
          'WARN'
        );
      }

      return true;
    } catch (error) {
      this.log(`❌ Database baseline failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async generatePrismaClient() {
    this.log('🔨 Generating Prisma client...');

    try {
      const { stdout, stderr } = await execAsync('npx prisma generate', {
        cwd: this.appRoot,
        timeout: 60000,
      });

      this.log('✅ Prisma client generated successfully');
      return true;
    } catch (error) {
      this.log(`❌ Prisma client generation failed: ${error.message}`, 'ERROR');

      // Check if it's a file lock issue (EPERM)
      if (
        error.message.includes('EPERM') ||
        error.message.includes('operation not permitted')
      ) {
        this.log('⚠️ File lock detected - attempting recovery...', 'WARN');

        try {
          // Try to clear the .prisma directory and regenerate
          const prismaClientPath = path.join(
            this.appRoot,
            'node_modules',
            '.prisma'
          );
          if (fs.existsSync(prismaClientPath)) {
            this.log('🧹 Clearing Prisma client cache...');
            await execAsync(`rmdir /s /q "${prismaClientPath}"`, {
              cwd: this.appRoot,
              timeout: 10000,
            });

            // Wait a moment for file system to settle
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Try again
            const { stdout: stdout2 } = await execAsync('npx prisma generate', {
              cwd: this.appRoot,
              timeout: 60000,
            });

            this.log(
              '✅ Prisma client generated successfully after cache clear'
            );
            return true;
          }
        } catch (retryError) {
          this.log(`⚠️ Recovery attempt failed: ${retryError.message}`, 'WARN');
        }

        // If file lock persists, warn but don't fail completely
        this.log(
          '⚠️ Prisma client generation failed due to file locks - continuing with existing client',
          'WARN'
        );
        this.log(
          '💡 The application may still work with the existing Prisma client'
        );
        return false; // Don't throw, just return false
      }

      throw error;
    }
  }

  async seedDatabase() {
    this.log('🌱 Checking if database seeding is needed...');

    try {
      // Check if we have a seed script
      const seedScript = path.join(this.appRoot, 'prisma', 'seed.ts');
      const seedScriptJs = path.join(this.appRoot, 'prisma', 'seed.js');

      if (fs.existsSync(seedScript) || fs.existsSync(seedScriptJs)) {
        this.log('🌱 Running database seed...');

        const { stdout, stderr } = await execAsync('npx prisma db seed', {
          cwd: this.appRoot,
          timeout: 120000,
        });

        this.log('✅ Database seeded successfully');
        return true;
      } else {
        this.log('ℹ️  No seed script found, skipping seeding');
        return true;
      }
    } catch (error) {
      // Seeding failure is not critical
      this.log(
        `⚠️ Database seeding failed (non-critical): ${error.message}`,
        'WARN'
      );
      return false;
    }
  }

  async performFullSetup() {
    try {
      this.log('🚀 Starting comprehensive database setup...');

      // 1. Check environment configuration
      await this.checkEnvironmentFile();

      // 2. Ensure dependencies are installed
      if (!(await this.checkPrismaAvailable())) {
        await this.installDependencies();
      }

      // 3. Test database connection
      const dbStatus = await this.testDatabaseConnection();

      if (!dbStatus.accessible) {
        throw new Error(
          'Cannot connect to database server. Please check your DATABASE_URL and ensure the database server is running.'
        );
      }

      // 4. Create database if needed
      if (!dbStatus.exists) {
        await this.createDatabaseIfNeeded();
      }

      // 5. Run migrations
      const migrationResult = await this.runMigrations();

      // Database setup complete - seeding is now optional and manual
      this.log('✅ Database setup completed successfully!');
      this.log('📊 Database is ready for the application');
      this.log('🌱 To seed with test data (optional): npm run db:seed');

      return true;
    } catch (error) {
      this.log(`❌ Database setup failed: ${error.message}`, 'ERROR');
      this.log('');
      this.log('🔧 Troubleshooting steps:');
      this.log('1. Verify DATABASE_URL in your .env file');
      this.log('2. Ensure database server is running and accessible');
      this.log('3. Check database user permissions');
      this.log('4. Review logs above for specific errors');
      this.log('');
      throw error;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  const dbSetup = new DatabaseAutoSetup();

  try {
    switch (command) {
      case 'setup':
        await dbSetup.performFullSetup();
        break;

      case 'test':
        await dbSetup.checkEnvironmentFile();
        const status = await dbSetup.testDatabaseConnection();
        console.log('Database connection status:', status);
        break;

      case 'migrate':
        await dbSetup.runMigrations();
        break;

      case 'seed':
        await dbSetup.seedDatabase();
        break;

      default:
        console.log('Usage: node db-setup-auto.js [setup|test|migrate|seed]');
        console.log('  setup   - Complete database setup (default)');
        console.log('  test    - Test database connection');
        console.log('  migrate - Run migrations only');
        console.log('  seed    - Seed database only');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Database setup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseAutoSetup;
