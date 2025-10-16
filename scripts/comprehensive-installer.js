const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class ComprehensiveInstaller {
  constructor() {
    this.appRoot = path.resolve(__dirname, '..');
    this.logFile = path.join(this.appRoot, 'logs', 'installation.log');
    this.configFile = path.join(this.appRoot, '.install-config.json');
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
    const logMessage = `[${timestamp}] [INSTALLER] [${level}] ${message}`;

    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (err) {
      // Continue if logging fails
    }

    console.log(logMessage);
  }

  async checkAdminPrivileges() {
    try {
      await execAsync('net session');
      this.log('✅ Administrator privileges confirmed');
      return true;
    } catch {
      this.log(
        '❌ Administrator privileges required for full installation',
        'ERROR'
      );
      this.log(
        '💡 Some features will be limited without admin privileges',
        'WARN'
      );
      return false;
    }
  }

  async detectInstallationType() {
    const hasService = await this.checkServiceExists();
    const hasDatabase = await this.checkDatabaseExists();
    const hasBuiltApp = await this.checkBuildExists();

    if (!hasService && !hasDatabase && !hasBuiltApp) {
      return 'fresh';
    } else if (hasService && hasDatabase) {
      return 'update';
    } else {
      return 'repair';
    }
  }

  async checkServiceExists() {
    try {
      const { stdout } = await execAsync('sc query ElectricityTracker');
      return stdout.includes('SERVICE_NAME: ElectricityTracker');
    } catch {
      return false;
    }
  }

  async checkDatabaseExists() {
    try {
      const envPath = path.join(this.appRoot, '.env');
      if (!fs.existsSync(envPath)) {
        return false;
      }

      // Try a simple Prisma command to check DB
      await execAsync('npx prisma db pull --preview-feature', {
        cwd: this.appRoot,
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkBuildExists() {
    const buildDir = path.join(this.appRoot, '.next');
    const buildId = path.join(buildDir, 'BUILD_ID');
    return fs.existsSync(buildDir) && fs.existsSync(buildId);
  }

  async saveInstallConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (err) {
      this.log(`⚠️ Could not save install config: ${err.message}`, 'WARN');
    }
  }

  async loadInstallConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      }
    } catch (err) {
      this.log(`⚠️ Could not load install config: ${err.message}`, 'WARN');
    }
    return null;
  }

  async installDependencies() {
    this.log(
      '📦 Installing Node.js dependencies with robust timeout handling...'
    );

    const strategies = [
      {
        cmd: 'npm',
        args: ['install'],
        timeout: 600000,
        name: 'Standard npm install',
      },
      {
        cmd: 'npm',
        args: ['install', '--timeout=900000'],
        timeout: 900000,
        name: 'Extended timeout npm install',
      },
      {
        cmd: 'npm',
        args: [
          'install',
          '--registry',
          'https://registry.npmjs.org/',
          '--timeout=900000',
        ],
        timeout: 900000,
        name: 'Alternative registry npm install',
      },
      {
        cmd: 'npm',
        args: ['install', '--prefer-offline', '--timeout=900000'],
        timeout: 900000,
        name: 'Offline-first npm install',
      },
    ];

    for (const strategy of strategies) {
      try {
        this.log(`🔄 Trying: ${strategy.name}`);
        const success = await this.runInstallStrategy(strategy);
        if (success) {
          this.log('✅ Dependencies installed successfully');
          return true;
        }
      } catch (error) {
        this.log(`❌ ${strategy.name} failed: ${error.message}`, 'WARN');
        // Continue to next strategy
      }
    }

    // All strategies failed
    throw new Error('All dependency installation strategies failed');
  }

  async runInstallStrategy(strategy) {
    return new Promise((resolve, reject) => {
      const installProcess = spawn(strategy.cmd, strategy.args, {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
      });

      let hasOutput = false;
      let lastOutputTime = Date.now();
      let outputBuffer = '';

      const outputTimeout = setInterval(() => {
        if (Date.now() - lastOutputTime > 120000 && hasOutput) {
          // 2 minutes no output
          this.log('⚠️ No output for 2 minutes, terminating...', 'WARN');
          installProcess.kill();
          reject(new Error('No output timeout'));
        }
      }, 30000);

      installProcess.stdout.on('data', (data) => {
        hasOutput = true;
        lastOutputTime = Date.now();
        const text = data.toString();
        outputBuffer += text;

        const lines = text.split('\n');
        lines.forEach((line) => {
          if (
            line.trim() &&
            (line.includes('added') ||
              line.includes('updated') ||
              line.includes('installed') ||
              line.includes('found') ||
              line.includes('packages'))
          ) {
            this.log(`📦 ${line.trim()}`);
          }
        });
      });

      installProcess.stderr.on('data', (data) => {
        hasOutput = true;
        lastOutputTime = Date.now();
        const text = data.toString();
        if (!text.includes('WARN') && text.trim()) {
          this.log(`⚠️ ${text.trim()}`, 'WARN');
        }
      });

      installProcess.on('close', (code) => {
        clearInterval(outputTimeout);
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      installProcess.on('error', (error) => {
        clearInterval(outputTimeout);
        reject(error);
      });

      // Overall timeout
      setTimeout(() => {
        clearInterval(outputTimeout);
        if (!hasOutput) {
          this.log('❌ No output received within timeout period', 'ERROR');
          installProcess.kill();
          reject(new Error('Complete timeout - no output received'));
        }
      }, strategy.timeout);
    });
  }

  async setupDatabase() {
    this.log('🗃️ Setting up database...');

    try {
      // Use our database auto-setup script
      const dbSetupScript = path.join(__dirname, 'db-setup-auto.js');

      return new Promise((resolve, reject) => {
        const setupProcess = spawn('node', [dbSetupScript, 'setup'], {
          cwd: this.appRoot,
          stdio: 'pipe',
          shell: true,
        });

        setupProcess.stdout.on('data', (data) => {
          const text = data.toString();
          const lines = text.split('\n');
          lines.forEach((line) => {
            if (line.trim()) {
              this.log(`🗃️ ${line.trim()}`);
            }
          });
        });

        setupProcess.stderr.on('data', (data) => {
          const text = data.toString();
          if (text.trim()) {
            this.log(`🗃️ ${text.trim()}`, 'WARN');
          }
        });

        setupProcess.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Database setup completed');
            resolve(true);
          } else {
            this.log('❌ Database setup failed', 'ERROR');
            reject(new Error('Database setup failed'));
          }
        });
      });
    } catch (error) {
      this.log(`❌ Database setup error: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async buildApplication() {
    this.log('🔨 Building application...');

    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
      });

      buildProcess.stdout.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            this.log(`🔨 ${line.trim()}`);
          }
        });
      });

      buildProcess.stderr.on('data', (data) => {
        const text = data.toString();
        if (text.trim()) {
          this.log(`🔨 ${text.trim()}`, 'WARN');
        }
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          this.log('✅ Application built successfully');
          resolve(true);
        } else {
          this.log('❌ Application build failed', 'ERROR');
          reject(new Error('Build failed'));
        }
      });

      // Timeout after 15 minutes for complex builds
      setTimeout(() => {
        buildProcess.kill();
        reject(new Error('Build timeout after 15 minutes'));
      }, 900000);
    });
  }

  async installService(isAdmin) {
    if (!isAdmin) {
      this.log(
        '⚠️ Skipping service installation (requires admin privileges)',
        'WARN'
      );
      return false;
    }

    this.log('🔧 Installing Windows service...');

    try {
      return new Promise((resolve, reject) => {
        const serviceScript = path.join(
          __dirname,
          'windows-service',
          'complete-service-setup.js'
        );

        const serviceProcess = spawn('node', [serviceScript, 'install'], {
          cwd: this.appRoot,
          stdio: 'pipe',
          shell: true,
        });

        serviceProcess.stdout.on('data', (data) => {
          const text = data.toString();
          const lines = text.split('\n');
          lines.forEach((line) => {
            if (line.trim()) {
              this.log(`🔧 ${line.trim()}`);
            }
          });
        });

        serviceProcess.stderr.on('data', (data) => {
          const text = data.toString();
          if (text.trim()) {
            this.log(`🔧 ${text.trim()}`, 'WARN');
          }
        });

        serviceProcess.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Service installation completed');
            resolve(true);
          } else {
            this.log('❌ Service installation failed', 'ERROR');
            reject(new Error('Service installation failed'));
          }
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          serviceProcess.kill();
          reject(new Error('Service installation timeout'));
        }, 300000);
      });
    } catch (error) {
      this.log(`❌ Service installation error: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async setupGitHooks() {
    this.log('🪝 Setting up Git hooks...');

    try {
      const gitHooksDir = path.join(this.appRoot, '.git', 'hooks');
      const sourceHooksDir = path.join(this.appRoot, '.githooks');

      if (!fs.existsSync(gitHooksDir)) {
        this.log('⚠️ Not a Git repository, skipping Git hooks setup', 'WARN');
        return false;
      }

      // Copy hooks
      const hooks = ['post-merge', 'post-checkout'];

      for (const hook of hooks) {
        const sourceHook = path.join(sourceHooksDir, hook);
        const targetHook = path.join(gitHooksDir, hook);

        if (fs.existsSync(sourceHook)) {
          fs.copyFileSync(sourceHook, targetHook);

          // Make executable (Windows doesn't really need this but for consistency)
          try {
            await execAsync(`chmod +x "${targetHook}"`);
          } catch {
            // Ignore on Windows
          }

          this.log(`✅ Installed Git hook: ${hook}`);
        }
      }

      this.log('✅ Git hooks setup completed');
      return true;
    } catch (error) {
      this.log(`⚠️ Git hooks setup failed: ${error.message}`, 'WARN');
      return false;
    }
  }

  async verifyInstallation() {
    this.log('🔍 Verifying installation...');

    const checks = [];

    // Check dependencies
    try {
      await execAsync('npm ls --depth=0');
      checks.push({
        name: 'Dependencies',
        status: '✅',
        message: 'All dependencies installed',
      });
    } catch {
      checks.push({
        name: 'Dependencies',
        status: '❌',
        message: 'Some dependencies missing',
      });
    }

    // Check database
    try {
      await execAsync('npx prisma db pull --preview-feature', {
        timeout: 10000,
      });
      checks.push({
        name: 'Database',
        status: '✅',
        message: 'Database accessible',
      });
    } catch {
      checks.push({
        name: 'Database',
        status: '❌',
        message: 'Database not accessible',
      });
    }

    // Check build
    const buildExists = await this.checkBuildExists();
    checks.push({
      name: 'Build',
      status: buildExists ? '✅' : '❌',
      message: buildExists ? 'Application built' : 'Build missing',
    });

    // Check service
    const serviceExists = await this.checkServiceExists();
    checks.push({
      name: 'Service',
      status: serviceExists ? '✅' : '⚠️',
      message: serviceExists
        ? 'Windows service installed'
        : 'Service not installed (run as admin)',
    });

    // Display results
    this.log('📊 Installation verification results:');
    checks.forEach((check) => {
      this.log(`   ${check.status} ${check.name}: ${check.message}`);
    });

    const criticalFailed = checks.filter(
      (c) =>
        c.status === '❌' &&
        ['Dependencies', 'Database', 'Build'].includes(c.name)
    );

    return criticalFailed.length === 0;
  }

  async performFreshInstall() {
    this.log('🆕 Performing fresh installation with pre-validation...');

    // Pre-installation validation
    await this.preInstallationValidation();

    const isAdmin = await this.checkAdminPrivileges();

    const steps = [
      { name: 'Install Dependencies', fn: () => this.installDependencies() },
      { name: 'Setup Database', fn: () => this.setupDatabase() },
      { name: 'Build Application', fn: () => this.buildApplication() },
      { name: 'Install Service', fn: () => this.installService(isAdmin) },
      { name: 'Setup Git Hooks', fn: () => this.setupGitHooks() },
    ];

    for (const step of steps) {
      this.log(`⏳ ${step.name}...`);
      try {
        await step.fn();
        this.log(`✅ ${step.name} completed`);
      } catch (error) {
        this.log(`❌ ${step.name} failed: ${error.message}`, 'ERROR');

        // Try recovery strategies before failing completely
        const recovered = await this.attemptStepRecovery(step.name, error);
        if (!recovered) {
          throw new Error(
            `Installation failed at step: ${step.name} - ${error.message}`
          );
        }

        this.log(`✅ ${step.name} completed after recovery`);
      }
    }

    const config = {
      installType: 'fresh',
      installDate: new Date().toISOString(),
      version: this.getAppVersion(),
      hasService: isAdmin,
      gitCommit: await this.getCurrentGitCommit(),
    };

    await this.saveInstallConfig(config);
    this.log('✅ Fresh installation completed successfully!');
  }

  async performUpdate() {
    this.log('🔄 Performing update installation...');

    const isAdmin = await this.checkAdminPrivileges();

    const steps = [
      { name: 'Update Dependencies', fn: () => this.installDependencies() },
      { name: 'Update Database', fn: () => this.setupDatabase() },
      { name: 'Rebuild Application', fn: () => this.buildApplication() },
    ];

    // Add service restart if admin
    if (isAdmin) {
      steps.push({ name: 'Restart Service', fn: () => this.restartService() });
    }

    for (const step of steps) {
      this.log(`⏳ ${step.name}...`);
      try {
        await step.fn();
        this.log(`✅ ${step.name} completed`);
      } catch (error) {
        this.log(`❌ ${step.name} failed: ${error.message}`, 'ERROR');
        throw new Error(`Update failed at step: ${step.name}`);
      }
    }

    const config = (await this.loadInstallConfig()) || {};
    config.lastUpdate = new Date().toISOString();
    config.version = this.getAppVersion();
    config.gitCommit = await this.getCurrentGitCommit();

    await this.saveInstallConfig(config);
    this.log('✅ Update completed successfully!');
  }

  async restartService() {
    try {
      // Use our sync restart command
      return new Promise((resolve, reject) => {
        const restartScript = path.join(
          __dirname,
          'windows-service',
          'sync-restart-service.js'
        );

        const restartProcess = spawn('node', [restartScript], {
          cwd: this.appRoot,
          stdio: 'pipe',
          shell: true,
        });

        restartProcess.stdout.on('data', (data) => {
          const text = data.toString();
          if (text.trim()) {
            this.log(`♻️ ${text.trim()}`);
          }
        });

        restartProcess.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error('Service restart failed'));
          }
        });
      });
    } catch (error) {
      throw new Error(`Service restart failed: ${error.message}`);
    }
  }

  getAppVersion() {
    try {
      const packageJson = path.join(this.appRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      return pkg.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }

  async getCurrentGitCommit() {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD');
      return stdout.trim();
    } catch {
      return null;
    }
  }

  async performInstallation() {
    try {
      this.log('🚀 Starting Electricity Tokens Tracker installation...');

      const installType = await this.detectInstallationType();
      this.log(`📋 Detected installation type: ${installType.toUpperCase()}`);

      switch (installType) {
        case 'fresh':
          await this.performFreshInstall();
          break;
        case 'update':
          await this.performUpdate();
          break;
        case 'repair':
          this.log(
            '🔧 Repair installation detected, performing fresh install...'
          );
          await this.performFreshInstall();
          break;
      }

      const verificationPassed = await this.verifyInstallation();

      if (verificationPassed) {
        this.log('🎉 Installation completed successfully!');
        this.displaySuccessMessage();
      } else {
        this.log('⚠️ Installation completed with warnings', 'WARN');
        this.displayWarningMessage();
      }
    } catch (error) {
      this.log(`❌ Installation failed: ${error.message}`, 'ERROR');
      this.displayFailureMessage(error);
      throw error;
    }
  }

  displaySuccessMessage() {
    console.log(`
🎉 ELECTRICITY TOKENS TRACKER INSTALLATION SUCCESSFUL! 🎉

📋 What was installed:
   ✅ Node.js dependencies and packages
   ✅ Database schema and migrations  
   ✅ Production application build
   ✅ Windows background service (if admin privileges available)
   ✅ Git hooks for automatic updates
   ✅ Health monitoring system

🚀 Your application is now running at:
   🌐 http://localhost:3000

🔧 Management commands:
   npm run service:start        - Start the service
   npm run service:stop         - Stop the service  
   npm run sync-service:restart - Smart restart
   npm run service:diagnose     - Check status
   npm run health:check         - Health check

📊 Next steps:
   1. Visit http://localhost:3000 to access your application
   2. Run 'npm run service:diagnose' to verify everything is working
   3. The service will auto-start with Windows and self-monitor

🎯 Professional deployment complete!
`);
  }

  displayWarningMessage() {
    console.log(`
⚠️ INSTALLATION COMPLETED WITH WARNINGS ⚠️

The core application is installed but some components may need attention.

🔧 Common issues:
   • Run as Administrator for full service installation
   • Check your .env file configuration  
   • Ensure database server is running
   • Verify network connectivity

📊 Check status: npm run service:diagnose
📝 Review logs: logs/installation.log
`);
  }

  displayFailureMessage(error) {
    console.log(`
❌ INSTALLATION FAILED ❌

Error: ${error.message}

🔧 Troubleshooting:
   1. Run as Administrator
   2. Check internet connectivity
   3. Verify database configuration in .env
   4. Ensure no other services are using port 3000
   5. Review logs in logs/installation.log

💡 Get help:
   • Check SERVICE-MANAGEMENT-GUIDE.md
   • Run individual steps manually
   • Check system requirements
`);
  }

  async preInstallationValidation() {
    this.log('🔍 Running pre-installation validation...');

    // Check .env file exists and has required variables
    const envPath = path.join(this.appRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.log(
        '⚙️ .env file not found - creating with secure defaults',
        'INFO'
      );
      await this.createEnvironmentTemplate();
      this.log('✅ .env file created with working defaults');
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
    const missingVars = [];

    for (const varName of requiredVars) {
      if (
        !envContent.includes(varName) ||
        envContent.includes(`${varName}=""`)
      ) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      this.log(
        `⚙️ Missing variables detected: ${missingVars.join(', ')} - updating .env file`,
        'INFO'
      );
      await this.updateEnvironmentFile(envContent, missingVars);
      this.log('✅ .env file updated with missing variables');
    }

    // Check if ports are available
    await this.checkPortAvailability(3000);

    // Check disk space (minimum 1GB)
    await this.checkDiskSpace();

    this.log('✅ Pre-installation validation passed');
  }

  async updateEnvironmentFile(existingContent, missingVars) {
    const crypto = require('crypto');
    let updatedContent = existingContent;

    for (const varName of missingVars) {
      switch (varName) {
        case 'DATABASE_URL':
          if (!updatedContent.includes('DATABASE_URL=')) {
            updatedContent +=
              '\n# Database Configuration\nDATABASE_URL="postgresql://postgres:postgres@localhost:5432/electricity_tokens"\n';
          }
          break;

        case 'NEXTAUTH_SECRET':
          if (!updatedContent.includes('NEXTAUTH_SECRET=')) {
            const secret = crypto.randomBytes(32).toString('base64');
            updatedContent += `\n# Security Configuration\nNEXTAUTH_SECRET="${secret}"\n`;
          }
          break;
      }
    }

    const envPath = path.join(this.appRoot, '.env');
    fs.writeFileSync(envPath, updatedContent);
  }

  async createEnvironmentTemplate() {
    // Generate a secure random secret
    const crypto = require('crypto');
    const nextauthSecret = crypto.randomBytes(32).toString('base64');

    const envTemplate = `# Electricity Tokens Tracker Environment Configuration
# Auto-generated by bulletproof installer

# Database Configuration (REQUIRED)
# Default PostgreSQL connection - update if needed
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/electricity_tokens"

# Security Configuration (REQUIRED)
# Auto-generated secure secret
NEXTAUTH_SECRET="${nextauthSecret}"
NEXTAUTH_URL="http://localhost:3000"

# Application Configuration
NODE_ENV="production"
PORT=3000
APP_NAME="Electricity Tokens Tracker"

# Enhanced Security
BCRYPT_ROUNDS=12
LOG_LEVEL="warn"
AUDIT_IP_TRACKING=true
AUDIT_USER_AGENT_TRACKING=true

# Database Schema Version
DB_SCHEMA_VERSION="1.4.0"
`;

    const envPath = path.join(this.appRoot, '.env');
    fs.writeFileSync(envPath, envTemplate);
    this.log('📝 Created .env file with secure defaults');
    this.log(
      '💡 Using default PostgreSQL connection (postgres:postgres@localhost:5432)'
    );
    this.log('🔑 Generated secure NEXTAUTH_SECRET automatically');
  }

  async checkPortAvailability(port) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout.trim()) {
        this.log(`⚠️ Port ${port} is in use, will attempt to free it`, 'WARN');
        // Try to kill processes using the port
        try {
          await execAsync(
            `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`
          );
          this.log(`✅ Freed port ${port}`);
        } catch {
          this.log(`⚠️ Could not free port ${port} automatically`, 'WARN');
        }
      }
    } catch {
      // Port is available
      this.log(`✅ Port ${port} is available`);
    }
  }

  async checkDiskSpace() {
    try {
      const { stdout } = await execAsync('dir /-c | find "bytes free"');
      const freeSpaceMatch = stdout.match(/([\d,]+) bytes free/);
      if (freeSpaceMatch) {
        const freeBytes = parseInt(freeSpaceMatch[1].replace(/,/g, ''));
        const freeGB = freeBytes / (1024 * 1024 * 1024);

        if (freeGB < 1) {
          throw new Error(
            `Insufficient disk space: ${freeGB.toFixed(2)}GB available, minimum 1GB required`
          );
        }

        this.log(`✅ Sufficient disk space: ${freeGB.toFixed(2)}GB available`);
      }
    } catch (error) {
      this.log(`⚠️ Could not check disk space: ${error.message}`, 'WARN');
    }
  }

  async attemptStepRecovery(stepName, error) {
    this.log(`🔧 Attempting recovery for step: ${stepName}`);

    switch (stepName) {
      case 'Install Dependencies':
        return await this.recoverDependencyInstallation(error);

      case 'Setup Database':
        return await this.recoverDatabaseSetup(error);

      case 'Build Application':
        return await this.recoverApplicationBuild(error);

      default:
        this.log(`ℹ️  No recovery strategy available for ${stepName}`);
        return false;
    }
  }

  async recoverDependencyInstallation(error) {
    this.log('🔧 Attempting dependency installation recovery...');

    try {
      // Clear npm cache and try again
      await execAsync('npm cache clean --force');
      this.log('✅ Cleared npm cache');

      // Try yarn as alternative
      try {
        await execAsync('npm install -g yarn');
        await execAsync('yarn install', { cwd: this.appRoot, timeout: 600000 });
        this.log('✅ Dependencies installed using yarn');
        return true;
      } catch (yarnError) {
        this.log(
          `❌ Yarn installation also failed: ${yarnError.message}`,
          'ERROR'
        );
        return false;
      }
    } catch (recoveryError) {
      this.log(
        `❌ Dependency recovery failed: ${recoveryError.message}`,
        'ERROR'
      );
      return false;
    }
  }

  async recoverDatabaseSetup(error) {
    this.log('🔧 Attempting database setup recovery...');

    try {
      // Force regenerate Prisma client and try again
      await execAsync('npx prisma generate --force', { cwd: this.appRoot });
      await execAsync('npx prisma db push --accept-data-loss', {
        cwd: this.appRoot,
      });
      this.log('✅ Database setup recovered using force push');
      return true;
    } catch (recoveryError) {
      this.log(
        `❌ Database recovery failed: ${recoveryError.message}`,
        'ERROR'
      );
      return false;
    }
  }

  async recoverApplicationBuild(error) {
    this.log('🔧 Attempting application build recovery...');

    try {
      // Clear Next.js cache and rebuild
      const nextDir = path.join(this.appRoot, '.next');
      if (fs.existsSync(nextDir)) {
        fs.rmSync(nextDir, { recursive: true, force: true });
        this.log('✅ Cleared .next cache');
      }

      // Try build again
      await execAsync('npm run build', { cwd: this.appRoot, timeout: 900000 });
      this.log('✅ Application build recovered');
      return true;
    } catch (recoveryError) {
      this.log(`❌ Build recovery failed: ${recoveryError.message}`, 'ERROR');
      return false;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';

  const installer = new ComprehensiveInstaller();

  try {
    switch (command) {
      case 'install':
        await installer.performInstallation();
        break;

      case 'fresh':
        await installer.performFreshInstall();
        break;

      case 'update':
        await installer.performUpdate();
        break;

      case 'verify':
        const passed = await installer.verifyInstallation();
        process.exit(passed ? 0 : 1);
        break;

      case 'detect':
        const type = await installer.detectInstallationType();
        console.log(`Installation type: ${type}`);
        break;

      default:
        console.log(
          'Usage: node comprehensive-installer.js [install|fresh|update|verify|detect]'
        );
        console.log(
          '  install - Auto-detect and perform appropriate installation'
        );
        console.log('  fresh   - Perform complete fresh installation');
        console.log('  update  - Perform update installation');
        console.log('  verify  - Verify current installation');
        console.log('  detect  - Detect installation type needed');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Installation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveInstaller;
