const { execSync } = require('child_process');
const config = require('./config');

class ServiceStatus {
  constructor() {
    this.serviceName = config.name;
  }

  async checkStatus() {
    console.log(`🔍 Checking status of ${this.serviceName}...`);
    console.log('='.repeat(50));

    try {
      const result = execSync(`sc query "${this.serviceName}"`, {
        encoding: 'utf8',
      });

      if (result.includes('SERVICE_NAME')) {
        console.log('✅ Service is registered');

        if (result.includes('RUNNING')) {
          console.log('✅ Service is RUNNING');
          this.showServiceDetails(result);
          this.showApplicationAccess();
        } else if (result.includes('STOPPED')) {
          console.log('⚠️  Service is STOPPED');
          this.showServiceDetails(result);
          this.showStartInstructions();
        } else {
          console.log('⚠️  Service is in transitional state');
          this.showServiceDetails(result);
        }
      }
    } catch (err) {
      if (
        err.message.includes('does not exist') ||
        err.message.includes('OpenService FAILED')
      ) {
        console.log('❌ Service is NOT installed');
        this.showInstallInstructions();
      } else {
        console.error('❌ Error checking service status:', err.message);
      }
    }
  }

  showServiceDetails(result) {
    console.log('\n📋 Service Details:');
    console.log('-'.repeat(20));

    // Extract key information from sc query output
    const lines = result.split('\n');
    lines.forEach((line) => {
      if (
        line.includes('STATE') ||
        line.includes('WIN32_EXIT_CODE') ||
        line.includes('SERVICE_EXIT_CODE')
      ) {
        console.log(`  ${line.trim()}`);
      }
    });
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
    console.log('  OR');
    console.log(`  sc start "${this.serviceName}"`);
  }

  showInstallInstructions() {
    console.log('\n📦 To install the service:');
    console.log('-'.repeat(27));
    console.log('  npm run service:validate  (check prerequisites)');
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
