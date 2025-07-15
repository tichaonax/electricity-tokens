const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class CompleteServiceReset {
  constructor() {
    const config = require('./config');
    const buildServiceExpectedName = require('./buildexpectedservicename');
    this.serviceName = config.name; // ElectricityTracker
    this.windowsServiceName = buildServiceExpectedName(this.serviceName); // ElectricityTracker.exe
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async checkAdminPrivileges() {
    const wincmd = require('node-windows');
    return new Promise((resolve) => {
      wincmd.isAdminUser((isAdmin) => {
        resolve(isAdmin);
      });
    });
  }

  async findElectricityService() {
    this.log(`🔍 Looking for service: ${this.windowsServiceName}...`);

    try {
      // Check if our specific service exists
      const { stdout } = await execAsync(
        `sc.exe query "${this.windowsServiceName}"`
      );

      // Parse the service info
      const lines = stdout.split('\n');
      let serviceInfo = {
        name: this.windowsServiceName,
        displayName: '',
        state: '',
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DISPLAY_NAME:')) {
          serviceInfo.displayName = trimmed.replace('DISPLAY_NAME:', '').trim();
        } else if (trimmed.startsWith('STATE:')) {
          serviceInfo.state = trimmed.replace('STATE:', '').trim();
        }
      }

      this.log(`✅ Found service: ${serviceInfo.name} (${serviceInfo.state})`);
      return [serviceInfo];
    } catch (err) {
      this.log(
        `ℹ️  Service ${this.windowsServiceName} not found or not running`
      );
      return [];
    }
  }

  async removeElectricityService() {
    this.log('🗑️ Removing electricity service...');

    const services = await this.findElectricityService();

    for (const service of services) {
      try {
        // Stop the service first
        this.log(`Stopping service: ${service.name}`);
        try {
          await execAsync(`sc.exe stop "${service.name}"`);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        } catch (err) {
          this.log(`Service was not running: ${service.name}`);
        }

        // Delete the service
        this.log(`Deleting service: ${service.name}`);
        await execAsync(`sc.exe delete "${service.name}"`);
        this.log(`✅ Deleted: ${service.name}`);
      } catch (err) {
        this.log(`Failed to delete ${service.name}: ${err.message}`, 'WARN');
      }
    }
  }

  async cleanupDaemonDirectory() {
    this.log('🧹 Cleaning up daemon directory...');

    const daemonDir = path.join(__dirname, 'daemon');
    if (fs.existsSync(daemonDir)) {
      try {
        this.log(`Removing daemon directory: ${daemonDir}`);
        fs.rmSync(daemonDir, { recursive: true, force: true });
        this.log('✅ Daemon directory removed');
      } catch (err) {
        this.log(`Failed to remove daemon directory: ${err.message}`, 'ERROR');
      }
    } else {
      this.log('Daemon directory does not exist');
    }
  }

  async installCleanService() {
    this.log('🚀 Installing service...');

    return new Promise((resolve, reject) => {
      const Service = require('node-windows').Service;
      const config = require('./config');

      this.log(`Installing service with name: "${this.serviceName}"`);
      this.log(`This should become: "${this.windowsServiceName}" in Windows`);

      const svc = new Service({
        name: this.serviceName,
        description: config.description,
        script: path.resolve(__dirname, 'service-wrapper-hybrid.js'),
        nodeOptions: config.nodeOptions || [],
        env: config.env || {},

        // Keep it simple - minimal options
        stopparentfirst: true,
        stopchild: true,
      });

      svc.on('install', () => {
        this.log('✅ Service installed successfully!');
        this.log(`Windows service name: ${this.windowsServiceName}`);

        resolve(this.serviceName);
      });

      svc.on('error', (err) => {
        this.log(`Installation error: ${err.message}`, 'ERROR');
        reject(err);
      });

      svc.on('invalidinstallation', (err) => {
        this.log(`Invalid installation: ${err.message}`, 'ERROR');
        reject(err);
      });

      svc.install();
    });
  }

  async completeReset() {
    this.log('🔄 Starting complete service reset...');
    this.log('');
    this.log(
      '⚠️  IMPORTANT: This will ONLY remove electricity tracker services.'
    );
    this.log(
      '⚠️  Windows system services like TokenBroker will NOT be touched.'
    );
    this.log('');

    // Check admin privileges
    const isAdmin = await this.checkAdminPrivileges();
    if (!isAdmin) {
      throw new Error(
        '❌ Administrator privileges required. Please run as Administrator.'
      );
    }
    this.log('✅ Admin privileges confirmed');

    // Step 1: Find and remove existing service
    await this.removeElectricityService();

    // Step 2: Clean up daemon files
    await this.cleanupDaemonDirectory();

    // Step 3: Wait for cleanup
    this.log('⏳ Waiting for cleanup...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 4: Install clean service
    const serviceName = await this.installCleanService();

    this.log('');
    this.log('✅ Complete service reset completed successfully!');
    this.log('');
    this.log('🎯 Service Details:');
    this.log(`   Service name: ${serviceName}`);
    this.log(`   Windows name: ${this.windowsServiceName}`);
    this.log('');
    this.log('🎯 Next Steps:');
    this.log('   1. Test: npm run service:diagnose');
    this.log('   2. Start: npm run service:start');
    this.log('   3. Check logs: logs/service-wrapper-YYYY-MM-DD.log');

    return serviceName;
  }
}

async function main() {
  const resetter = new CompleteServiceReset();

  try {
    await resetter.completeReset();
  } catch (err) {
    console.error('❌ Complete reset failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CompleteServiceReset;
