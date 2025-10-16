const wincmd = require('node-windows');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const buildServiceExpectedName = require('./buildexpectedservicename');

class SimpleServiceInstaller {
  constructor() {
    this.serviceName = buildServiceExpectedName(config.name);
    this.appRoot = path.resolve(__dirname, '../..');
    this.logFile = path.join(this.appRoot, 'logs', 'service-install.log');
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
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }

    console.log(logMessage);
  }

  async isAdmin() {
    return new Promise((resolve) => {
      wincmd.isAdminUser((isAdmin) => {
        resolve(isAdmin);
      });
    });
  }

  async installService() {
    try {
      this.log('🚀 Installing Electricity Tracker self-monitoring service...');

      // Check admin privileges
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Administrator privileges required for service installation');
      }

      // Create the service
      const svc = new wincmd.Service({
        name: this.serviceName,
        description: config.description,
        script: config.script,
        nodeOptions: config.nodeOptions,
        env: config.env,
        
        // Recovery options - service will restart itself on failures
        restart: {
          delay: 60000,     // 1 minute delay
          attempts: 3       // 3 restart attempts per hour
        },

        // Service starts automatically
        startType: 'Automatic',
        
        // Working directory
        workingDirectory: config.appRoot,
        
        // Log on as Local System (most reliable for services)
        logOnAs: {
          domain: '',
          account: '',
          password: ''
        }
      });

      // Install the service
      return new Promise((resolve, reject) => {
        svc.on('install', () => {
          this.log('✅ Service installed successfully');
          this.log(`📋 Service Details:`);
          this.log(`   Name: ${this.serviceName}`);
          this.log(`   Description: ${config.description}`);
          this.log(`   Script: ${config.script}`);
          this.log(`   Start Type: Automatic (starts with Windows)`);
          this.log(`   Recovery: Auto-restart on failures`);
          this.log(`   Self-Monitoring: Built-in health checks and auto-restart`);
          this.log('');
          this.log('🎉 INSTALLATION COMPLETE!');
          this.log('');
          this.log('📋 What was installed:');
          this.log('   ✅ Self-monitoring Windows Service (no terminal windows)');
          this.log('   ✅ Built-in health monitoring (checks port 3000 and app health)');
          this.log('   ✅ Auto-restart on failures (up to 3 attempts per hour)');
          this.log('   ✅ Automatic startup with Windows');
          this.log('');
          this.log('🔧 Available commands:');
          this.log('   npm run service:start    - Start the service');
          this.log('   npm run service:stop     - Stop the service');
          this.log('   npm run service:diagnose - Check service status');
          this.log('');
          this.log('🌐 Your application will be accessible at: http://localhost:3000');
          this.log('📊 Service will monitor itself and restart automatically if needed');
          
          resolve(true);
        });

        svc.on('alreadyinstalled', () => {
          this.log('⚠️ Service is already installed', 'WARN');
          resolve(true);
        });

        svc.on('error', (error) => {
          this.log(`❌ Service installation failed: ${error.message}`, 'ERROR');
          reject(error);
        });

        // Start the installation
        svc.install();
      });

    } catch (error) {
      this.log(`❌ Installation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// Main execution
async function main() {
  const installer = new SimpleServiceInstaller();
  
  try {
    await installer.installService();
    process.exit(0);
  } catch (error) {
    console.error('Installation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleServiceInstaller;