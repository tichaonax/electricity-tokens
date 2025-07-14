const { promisify } = require('util');
const { exec } = require('child_process');
const Service = require('node-windows').Service;
const config = require('./config');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class ForceInstallManager {
  constructor() {
    this.serviceName = 'electricitytokenstrackerexe.exe';
    this.daemonPath = path.join(__dirname, 'daemon');
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

  async getServiceStatus() {
    try {
      const { stdout } = await execAsync(
        `${config.commands.SC_COMMAND} query "${this.serviceName}"`
      );

      if (stdout.includes('RUNNING')) return 'RUNNING';
      if (stdout.includes('STOPPED')) return 'STOPPED';
      if (stdout.includes('START_PENDING')) return 'START_PENDING';
      if (stdout.includes('STOP_PENDING')) return 'STOP_PENDING';

      return 'UNKNOWN';
    } catch (err) {
      if (err.message.includes('does not exist')) {
        return 'NOT_INSTALLED';
      }
      return 'ERROR';
    }
  }

  async forceStopService() {
    try {
      this.log('Attempting to stop existing service...');

      const status = await this.getServiceStatus();
      if (status === 'NOT_INSTALLED') {
        this.log('Service is not installed');
        return true;
      }

      if (status === 'STOPPED') {
        this.log('Service is already stopped');
        return true;
      }

      // Try to stop the service
      try {
        await execAsync(
          `${config.commands.SC_COMMAND} stop "${this.serviceName}"`
        );
        this.log('Sent stop command to service');

        // Wait for it to stop
        let attempts = 0;
        while (attempts < 15) {
          // 15 seconds
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const currentStatus = await this.getServiceStatus();

          if (currentStatus === 'STOPPED') {
            this.log('Service stopped successfully');
            return true;
          }

          attempts++;
        }

        this.log(
          'Service did not stop within timeout, will proceed anyway',
          'WARN'
        );
      } catch (err) {
        this.log(`Failed to stop service: ${err.message}`, 'WARN');
      }

      return true;
    } catch (err) {
      this.log(`Error during force stop: ${err.message}`, 'ERROR');
      return false;
    }
  }

  async forceCleanupDaemonFiles() {
    try {
      this.log('Cleaning up daemon files...');

      if (fs.existsSync(this.daemonPath)) {
        const files = fs.readdirSync(this.daemonPath);

        for (const file of files) {
          const filePath = path.join(this.daemonPath, file);

          try {
            // Try to delete the file
            fs.unlinkSync(filePath);
            this.log(`Deleted: ${file}`);
          } catch (err) {
            if (err.code === 'EBUSY') {
              this.log(`File locked (will retry): ${file}`, 'WARN');

              // Try again after a short delay
              await new Promise((resolve) => setTimeout(resolve, 1000));

              try {
                fs.unlinkSync(filePath);
                this.log(`Deleted on retry: ${file}`);
              } catch (retryErr) {
                this.log(`Still locked: ${file} (${retryErr.code})`, 'WARN');

                // Mark file for deletion on reboot if still locked
                try {
                  await execAsync(`move "${filePath}" "${filePath}.delete"`);
                  this.log(`Marked for deletion: ${file}`);
                } catch (moveErr) {
                  this.log(`Could not mark for deletion: ${file}`, 'WARN');
                }
              }
            } else {
              this.log(`Could not delete ${file}: ${err.message}`, 'WARN');
            }
          }
        }

        // Try to remove the daemon directory
        try {
          fs.rmdirSync(this.daemonPath);
          this.log('Removed daemon directory');
        } catch (err) {
          this.log(`Could not remove daemon directory: ${err.message}`, 'WARN');
        }
      }

      return true;
    } catch (err) {
      this.log(`Error during cleanup: ${err.message}`, 'ERROR');
      return false;
    }
  }

  async uninstallExistingService() {
    return new Promise((resolve, reject) => {
      this.log('Uninstalling existing service...');

      const svc = new Service({
        name: config.name,
        script: config.script,
      });

      if (!svc.exists) {
        this.log('Service does not exist');
        resolve(true);
        return;
      }

      svc.on('uninstall', () => {
        this.log('Service uninstalled successfully');
        resolve(true);
      });

      svc.on('error', (err) => {
        this.log(`Uninstall error: ${err.message}`, 'ERROR');

        // If uninstall fails due to locked files, we'll proceed anyway
        if (
          err.message.includes('EBUSY') ||
          err.message.includes('resource busy')
        ) {
          this.log('Proceeding despite uninstall error (files locked)', 'WARN');
          resolve(true);
        } else {
          reject(err);
        }
      });

      try {
        svc.uninstall();
      } catch (err) {
        this.log(`Exception during uninstall: ${err.message}`, 'ERROR');
        resolve(true); // Proceed anyway
      }
    });
  }

  async installHybridService() {
    return new Promise((resolve, reject) => {
      this.log('Installing hybrid service...');

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

        // Logging
        logOnAs: config.logOnAs,

        // Auto-restart configuration
        restart: config.restart,

        // Dependencies
        dependencies: config.dependencies,
      });

      svc.on('install', () => {
        this.log('✅ Hybrid service installed successfully!');
        console.log('');
        console.log('📋 Service Details:');
        console.log(`   Name: ${svc.name}`);
        console.log(`   Description: ${svc.description}`);
        console.log(`   Script: ${svc.script}`);
        console.log('');
        console.log('🚀 Usage:');
        console.log('   Start:     npm run service:start');
        console.log('   Stop:      npm run service:stop');
        console.log('   Diagnose:  npm run service:diagnose');
        console.log('');
        console.log('💡 The hybrid service provides:');
        console.log('   • Direct Next.js process execution (no npm layer)');
        console.log('   • Enhanced process tracking and PID management');
        console.log('   • Force-kill capabilities for orphaned processes');
        console.log('   • Graceful shutdown with fallback to force kill');
        console.log(
          '   • sc.exe integration for reliable start/stop operations'
        );

        resolve(true);
      });

      svc.on('error', (err) => {
        this.log(`Installation error: ${err.message}`, 'ERROR');
        reject(err);
      });

      svc.install();
    });
  }
}

