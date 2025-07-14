const Service = require('node-windows').Service;
const config = require('./config');
const buildServiceExpectedName = require('./buildexpectedservicename');

class ServiceUninstaller {
  constructor() {
    this.service = null;
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check if running on Windows
    if (process.platform !== 'win32') {
      throw new Error(
        'This service uninstaller only works on Windows platforms.'
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

    console.log('✅ Environment validation passed.');
  }

  async checkServiceExists() {
    console.log('🔍 Checking if service exists...');

    try {
      const { execSync } = require('child_process');
      const result = execSync(
        `${config.commands.SC_COMMAND} query "${buildServiceExpectedName(config.name)}"`,
        {
          encoding: 'utf8',
        }
      );

      if (
        result.includes('does not exist') ||
        result.includes('OpenService FAILED')
      ) {
        console.log('ℹ️  Service is not installed.');
        return false;
      }

      console.log('✅ Service found.');
      return true;
    } catch (err) {
      console.log('ℹ️  Service is not installed.');
      return false;
    }
  }

  async stopService() {
    console.log('🛑 Stopping service...');

    try {
      const { execSync } = require('child_process');
      execSync(
        `${config.commands.SC_COMMAND} stop "${buildServiceExpectedName(config.name)}"`,
        {
          stdio: 'pipe',
        }
      );

      // Wait for service to stop
      console.log('⏳ Waiting for service to stop...');
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log('✅ Service stopped.');
    } catch (err) {
      console.log('ℹ️  Service was not running or already stopped.');
    }
  }

  async uninstallService() {
    console.log('🗑️  Uninstalling service...');

    return new Promise((resolve, reject) => {
      // Create service instance
      this.service = new Service({
        name: config.name,
        script: config.script,
      });

      // Set up event handlers
      this.service.on('uninstall', () => {
        console.log('✅ Service uninstalled successfully!');
        resolve();
      });

      this.service.on('error', (err) => {
        console.error('❌ Service uninstallation failed:', err);
        reject(err);
      });

      this.service.on('doesnotexist', () => {
        console.log('ℹ️  Service was not installed.');
        resolve();
      });

      // Uninstall the service
      this.service.uninstall();
    });
  }

  async cleanupFiles() {
    console.log('🧹 Cleaning up service files...');

    try {
      // Note: We don't delete the application files, just service-specific files
      // The logs directory and application remain intact

      console.log('✅ Cleanup completed.');
    } catch (err) {
      console.warn('⚠️  Could not complete cleanup:', err.message);
    }
  }

  async showUninstallSummary() {
    console.log('\n📋 Service Uninstallation Summary:');
    console.log('====================================');
    console.log(`Service Name: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log('\n✅ Service has been completely removed from the system.');
    console.log('\nℹ️  Note:');
    console.log('  - Application files remain intact');
    console.log('  - Log files are preserved');
    console.log(
      '  - You can reinstall the service using: npm run service:install'
    );
  }
}

async function main() {
  const uninstaller = new ServiceUninstaller();

  try {
    console.log(
      '🚀 Starting Electricity Tokens Tracker Service Uninstallation'
    );
    console.log(
      '==============================================================\n'
    );

    await uninstaller.validateEnvironment();

    const serviceExists = await uninstaller.checkServiceExists();
    if (!serviceExists) {
      console.log('\n✅ No service to uninstall. Operation completed.');
      return;
    }

    await uninstaller.stopService();
    await uninstaller.uninstallService();
    await uninstaller.cleanupFiles();
    await uninstaller.showUninstallSummary();

    console.log('\n🎉 Uninstallation completed successfully!');
  } catch (err) {
    console.error('\n❌ Uninstallation failed:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  - Ensure you are running as Administrator');
    console.error('  - Try stopping the service manually first');
    console.error('  - Check Windows Services management console');
    console.error('  - Check Windows Event Viewer for detailed error logs');

    console.error('\n💡 Manual uninstallation:');
    console.error(
      `  ${config.commands.SC_COMMAND} stop "${buildServiceExpectedName(config.name)}"`
    );
    console.error(
      `  ${config.commands.SC_COMMAND} delete "${buildServiceExpectedName(config.name)}"`
    );

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ServiceUninstaller;
