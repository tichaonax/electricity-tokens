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

    // Check if service exists using node-windows Service object only
    const tempService = new Service({
      name: config.name,
      script: config.script,
    });

    if (tempService.exists) {
      console.log(
        '⚠️  Service already exists. Uninstalling existing service first...'
      );
      await this.uninstallExistingService();
    } else {
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

  async checkServiceExists() {
    // Use node-windows Service object to check existence
    const tempService = new Service({
      name: config.name,
      script: config.script,
    });
    return tempService.exists;
  }

  async installService() {
    console.log('📦 Installing service...');

    return new Promise((resolve, reject) => {
      let installTimeout;
      let installCompleted = false;

      // Create service instance with node-windows restart configuration
      this.service = new Service({
        name: config.name,
        description: config.description,
        script: config.script,
        nodeOptions: config.nodeOptions,
        env: config.env,
        workingDirectory: config.appRoot,
        allowServiceLogon: true,
        // node-windows restart configuration
        wait: 2, // Wait 2 seconds before first restart
        grow: 0.25, // Increase wait time by 25% each restart
        maxRetries: 5, // Maximum number of restart attempts
        maxRestarts: 3, // Maximum restarts within 60 seconds
        abortOnError: false, // Continue trying to restart on errors
      });

      // Set up timeout (30 seconds)
      installTimeout = setTimeout(() => {
        if (!installCompleted) {
          console.log(
            '⚠️  Installation timeout. Checking if service was created...'
          );
          this.checkServiceExists()
            .then((exists) => {
              if (exists) {
                console.log(
                  '✅ Service appears to be installed (detected via timeout check)'
                );
                installCompleted = true;
                resolve();
              } else {
                reject(
                  new Error(
                    'Service installation timed out and service was not created'
                  )
                );
              }
            })
            .catch((err) => {
              reject(
                new Error(
                  `Installation timeout and verification failed: ${err.message}`
                )
              );
            });
        }
      }, 30000);

      // Set up event handlers
      this.service.on('install', () => {
        if (!installCompleted) {
          console.log('✅ Service installed successfully!');
          console.log(`   Service Name: ${config.name}`);
          console.log(`   Description: ${config.description}`);
          console.log(`   Script: ${config.script}`);
          console.log(`   Working Directory: ${config.appRoot}`);
          installCompleted = true;
          clearTimeout(installTimeout);
          resolve();
        }
      });

      this.service.on('error', (err) => {
        if (!installCompleted) {
          console.error('❌ Service installation failed:', err);
          installCompleted = true;
          clearTimeout(installTimeout);
          reject(err);
        }
      });

      this.service.on('invalidinstallation', (err) => {
        if (!installCompleted) {
          console.error('❌ Invalid installation:', err);
          installCompleted = true;
          clearTimeout(installTimeout);
          reject(err);
        }
      });

      this.service.on('alreadyinstalled', () => {
        if (!installCompleted) {
          console.log('✅ Service already installed.');
          installCompleted = true;
          clearTimeout(installTimeout);
          resolve();
        }
      });

      // Install the service
      try {
        console.log('🔄 Starting service installation...');
        this.service.install();
      } catch (err) {
        if (!installCompleted) {
          console.error('❌ Failed to start installation:', err);
          installCompleted = true;
          clearTimeout(installTimeout);
          reject(err);
        }
      }
    });
  }

  async configureServiceRecovery() {
    console.log('🔧 Service recovery configured via node-windows...');
    // node-windows handles recovery automatically through its wait/grow/maxRetries configuration
    // No need for manual sc.exe configuration
    console.log('✅ Service recovery options configured via node-windows.');
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

    // Use node-windows Service object to check installation
    const tempService = new Service({
      name: config.name,
      script: config.script,
    });

    if (tempService.exists) {
      console.log('✅ Service is installed and managed by node-windows.');

      // Check if daemon directory exists (indicates successful installation)
      const fs = require('fs');
      const daemonPath = require('path').join(
        require('path').dirname(config.script),
        'daemon'
      );

      if (fs.existsSync(daemonPath)) {
        console.log('✅ Service daemon files are present.');
      } else {
        console.log(
          'ℹ️  Service is registered but daemon files may still be creating.'
        );
      }

      return true;
    } else {
      console.log('⚠️  Service is not installed.');
      console.log('💡 Try: npm run service:install');
      return false;
    }
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
