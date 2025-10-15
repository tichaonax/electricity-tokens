const HybridServiceManager = require('./hybrid-service-manager');
const HealthMonitorScheduler = require('./health-monitor-scheduler');
const path = require('path');

class CompleteServiceSetup {
  constructor() {
    this.serviceManager = new HybridServiceManager();
    this.healthScheduler = new HealthMonitorScheduler();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SETUP] [${level}] ${message}`);
  }

  async checkAdminPrivileges() {
    const isAdmin = await this.serviceManager.isAdmin();
    if (!isAdmin) {
      throw new Error(
        'Administrator privileges are required for service installation'
      );
    }
    this.log('✅ Administrator privileges confirmed');
  }

  async installMainService() {
    this.log('📦 Installing main Electricity Tracker service...');

    try {
      // Use the existing force-install-hybrid script logic
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        const installScript = path.join(__dirname, 'force-install-hybrid.js');
        const installProcess = spawn('node', [installScript], {
          cwd: path.resolve(__dirname, '../..'),
          stdio: 'inherit',
        });

        installProcess.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Main service installed successfully');
            resolve(true);
          } else {
            reject(
              new Error(`Main service installation failed with code ${code}`)
            );
          }
        });

        installProcess.on('error', (error) => {
          reject(
            new Error(`Main service installation error: ${error.message}`)
          );
        });
      });
    } catch (error) {
      this.log(
        `❌ Main service installation failed: ${error.message}`,
        'ERROR'
      );
      throw error;
    }
  }

  async installHealthMonitor() {
    this.log('🏥 Installing health monitoring system...');

    try {
      await this.healthScheduler.install();
      this.log('✅ Health monitoring system installed successfully');
    } catch (error) {
      this.log(
        `❌ Health monitor installation failed: ${error.message}`,
        'ERROR'
      );
      throw error;
    }
  }

  async startServices() {
    this.log('🚀 Starting services...');

    try {
      // Start main service
      await this.serviceManager.startService();
      this.log('✅ Main service started');

      // Wait a moment for main service to initialize
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Health monitor should already be started by the scheduled task
      this.log('✅ Services startup completed');
    } catch (error) {
      this.log(`❌ Service startup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async verifyInstallation() {
    this.log('🔍 Verifying installation...');

    try {
      // Check main service status
      const serviceStatus = await this.serviceManager.getDetailedStatus();
      this.log(`Main service status: ${serviceStatus.serviceStatus}`);
      this.log(`Port 3000 PID: ${serviceStatus.portPID || 'Not found'}`);

      // Check health monitor task
      const healthExists = await this.healthScheduler.taskExists();
      this.log(
        `Health monitor task: ${healthExists ? '✅ Installed' : '❌ Not found'}`
      );

      // Perform health check
      const HealthMonitor = require('./health-monitor');
      const monitor = new HealthMonitor();
      const healthResult = await monitor.checkServiceHealth();
      this.log(
        `Health check: ${healthResult.healthy ? '✅ Healthy' : '❌ Unhealthy'} - ${healthResult.reason}`
      );

      const allGood =
        serviceStatus.isRunning &&
        serviceStatus.portPID &&
        healthExists &&
        healthResult.healthy;

      if (allGood) {
        this.log(
          '🎉 Installation verification PASSED - All systems operational!'
        );
        return true;
      } else {
        this.log('⚠️ Installation verification found issues', 'WARN');
        return false;
      }
    } catch (error) {
      this.log(
        `❌ Installation verification failed: ${error.message}`,
        'ERROR'
      );
      return false;
    }
  }

