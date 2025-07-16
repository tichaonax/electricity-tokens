const { promisify } = require('util');
const { exec } = require('child_process');
const Service = require('node-windows').Service;
const config = require('./config');
const path = require('path');
const fs = require('fs');
const buildServiceExpectedName = require('./buildexpectedservicename');
const HybridServiceManager = require('./hybrid-service-manager');

const execAsync = promisify(exec);

class ForceInstallManager {
  constructor() {
    this.serviceName = config.name;
    this.daemonPath = path.join(__dirname, 'daemon');
    this.hybridManager = new HybridServiceManager();
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
        `${config.commands.SC_COMMAND} query "${buildServiceExpectedName(this.serviceName)}"`
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
      this.log('Attempting comprehensive service stop...');

      const status = await this.getServiceStatus();
      if (status === 'NOT_INSTALLED') {
        this.log('Service is not installed');
        // Still check for orphaned processes
        await this.ensureNoRelatedProcesses();
        return true;
      }

      if (status === 'STOPPED') {
        this.log('Service is already stopped');
        // Check for orphaned processes even if service is stopped
        await this.ensureNoRelatedProcesses();
        // Give Windows time to fully clean up
        this.log('Waiting for Windows to complete service cleanup...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return true;
      }

      // Use hybrid service manager for comprehensive stop
      try {
        this.log('Using hybrid service manager for comprehensive stop...');
        await this.hybridManager.stopService();
        this.log('Hybrid service stop completed');

        // Additional wait for file handle release
        this.log('Waiting for complete file handle release...');
        await new Promise((resolve) => setTimeout(resolve, 8000));

        return true;
      } catch (err) {
        this.log(`Hybrid stop failed: ${err.message}`, 'WARN');

        // Fallback to direct process kill
        this.log('Falling back to direct process cleanup...');
        await this.ensureNoRelatedProcesses();
        return true;
      }
    } catch (err) {
      this.log(`Error during force stop: ${err.message}`, 'ERROR');
      return false;
    }
  }