async function forceInstallHybrid() {
  const manager = new ForceInstallManager();

  try {
    console.log(
      '🔧 Force Installing Electricity Tokens Tracker service (Hybrid Mode)...'
    );
    console.log('');

    // Check admin privileges
    const isAdmin = await manager.checkAdminPrivileges();
    if (!isAdmin) {
      console.error('❌ Administrator privileges required.');
      console.log('💡 Please run this command as Administrator.');
      process.exit(1);
    }

    await manager.log('Admin privileges confirmed');

    // Step 1: Force stop the service
    await manager.log('=== Step 1: Force Stop Service ===');
    await manager.forceStopService();

    // Step 2: Wait a moment for file handles to be released
    await manager.log('Waiting for file handles to be released...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 3: Clean up daemon files
    await manager.log('=== Step 2: Clean Up Files ===');
    await manager.forceCleanupDaemonFiles();

    // Step 4: Uninstall existing service
    await manager.log('=== Step 3: Uninstall Existing Service ===');
    await manager.uninstallExistingService();

    // Step 5: Wait before installing
    await manager.log('Waiting before installation...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 6: Install hybrid service
    await manager.log('=== Step 4: Install Hybrid Service ===');
    await manager.installHybridService();

    console.log('');
    console.log('✅ Force installation completed successfully!');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Test the service: npm run service:diagnose');
    console.log('   2. Start the service: npm run service:start');
    console.log('   3. Stop the service: npm run service:stop');
  } catch (err) {
    console.error('❌ Force installation failed:', err.message);
    console.log('');
    console.log('🔧 Manual Recovery Steps:');
    console.log('   1. Open Services.msc as Administrator');
    console.log('   2. Find "ElectricityTokensTracker" service');
    console.log('   3. Stop the service manually');
    console.log('   4. Delete the service: sc delete ElectricityTokensTracker');
    console.log('   5. Restart your computer');
    console.log('   6. Try installation again');

    process.exit(1);
  }
}

if (require.main === module) {
  forceInstallHybrid().catch((err) => {
    console.error('❌ Force installation failed:', err.message);
    process.exit(1);
  });
}

module.exports = forceInstallHybrid;
