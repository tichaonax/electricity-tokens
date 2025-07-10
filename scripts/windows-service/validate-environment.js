const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.appRoot = path.resolve(__dirname, '../..');

    // Load environment variables from .env.local if it exists
    this.loadEnvironmentVariables();
  }

  loadEnvironmentVariables() {
    const envFiles = ['.env.local', '.env'];

    for (const envFile of envFiles) {
      const envPath = path.join(this.appRoot, envFile);
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const lines = envContent.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
              const [key, ...valueParts] = trimmedLine.split('=');
              if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                process.env[key] = value;
              }
            }
          }
          console.log(`✅ Loaded environment variables from ${envFile}`);
        } catch (err) {
          console.warn(`⚠️  Could not load ${envFile}: ${err.message}`);
        }
      }
    }
  }

  log(message, type = 'INFO') {
    const prefix =
      {
        INFO: '✅',
        WARN: '⚠️ ',
        ERROR: '❌',
      }[type] || 'ℹ️ ';

    console.log(`${prefix} ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'ERROR');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'WARN');
  }

  checkPlatform() {
    this.log('Checking platform compatibility...');

    if (process.platform !== 'win32') {
      this.addError(
        'Windows service support is only available on Windows platforms.'
      );
      return false;
    }

    this.log('Platform: Windows ✓');
    return true;
  }

  checkAdminPrivileges() {
    this.log('Checking administrator privileges...');

    try {
      execSync('net session', { stdio: 'pipe' });
      this.log('Administrator privileges: Available ✓');
      return true;
    } catch (err) {
      this.addError(
        'Administrator privileges required. Please run as Administrator.'
      );
      return false;
    }
  }

  checkNodeVersion() {
    this.log('Checking Node.js version...');

    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    if (majorVersion < 18) {
      this.addError(`Node.js 18+ required. Current version: ${version}`);
      return false;
    }

    this.log(`Node.js version: ${version} ✓`);
    return true;
  }

  checkApplicationFiles() {
    this.log('Checking application files...');

    const requiredFiles = ['package.json', 'next.config.js', '.env.local'];

    const requiredDirs = ['src', 'scripts'];

    let allFilesExist = true;

    // Check files
    for (const file of requiredFiles) {
      const filePath = path.join(this.appRoot, file);
      if (!fs.existsSync(filePath)) {
        if (file === '.env.local') {
          this.addWarning(
            `${file} not found. Environment variables should be configured.`
          );
        } else {
          this.addError(`Required file not found: ${file}`);
          allFilesExist = false;
        }
      } else {
        this.log(`${file} ✓`);
      }
    }

    // Check directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.appRoot, dir);
      if (!fs.existsSync(dirPath)) {
        this.addError(`Required directory not found: ${dir}`);
        allFilesExist = false;
      } else {
        this.log(`${dir}/ ✓`);
      }
    }

    return allFilesExist;
  }

  checkDependencies() {
    this.log('Checking dependencies...');

    try {
      const packageJsonPath = path.join(this.appRoot, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        this.addError('package.json not found');
        return false;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check if node-windows is in dependencies
      if (
        !packageJson.dependencies ||
        !packageJson.dependencies['node-windows']
      ) {
        this.addError('node-windows dependency not found. Run: npm install');
        return false;
      }

      // Check if node_modules exists
      const nodeModulesPath = path.join(this.appRoot, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        this.addError('node_modules not found. Run: npm install');
        return false;
      }

      this.log('Dependencies ✓');
      return true;
    } catch (err) {
      this.addError(`Error checking dependencies: ${err.message}`);
      return false;
    }
  }

  checkEnvironmentVariables() {
    this.log('Checking environment variables...');

    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];

    const optionalEnvVars = ['NEXTAUTH_URL', 'PORT'];

    let allRequired = true;

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.addError(`Required environment variable not set: ${envVar}`);
        allRequired = false;
      } else {
        this.log(`${envVar} ✓`);
      }
    }

    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        this.addWarning(`Optional environment variable not set: ${envVar}`);
      } else {
        this.log(`${envVar} ✓`);
      }
    }

    return allRequired;
  }

  checkDatabaseConnection() {
    this.log('Checking database connection...');

    if (!process.env.DATABASE_URL) {
      this.addError('DATABASE_URL not configured');
      return false;
    }

    try {
      // Try to test database connection using existing script
      const testDbScript = path.join(this.appRoot, 'scripts', 'test-db.js');
      if (fs.existsSync(testDbScript)) {
        execSync(`node "${testDbScript}"`, { stdio: 'pipe', timeout: 10000 });
        this.log('Database connection ✓');
        return true;
      } else {
        this.addWarning(
          'Database connection test script not found. Manual verification recommended.'
        );
        return true;
      }
    } catch (err) {
      this.addError(`Database connection failed: ${err.message}`);
      return false;
    }
  }

  checkPort() {
    this.log('Checking port availability...');

    const port = process.env.PORT || 3000;

    try {
      const result = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
      });
      if (result.trim()) {
        this.addWarning(
          `Port ${port} appears to be in use. Service may conflict with existing applications.`
        );
      } else {
        this.log(`Port ${port} available ✓`);
      }
      return true;
    } catch (err) {
      // No output means port is likely available
      this.log(`Port ${port} available ✓`);
      return true;
    }
  }

  checkServiceFiles() {
    this.log('Checking service installation files...');

    const serviceFiles = [
      'config.js',
      'service-wrapper.js',
      'install-service.js',
      'uninstall-service.js',
    ];

    let allFilesExist = true;

    for (const file of serviceFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        this.addError(`Service file not found: ${file}`);
        allFilesExist = false;
      } else {
        this.log(`${file} ✓`);
      }
    }

    return allFilesExist;
  }

  async runAllChecks() {
    console.log('🔍 Validating Environment for Windows Service Installation');
    console.log('=======================================================\n');

    const checks = [
      () => this.checkPlatform(),
      () => this.checkAdminPrivileges(),
      () => this.checkNodeVersion(),
      () => this.checkApplicationFiles(),
      () => this.checkDependencies(),
      () => this.checkEnvironmentVariables(),
      () => this.checkDatabaseConnection(),
      () => this.checkPort(),
      () => this.checkServiceFiles(),
    ];

    for (const check of checks) {
      try {
        check();
        console.log(''); // Add spacing between checks
      } catch (err) {
        this.addError(`Validation check failed: ${err.message}`);
      }
    }

    return this.generateReport();
  }

  generateReport() {
    console.log('📊 Validation Report');
    console.log('===================\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(
        '🎉 All checks passed! Your environment is ready for service installation.'
      );
      console.log('\n📋 Next Steps:');
      console.log('  1. Run: npm run service:install');
      console.log('  2. Check status: npm run service:status');
      console.log('  3. View logs: npm run service:logs');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('❌ Critical Issues Found:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log(
        '🔧 Please resolve all critical issues before installing the service.'
      );
      return false;
    } else {
      console.log(
        '✅ No critical issues found. You can proceed with installation.'
      );
      console.log('⚠️  Consider addressing warnings for optimal operation.');
      return true;
    }
  }
}

async function main() {
  const validator = new EnvironmentValidator();
  const isValid = await validator.runAllChecks();

  process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Validation failed:', err);
    process.exit(1);
  });
}

module.exports = EnvironmentValidator;
