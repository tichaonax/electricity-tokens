const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const config = require('./config');

class ServiceInstaller {
  constructor() {
    this.service = null;
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check if running on Windows
    if (process.platform !== 'win32') {
      throw new Error(
        'This service installer only works on Windows platforms.'
      );
    }

    // Check if running as Administrator
    try {
      const { execSync } = require('child_process');
      execSync('net session', { stdio: 'pipe' });
    } catch (err) {
      throw new Error(
        'Administrator privileges required. Please run this script as Administrator.'
      );
    }

    // Check if application files exist
    const appRoot = config.appRoot;
    if (!fs.existsSync(appRoot)) {
      throw new Error(`Application directory not found: ${appRoot}`);
    }

    // Check if package.json exists
    const packageJsonPath = path.join(appRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found: ${packageJsonPath}`);
    }

    // Check if service wrapper exists
    if (!fs.existsSync(config.script)) {
      throw new Error(`Service wrapper not found: ${config.script}`);
    }

    console.log('✅ Environment validation passed.');
  }

  async checkExistingService() {
    console.log('🔍 Checking for existing service...');

    try {
      const { execSync } = require('child_process');
      const result = execSync(`sc query "${config.name}"`, {
        encoding: 'utf8',
      });

      if (result.includes('RUNNING') || result.includes('STOPPED')) {
        console.log(
          '⚠️  Service already exists. Uninstalling existing service first...'
        );
        await this.uninstallExistingService();
      }
    } catch (err) {
      // Service doesn't exist, which is what we want
      console.log('✅ No existing service found.');
    }
  }

  async uninstallExistingService() {
    return new Promise((resolve, reject) => {
      const tempService = new Service({
        name: config.name,
        script: config.script,
      });

      tempService.on('uninstall', () => {
        console.log('✅ Existing service uninstalled.');
        resolve();
      });

      tempService.on('error', (err) => {
        console.error('❌ Error uninstalling existing service:', err);
        reject(err);
      });

      tempService.uninstall();
    });
  }

  async createLogsDirectory() {
    const logsDir = path.join(config.appRoot, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory.');
    }
  }

  async installService() {
    console.log('📦 Installing service...');

    return new Promise((resolve, reject) => {
      // Create service instance
      this.service = new Service({
        name: config.name,
        description: config.description,
        script: config.script,
        nodeOptions: config.nodeOptions,
        env: config.env,
        workingDirectory: config.appRoot,
        allowServiceLogon: true,
      });

      // Set up event handlers
      this.service.on('install', () => {
        console.log('✅ Service installed successfully!');
        console.log(`   Service Name: ${config.name}`);
        console.log(`   Description: ${config.description}`);
        console.log(`   Script: ${config.script}`);
        console.log(`   Working Directory: ${config.appRoot}`);
        resolve();
      });

      this.service.on('error', (err) => {
        console.error('❌ Service installation failed:', err);
        reject(err);
      });

      this.service.on('invalidinstallation', (err) => {
        console.error('❌ Invalid installation:', err);
        reject(err);
      });

      // Install the service
      this.service.install();
    });
  }

  async configureServiceRecovery() {
    console.log('🔧 Configuring service recovery options...');

    try {
      const { execSync } = require('child_process');

      // Wait a moment for service to be fully registered
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Configure failure actions with more conservative settings
      const failureCommand = `sc failure "${config.name}" reset=3600 actions=restart/60000/restart/120000/restart/300000`;
      execSync(failureCommand, { stdio: 'pipe' });

      console.log('✅ Service recovery options configured.');
    } catch (err) {
      console.warn(
        '⚠️  Could not configure service recovery options:',
        err.message
      );
      console.warn(
        'Service will still function but may need manual restart on failure.'
      );
    }
  }

  async startService() {
    console.log('🚀 Starting service...');

    return new Promise((resolve, reject) => {
      this.service.on('start', () => {
        console.log('✅ Service started successfully!');
        resolve();
      });

      this.service.on('error', (err) => {
        console.error('❌ Failed to start service:', err);
        reject(err);
      });

      this.service.start();
    });
  }

  async verifyServiceStatus() {
    console.log('🔍 Verifying service status...');

    try {
      const { execSync } = require('child_process');
      const result = execSync(`sc query \"${config.name}\"`, {
        encoding: 'utf8',
      });

      if (result.includes('RUNNING')) {
        console.log('✅ Service is running.');
        return true;
      } else if (result.includes('STOPPED')) {
        console.log('⚠️  Service is installed but not running.');
        console.log('💡 Try: npm run service:start');
        return false;
      }
    } catch (err) {
      console.error('❌ Failed to verify service status:', err.message);
      return false;
    }

    return false;
  }

  async showServiceInfo() {
    console.log('\n📋 Service Installation Summary:');
    console.log('=====================================');
    console.log(`Service Name: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log(`Application: ${config.appRoot}`);
    console.log(`Port: ${config.env.PORT || 3000}`);
    console.log(`Logs: ${path.join(config.appRoot, 'logs', 'service.log')}`);
    console.log('\n🛠️  Service Management Commands:');
    console.log(`  Start:     npm run service:start`);
    console.log(`  Stop:      npm run service:stop`);
    console.log(`  Status:    npm run service:status`);
    console.log(`  Uninstall: npm run service:uninstall`);
    console.log('\n🌐 Application Access:');
    console.log(`  URL: ${config.env.NEXTAUTH_URL}`);
    console.log('\n⚠️  Important Notes:');
    console.log('  - Service runs with SYSTEM privileges');
    console.log('  - Check Windows Event Viewer for service logs');
    console.log('  - Ensure database is accessible from service context');
    console.log('  - Environment variables are loaded from current context');
  }
}

async function main() {
  const installer = new ServiceInstaller();

  try {
    console.log('🚀 Starting Electricity Tokens Tracker Service Installation');
    console.log(
      '===========================================================\n'
    );

    await installer.validateEnvironment();
    await installer.checkExistingService();
    await installer.createLogsDirectory();
    await installer.installService();
    await installer.configureServiceRecovery();

    // Wait a moment before starting
    console.log('⏳ Waiting for service registration to complete...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await installer.startService();
    await installer.verifyServiceStatus();
    await installer.showServiceInfo();

    console.log('\n🎉 Installation completed successfully!');
    console.log(
      'The Electricity Tokens Tracker is now running as a Windows service.'
    );
  } catch (err) {
    console.error('\n❌ Installation failed:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  - Ensure you are running as Administrator');
    console.error('  - Check that all application files are present');
    console.error('  - Verify environment variables are properly configured');
    console.error('  - Check Windows Event Viewer for detailed error logs');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ServiceInstaller;
