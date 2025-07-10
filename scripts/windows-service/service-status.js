const Service = require('node-windows').Service;
const config = require('./config');

class ServiceStatus {
  constructor() {
    this.serviceName = config.name;
    this.service = new Service({
      name: config.name,
      script: config.script,
    });
  }

  async checkStatus() {
    console.log(`🔍 Checking status of ${this.serviceName}...`);
    console.log('='.repeat(50));

    try {
      // Check Windows Service Control Manager first
      const { execSync } = require('child_process');

      try {
        const result = execSync(`sc query "${this.serviceName}"`, {
          encoding: 'utf8',
          stdio: 'pipe',
        });

        if (result.includes('SERVICE_NAME')) {
          console.log('✅ Service is installed in Windows SCM');

          if (result.includes('RUNNING')) {
            console.log('✅ Service is currently running');
            this.showApplicationAccess();
          } else if (result.includes('STOPPED')) {
            console.log('⚠️  Service is stopped');
            this.showStartInstructions();
          } else {
            console.log('⚠️  Service status unknown');
            console.log('Raw status:', result);
          }

          this.showServiceDetails();
          return;
        }
      } catch (scError) {
        console.log('❌ Service not found in Windows Service Control Manager');
      }

      // Fallback: check node-windows service object
      if (this.service.exists) {
        console.log(
          '⚠️  node-windows reports service exists, but not in Windows SCM'
        );
        console.log(
          'This usually means the service installation is incomplete.'
        );
        this.showInstallInstructions();
      } else {
        console.log('❌ Service is NOT installed');
        this.showInstallInstructions();
      }
    } catch (err) {
      console.error('❌ Error checking service status:', err.message);
    }
  }

  showServiceDetails() {
    console.log('\n📋 Service Details:');
    console.log('-'.repeat(20));
    console.log(`  Service Name: ${this.serviceName}`);
    console.log(`  Script: ${config.script}`);
    console.log(`  Working Directory: ${config.appRoot}`);
    console.log(`  Installed: ${this.service.exists ? 'Yes' : 'No'}`);
  }

  showApplicationAccess() {
    console.log('\n🌐 Application Access:');
    console.log('-'.repeat(20));
    console.log(`  URL: ${config.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
    console.log(`  Port: ${config.env.PORT || 3000}`);
    console.log(`  Logs: ${config.appRoot}/logs/service.log`);
  }

  showStartInstructions() {
    console.log('\n🚀 To start the service:');
    console.log('-'.repeat(25));
    console.log('  npm run service:start');
  }

  showInstallInstructions() {
    console.log('\n📦 To install the service:');
    console.log('-'.repeat(27));
    console.log('  npm run service:install   (install and start)');
  }

  async showLogs() {
    console.log('\n📄 Recent Service Logs:');
    console.log('-'.repeat(24));

    try {
      const fs = require('fs');
      const path = require('path');
      const logFile = path.join(config.appRoot, 'logs', 'service.log');

      if (fs.existsSync(logFile)) {
        const logs = fs.readFileSync(logFile, 'utf8');
        const lines = logs.split('\n').slice(-10); // Last 10 lines
        lines.forEach((line) => {
          if (line.trim()) {
            console.log(`  ${line}`);
          }
        });
      } else {
        console.log('  No log file found');
      }
    } catch (err) {
      console.log('  Could not read log file:', err.message);
    }
  }
}

async function main() {
  const status = new ServiceStatus();

  await status.checkStatus();
  await status.showLogs();

  console.log('\n🛠️  Service Management Commands:');
  console.log('-'.repeat(32));
  console.log('  npm run service:start      - Start the service');
  console.log('  npm run service:stop       - Stop the service');
  console.log('  npm run service:status     - Check service status');
  console.log('  npm run service:uninstall  - Remove the service');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Status check failed:', err);
    process.exit(1);
  });
}

module.exports = ServiceStatus;
