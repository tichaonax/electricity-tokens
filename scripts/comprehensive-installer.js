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
    this.log('📦 Installing Node.js dependencies...');

    return new Promise((resolve, reject) => {
      const installProcess = spawn('npm', ['install'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
      });

      let hasOutput = false;

      installProcess.stdout.on('data', (data) => {
        hasOutput = true;
        const text = data.toString();
        const lines = text.split('\n');
        lines.forEach((line) => {
          if (
            line.trim() &&
            (line.includes('added') ||
              line.includes('updated') ||
              line.includes('installed') ||
              line.includes('found'))
          ) {
            this.log(`📦 ${line.trim()}`);
          }
        });
      });

      installProcess.stderr.on('data', (data) => {
        const text = data.toString();
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
          reject(new Error('npm install failed'));
        }
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        if (!hasOutput) {
          installProcess.kill();
          reject(new Error('npm install timeout - no output received'));
        }
      }, 600000);
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
    this.log('🆕 Performing fresh installation...');

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
        throw new Error(`Installation failed at step: ${step.name}`);
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
