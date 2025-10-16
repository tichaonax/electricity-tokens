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

    // Strategy 1: Quick connection test with introspection
    try {
      const { stdout, stderr } = await execAsync(
        'npx prisma db pull --preview-feature --force',
        {
          cwd: this.appRoot,
          timeout: 30000,
        }
      );

      this.log('✅ Database connection successful (introspection)');
      return { exists: true, accessible: true, strategy: 'introspection' };
    } catch (pullError) {
      this.log(`⚠️ Introspection failed: ${pullError.message}`, 'WARN');
    }

    // Strategy 2: Test with db push dry run
    try {
      const { stdout, stderr } = await execAsync(
        'npx prisma db push --preview-feature --dry-run',
        {
          cwd: this.appRoot,
          timeout: 20000,
        }
      );

      this.log('✅ Database connection successful (dry run)');
      return { exists: true, accessible: true, strategy: 'dry-run' };
    } catch (dryRunError) {
      this.log(`⚠️ Dry run failed: ${dryRunError.message}`, 'WARN');
    }

    // Strategy 3: Test basic Prisma generate (validates DATABASE_URL format)
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
      // Try to create database using Prisma's db push (creates DB if not exists)
      const { stdout, stderr } = await execAsync(
        'npx prisma db push --accept-data-loss',
        {
          cwd: this.appRoot,
          timeout: 60000,
        }
      );

      this.log('✅ Database created/updated successfully');
      return true;
    } catch (error) {
      // If db push fails, try migrate deploy
      this.log('⚠️ db push failed, trying migrate deploy...', 'WARN');

      try {
        await execAsync('npx prisma migrate deploy', {
          cwd: this.appRoot,
          timeout: 60000,
        });

        this.log('✅ Database migrations applied successfully');
        return true;
      } catch (migrateError) {
        this.log(
          `❌ Both db push and migrate failed. Manual intervention required.`,
          'ERROR'
        );
        this.log(
          `💡 Check your DATABASE_URL and ensure the database server is running.`
        );
        throw new Error(`Database creation failed: ${error.message}`);
      }
    }
  }

  async runMigrations() {
    this.log('🔄 Running database migrations with bulletproof strategy...');

    // Strategy 1: Try direct db push (bypasses migration status issues)
    try {
      this.log('🔄 Strategy 1: Direct schema push (bypasses migration issues)');

      const { stdout, stderr } = await execAsync(
        'npx prisma db push --accept-data-loss --skip-generate',
        {
          cwd: this.appRoot,
          timeout: 120000,
        }
      );

      this.log('✅ Database schema pushed successfully');
      await this.generatePrismaClient();

      // Mark existing migrations as applied if they exist
      await this.markMigrationsAsApplied();

      return true;
    } catch (dbPushError) {
      this.log(`⚠️ Strategy 1 failed: ${dbPushError.message}`, 'WARN');
    }

    // Strategy 2: Try migrate deploy without status check
    try {
      this.log('🔄 Strategy 2: Direct migrate deploy (skip status check)');

      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: this.appRoot,
        timeout: 120000,
      });

      this.log('✅ Database migrations deployed successfully');
      await this.generatePrismaClient();
      return true;
    } catch (migrateError) {
      this.log(`⚠️ Strategy 2 failed: ${migrateError.message}`, 'WARN');
    }

    // Strategy 3: Handle as fresh database with baseline
    try {
      this.log('🔄 Strategy 3: Fresh database setup with baseline');
      return await this.handleFreshDatabaseSetup();
    } catch (freshError) {
      this.log(
        `❌ All migration strategies failed: ${freshError.message}`,
        'ERROR'
      );
      throw new Error(`Database migration failed: ${freshError.message}`);
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
          // Non-critical - continue with other migrations
          this.log(
            `⚠️ Could not mark migration ${migration}: ${resolveError.message}`,
            'WARN'
          );
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
    this.log('🔧 Setting up fresh database with complete schema...');

    try {
      // Force push the complete schema
      await execAsync('npx prisma db push --accept-data-loss --force-reset', {
        cwd: this.appRoot,
        timeout: 120000,
      });

      this.log('✅ Fresh database schema created');

      // Generate client
      await this.generatePrismaClient();

      // Mark all migrations as applied
      await this.markMigrationsAsApplied();

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
          this.log(
            `⚠️ Could not resolve migration ${migration}: ${resolveError.message}`,
            'WARN'
          );
        }
      }

      // Now try to apply any remaining migrations
      await execAsync('npx prisma migrate deploy', {
        cwd: this.appRoot,
        timeout: 120000,
      });

      this.log('✅ Database baseline and migrations completed');
      await this.generatePrismaClient();
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
      await this.runMigrations();

      // 6. Seed database (optional)
      await this.seedDatabase();

      this.log('🎉 Database setup completed successfully!');
      this.log('📊 Database is ready for the application');

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
