const { promisify } = require('util');
const { exec } = require('child_process');
const Service = require('node-windows').Service;
const config = require('./config');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class ServiceFixer {
  constructor() {
    this.serviceName = 'electricitytokenstracker.exe';
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

  async forceUninstallService() {
    this.log('🔧 Force removing broken service...');

    try {
      // Try to stop the service first
      try {
        await execAsync(`sc.exe stop "${this.serviceName}"`);
        this.log('Service stopped');
      } catch (err) {
        this.log('Service was not running (expected)');
      }

      // Try to delete the service
      try {
        await execAsync(`sc.exe delete "${this.serviceName}"`);
        this.log('✅ Service deleted from Windows registry');
      } catch (err) {
        this.log(`Service deletion error: ${err.message}`, 'WARN');
      }

      // Clean up daemon directory if it exists
      const daemonDir = path.join(__dirname, 'daemon');
      if (fs.existsSync(daemonDir)) {
        this.log('🧹 Cleaning up daemon directory...');
        try {
          fs.rmSync(daemonDir, { recursive: true, force: true });
          this.log('✅ Daemon directory cleaned up');
        } catch (err) {
          this.log(`Daemon cleanup error: ${err.message}`, 'WARN');
        }
      }

      return true;
    } catch (err) {
      this.log(`Force uninstall error: ${err.message}`, 'ERROR');
      return false;
    }
  }

  async installCleanService() {
    return new Promise((resolve, reject) => {
      this.log('🚀 Installing clean hybrid service...');

      const svc = new Service({
        name: config.name,
        description:
          config.description + ' (Hybrid Mode - Direct Next.js execution)',
        script: path.resolve(__dirname, 'service-wrapper-hybrid.js'),
        nodeOptions: config.nodeOptions,
        env: config.env,

        // Enhanced options for better process management
        stopparentfirst: true,
        stopchild: true,
      });

      svc.on('install', () => {
        this.log('✅ Hybrid service installed successfully!');
        this.log('');
        this.log('📋 Service Details:');
        this.log(`   Name: ${config.name}`);
        this.log(`   Description: ${config.description} (Hybrid Mode)`);
        this.log(
          `   Script: ${path.resolve(__dirname, 'service-wrapper-hybrid.js')}`
        );
        this.log('');
        this.log('🚀 Usage:');
        this.log('   Start:     npm run service:start');
        this.log('   Stop:      npm run service:stop');
        this.log('   Diagnose:  npm run service:diagnose');
        resolve(true);
      });

      svc.on('invalidinstallation', (err) => {
        this.log(`Invalid installation: ${err.message}`, 'ERROR');
        reject(err);
      });

      svc.on('error', (err) => {
        this.log(`Installation error: ${err.message}`, 'ERROR');
        reject(err);
      });

      try {
        svc.install();
      } catch (err) {
        this.log(`Exception during install: ${err.message}`, 'ERROR');
        reject(err);
      }
    });
  }

  async fixService() {
    this.log('🔧 Fixing broken Electricity Tokens Tracker service...');
    this.log('');

    // Check admin privileges
    const isAdmin = await this.checkAdminPrivileges();
    if (!isAdmin) {
      throw new Error(
        '❌ Administrator privileges required. Please run as Administrator.'
      );
    }
    this.log('✅ Admin privileges confirmed');

    // Force uninstall broken service
    await this.forceUninstallService();

    // Wait a moment for cleanup
    this.log('⏳ Waiting for cleanup...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Install clean service
    await this.installCleanService();

    this.log('');
    this.log('✅ Service fix completed successfully!');
    this.log('');
    this.log('🎯 Next Steps:');
    this.log('   1. Test the service: npm run service:diagnose');
    this.log('   2. Start the service: npm run service:start');
    this.log('   3. Check logs in: logs/service-wrapper-YYYY-MM-DD.log');
  }
}

async function main() {
  const fixer = new ServiceFixer();

  try {
    await fixer.fixService();
  } catch (err) {
    console.error('❌ Service fix failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ServiceFixer;
