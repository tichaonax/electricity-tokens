const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./config');

class SimpleServiceInstaller {
  constructor() {
    this.serviceName = config.name;
    this.serviceDescription = config.description;
    this.scriptPath = config.script;
    this.appRoot = config.appRoot;
    this.nodeExe = process.execPath;
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check platform
    if (process.platform !== 'win32') {
      throw new Error('This script only works on Windows');
    }

    // Check admin privileges
    try {
      execSync('net session', { stdio: 'pipe' });
    } catch (err) {
      throw new Error(
        'Administrator privileges required. Please run as Administrator.'
      );
    }

    // Check if script exists
    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`Service wrapper script not found: ${this.scriptPath}`);
    }

    console.log('✅ Environment validation passed.');
  }

  async removeExistingService() {
    console.log('🔍 Checking for existing service...');

    try {
      const result = execSync(`sc.exe . query "${this.serviceName}"`, {
        encoding: 'utf8',
      });

      if (result.includes('SERVICE_NAME')) {
        console.log('⚠️  Existing service found. Removing...');

        // Stop service if running
        try {
          execSync(`sc.exe . stop "${this.serviceName}"`, { stdio: 'pipe' });
          console.log('🛑 Service stopped.');
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (err) {
          console.log('ℹ️  Service was not running.');
        }

        // Delete service
        execSync(`sc.exe . delete "${this.serviceName}"`, { stdio: 'pipe' });
        console.log('🗑️  Existing service removed.');

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log('✅ No existing service found.');
      }
    } catch (err) {
      console.log('✅ No existing service found.');
    }
  }

  async createService() {
    console.log('📦 Creating Windows service...');

    try {
      // Create the service using sc create with proper escaping
      console.log(`🔧 Creating service...`);
      console.log(`   Node.js: ${this.nodeExe}`);
      console.log(`   Script: ${this.scriptPath}`);

      // Use sc.exe to avoid PowerShell alias conflicts
      // Format: sc.exe <server> create "ServiceName" binPath= "\"node.exe\" \"script.js\"" DisplayName= "Display Name" start= auto
      const createCommand = `sc.exe . create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto`;

      console.log(`🔧 Running: ${createCommand}`);

      execSync(createCommand, { stdio: 'inherit' });
      console.log('✅ Service created successfully!');
    } catch (err) {
      console.error('❌ Service creation failed. Trying alternative method...');

      // Try alternative method with different quoting
      try {
        const altCommand = `sc.exe . create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto`;
        console.log(`🔧 Trying alternative: ${altCommand}`);
        execSync(altCommand, { stdio: 'inherit' });
        console.log('✅ Service created successfully with alternative method!');
      } catch (altErr) {
        throw new Error(`Failed to create service with both methods: 
Primary error: ${err.message}
Alternative error: ${altErr.message}

Manual command to try (PowerShell):
sc.exe . create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto

Manual command to try (Command Prompt):
sc.exe . create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto`);
      }
    }
  }

  async configureServiceRecovery() {
    console.log('🔧 Configuring service recovery options...');

    try {
      // Set failure actions
      const failureCommand = `sc.exe . failure "${this.serviceName}" reset=3600 actions=restart/60000/restart/120000/restart/300000`;
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

    try {
      execSync(`sc.exe . start "${this.serviceName}"`, { stdio: 'pipe' });
      console.log('✅ Service started successfully!');

      // Wait a moment and verify
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const result = execSync(`sc.exe . query "${this.serviceName}"`, {
        encoding: 'utf8',
      });
      if (result.includes('RUNNING')) {
        console.log('✅ Service is running.');
      } else {
        console.log('⚠️  Service may not be running properly. Check logs.');
      }
    } catch (err) {
      console.error('❌ Failed to start service:', err.message);
      console.log('💡 You can start it manually with: npm run service:start');
    }
  }

  async createLogsDirectory() {
    const logsDir = path.join(this.appRoot, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory.');
    }
  }

  async showServiceInfo() {
    console.log('\n📋 Service Installation Summary:');
    console.log('=====================================');
    console.log(`Service Name: ${this.serviceName}`);
    console.log(`Description: ${this.serviceDescription}`);
    console.log(`Application: ${this.appRoot}`);
    console.log(`Script: ${this.scriptPath}`);
    console.log(`Port: ${config.env.PORT || 3000}`);
    console.log(`Logs: ${path.join(this.appRoot, 'logs', 'service.log')}`);
    console.log('\n🛠️  Service Management Commands:');
    console.log(`  Start:     npm run service:start`);
    console.log(`  Stop:      npm run service:stop`);
    console.log(`  Status:    npm run service:status`);
    console.log(`  Uninstall: npm run service:uninstall`);
    console.log('\n🌐 Application Access:');
    console.log(`  URL: ${config.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
  }
}

async function main() {
  const installer = new SimpleServiceInstaller();

  try {
    console.log(
      '🚀 Starting Electricity Tokens Tracker Service Installation (Simple Method)'
    );
    console.log(
      '===============================================================================\n'
    );

    await installer.validateEnvironment();
    await installer.removeExistingService();
    await installer.createLogsDirectory();
    await installer.createService();
    await installer.configureServiceRecovery();
    await installer.startService();
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
    console.error('\n💡 Alternative:');
    console.error('  - Try: npm run service:install-simple');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleServiceInstaller;