  async ensureNoRelatedProcesses() {
    try {
      this.log('Ensuring no related processes are running...');

      // Check for processes on port 3000
      const portPID = await this.hybridManager.findProcessByPort(3000);
      if (portPID) {
        this.log(`Found process on port 3000: PID ${portPID}`);
        await this.hybridManager.killPID(portPID);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Check for any Node.js processes that might be related
      const serviceProcesses = await this.hybridManager.findServiceProcesses();
      if (serviceProcesses.length > 0) {
        this.log(
          `Found ${serviceProcesses.length} related processes, terminating...`
        );
        for (const proc of serviceProcesses) {
          const pid = parseInt(proc.PID, 10);
          if (pid) {
            await this.hybridManager.killPID(pid);
          }
        }
        // Wait for processes to fully terminate
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      this.log('Process cleanup completed');
    } catch (err) {
      this.log(`Error during process cleanup: ${err.message}`, 'WARN');
    }
  }

  async forceCleanupDaemonFiles() {
    try {
      this.log('Cleaning up daemon files with enhanced retry logic...');

      if (fs.existsSync(this.daemonPath)) {
        const files = fs.readdirSync(this.daemonPath);

        for (const file of files) {
          const filePath = path.join(this.daemonPath, file);
          let deleted = false;
          let attempts = 0;
          const maxAttempts = 5;

          while (!deleted && attempts < maxAttempts) {
            try {
              fs.unlinkSync(filePath);
              this.log(`Deleted: ${file}`);
              deleted = true;
            } catch (err) {
              attempts++;

              if (err.code === 'EBUSY' || err.code === 'EACCES') {
                this.log(
                  `File locked (attempt ${attempts}/${maxAttempts}): ${file}`,
                  'WARN'
                );

                if (attempts < maxAttempts) {
                  // Exponential backoff: 1s, 2s, 4s, 8s
                  const delay = Math.pow(2, attempts - 1) * 1000;
                  this.log(`Waiting ${delay}ms before retry...`);
                  await new Promise((resolve) => setTimeout(resolve, delay));
                } else {
                  this.log(
                    `File remains locked after ${maxAttempts} attempts: ${file}`,
                    'ERROR'
                  );

                  // Try to check what process is holding the file
                  try {
                    const { stdout } = await execAsync(
                      `powershell "Get-Process | Where-Object {$_.Path -like '*${file}*'} | Select-Object Name, Id, Path"`
                    );
                    if (stdout.trim()) {
                      this.log(`Processes using ${file}:\n${stdout}`, 'INFO');
                    }
                  } catch (psErr) {
                    // Ignore PowerShell errors
                  }

                  // Try to rename file for deletion on reboot
                  try {
                    const deleteFile = `${filePath}.delete.${Date.now()}`;
                    await execAsync(`move "${filePath}" "${deleteFile}"`);
                    this.log(
                      `Renamed for deletion: ${file} -> ${path.basename(deleteFile)}`
                    );
                  } catch (moveErr) {
                    this.log(
                      `Could not rename for deletion: ${file} - ${moveErr.message}`,
                      'WARN'
                    );
                  }
                }
              } else {
                this.log(`Could not delete ${file}: ${err.message}`, 'WARN');
                break; // Exit retry loop for non-lock errors
              }
            }
          }
        }

        // Try to remove the daemon directory with retries
        let dirRemoved = false;
        let dirAttempts = 0;
        const maxDirAttempts = 3;

        while (!dirRemoved && dirAttempts < maxDirAttempts) {
          try {
            // Check if directory is empty or has only .delete files
            const remainingFiles = fs.readdirSync(this.daemonPath);
            const nonDeleteFiles = remainingFiles.filter(
              (f) => !f.includes('.delete')
            );

            if (nonDeleteFiles.length === 0) {
              fs.rmdirSync(this.daemonPath);
              this.log('Removed daemon directory');
              dirRemoved = true;
            } else {
              this.log(
                `Daemon directory still contains files: ${nonDeleteFiles.join(', ')}`,
                'WARN'
              );
              break;
            }
          } catch (err) {
            dirAttempts++;
            this.log(
              `Could not remove daemon directory (attempt ${dirAttempts}/${maxDirAttempts}): ${err.message}`,
              'WARN'
            );

            if (dirAttempts < maxDirAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }
      } else {
        this.log('Daemon directory does not exist');
      }

      return true;
    } catch (err) {
      this.log(`Error during cleanup: ${err.message}`, 'ERROR');
      return false;
    }
  }

  async uninstallExistingService() {
    return new Promise(async (resolve, reject) => {
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

      svc.on('uninstall', async () => {
        this.log('Service uninstalled successfully');
        // Give Windows time to update service registry
        this.log('Waiting for service registry cleanup...');
        await new Promise((resolve) => setTimeout(resolve, 8000));
        resolve(true);
      });

      svc.on('error', async (err) => {
        this.log(`Uninstall error: ${err.message}`, 'ERROR');

        // If uninstall fails due to locked files, we'll proceed anyway
        if (
          err.message.includes('EBUSY') ||
          err.message.includes('resource busy')
        ) {
          this.log('Proceeding despite uninstall error (files locked)', 'WARN');
          // Still wait for potential cleanup
          await new Promise((resolve) => setTimeout(resolve, 5000));
          resolve(true);
        } else {
          reject(err);
        }
      });

      try {
        svc.uninstall();
      } catch (err) {
        this.log(`Exception during uninstall: ${err.message}`, 'ERROR');
        // Still wait for potential cleanup
        await new Promise((resolve) => setTimeout(resolve, 5000));
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

    // Step 1: Comprehensive service stop (including process cleanup)
    await manager.log('=== Step 1: Comprehensive Service Stop ===');
    await manager.forceStopService();

    // Step 2: Clean up daemon files
    await manager.log('=== Step 2: Clean Up Files ===');
    await manager.forceCleanupDaemonFiles();

    // Step 3: Wait for file system cleanup
    await manager.log('Waiting for file system cleanup...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Step 4: Uninstall existing service
    await manager.log('=== Step 3: Uninstall Existing Service ===');
    await manager.uninstallExistingService();

    // Step 5: Wait before installing (allow service registry to stabilize)
    await manager.log('Waiting for service registry to stabilize...');
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Step 6: Verify service is fully removed from registry
    await manager.log('Verifying service removal from registry...');
    let registryCleared = false;
    let attempts = 0;
    while (!registryCleared && attempts < 15) {
      const status = await manager.getServiceStatus();
      if (status === 'NOT_INSTALLED') {
        registryCleared = true;
        await manager.log('Service successfully removed from registry');
      } else {
        await manager.log(`Service still in registry (${status}), waiting...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;
      }
    }

    if (!registryCleared) {
      await manager.log(
        'Service registry cleanup may be incomplete, proceeding anyway',
        'WARN'
      );
    }

    // Step 7: Final wait before installation
    await manager.log('Final wait for complete system cleanup...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Step 8: Install hybrid service
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
    console.log('   2. Find "ElectricityTracker" service');
    console.log('   3. Stop the service manually');
    console.log('   4. Delete the service: sc delete ElectricityTracker');
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