  async fullInstall() {
    try {
      this.log(
        '🚀 Starting complete Electricity Tracker service installation...'
      );
      this.log(
        'This will install the main service AND health monitoring system'
      );

      // Step 1: Check prerequisites
      await this.checkAdminPrivileges();

      // Step 2: Install main service
      await this.installMainService();

      // Step 3: Install health monitoring
      await this.installHealthMonitor();

      // Step 4: Start services
      await this.startServices();

      // Step 5: Verify everything is working
      const verified = await this.verifyInstallation();

      if (verified) {
        this.log('🎉 COMPLETE INSTALLATION SUCCESSFUL!');
        this.log('');
        this.log('📋 What was installed:');
        this.log(
          '   ✅ Electricity Tracker Windows Service (runs without terminal window)'
        );
        this.log('   ✅ Health Monitoring System (auto-restart on failures)');
        this.log('   ✅ Scheduled Task for continuous monitoring');
        this.log('');
        this.log('🔧 Available commands:');
        this.log(
          '   npm run service:start/stop/diagnose - Main service control'
        );
        this.log(
          '   npm run sync-service:restart - Smart restart with proper wait timing'
        );
        this.log('   npm run health:check/status - Health monitoring');
        this.log('   npm run health:task-status - Health monitor task status');
        this.log('');
        this.log('📊 Your application is now running in the background!');
        this.log('   No more terminal windows will appear');
        this.log('   The service will auto-restart if it becomes unhealthy');
        this.log('   Access your app at: http://localhost:3000');
      } else {
        this.log(
          '⚠️ Installation completed with some issues. Check the logs above.',
          'WARN'
        );
      }
    } catch (error) {
      this.log(`❌ Complete installation failed: ${error.message}`, 'ERROR');
      this.log('');
      this.log('🔧 Troubleshooting:');
      this.log('   1. Make sure you are running as Administrator');
      this.log('   2. Check if port 3000 is available');
      this.log('   3. Run: npm run service:diagnose');
      this.log('   4. Check logs in the logs/ directory');
      throw error;
    }
  }

  async fullUninstall() {
    try {
      this.log('🗑️ Starting complete service uninstallation...');

      await this.checkAdminPrivileges();

      // Stop and uninstall health monitor
      try {
        await this.healthScheduler.uninstall();
        this.log('✅ Health monitor uninstalled');
      } catch (error) {
        this.log(`⚠️ Health monitor uninstall: ${error.message}`, 'WARN');
      }

      // Stop and uninstall main service
      try {
        await this.serviceManager.stopService();
        this.log('✅ Main service stopped');
      } catch (error) {
        this.log(`⚠️ Main service stop: ${error.message}`, 'WARN');
      }

      // Use existing uninstall script
      const { spawn } = require('child_process');

      return new Promise((resolve, reject) => {
        const uninstallScript = path.join(__dirname, 'uninstall-service.js');
        const uninstallProcess = spawn('node', [uninstallScript], {
          cwd: path.resolve(__dirname, '../..'),
          stdio: 'inherit',
        });

        uninstallProcess.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Main service uninstalled successfully');
            this.log('🎉 Complete uninstallation successful!');
            resolve(true);
          } else {
            this.log(
              `⚠️ Main service uninstall completed with code ${code}`,
              'WARN'
            );
            resolve(true); // Still consider it successful
          }
        });

        uninstallProcess.on('error', (error) => {
          this.log(
            `❌ Main service uninstall error: ${error.message}`,
            'ERROR'
          );
          reject(error);
        });
      });
    } catch (error) {
      this.log(`❌ Complete uninstallation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';

  const setup = new CompleteServiceSetup();

  try {
    switch (command) {
      case 'install':
        await setup.fullInstall();
        break;

      case 'uninstall':
        await setup.fullUninstall();
        break;

      case 'verify':
        await setup.checkAdminPrivileges();
        await setup.verifyInstallation();
        break;

      default:
        console.log(
          'Usage: node complete-service-setup.js [install|uninstall|verify]'
        );
        console.log(
          '  install   - Install both main service and health monitoring'
        );
        console.log('  uninstall - Remove all service components');
        console.log('  verify    - Check if installation is working correctly');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CompleteServiceSetup;
