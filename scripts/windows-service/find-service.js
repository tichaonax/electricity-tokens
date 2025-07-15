const { promisify } = require('util');
const { exec } = require('child_process');
const { commands } = require('./config');
const buildServiceExpectedName = require('./buildexpectedservicename');

const execAsync = promisify(exec);

class ServiceFinder {
  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async findElectricityService() {
    const config = require('./config');
    const serviceName = buildServiceExpectedName(config.name);

    this.log(`🔍 Looking for service: ${serviceName}...`);
    this.log('');

    try {
      // Check if our specific service exists
      const { stdout } = await execAsync(
        `${commands.SC_COMMAND} query "${serviceName}"`
      );

      // Parse the service info
      const lines = stdout.split('\n');
      let serviceInfo = {
        name: serviceName,
        displayName: '',
        state: '',
        type: '',
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DISPLAY_NAME:')) {
          serviceInfo.displayName = trimmed.replace('DISPLAY_NAME:', '').trim();
        } else if (trimmed.startsWith('STATE:')) {
          serviceInfo.state = trimmed.replace('STATE:', '').trim();
        } else if (trimmed.startsWith('TYPE:')) {
          serviceInfo.type = trimmed.replace('TYPE:', '').trim();
        }
      }

      const relevantServices = [serviceInfo];

      this.log(`Found ${relevantServices.length} relevant service(s):`);
      this.log('');

      if (relevantServices.length === 0) {
        this.log('❌ No Electricity Tokens services found');
        this.log('');
        this.log('🔍 Checking for node-windows services...');

        // Look for node services
        const nodeServices = services.filter((service) => {
          const name = service.name.toLowerCase();
          const displayName = service.displayName.toLowerCase();
          return (
            name.includes('node') ||
            displayName.includes('node') ||
            name.includes('js') ||
            name.includes('javascript')
          );
        });

        if (nodeServices.length > 0) {
          this.log(`Found ${nodeServices.length} Node.js related service(s):`);
          nodeServices.forEach((service, index) => {
            this.log(`${index + 1}. ${service.name}`);
            this.log(`   Display Name: ${service.displayName}`);
            this.log(`   State: ${service.state}`);
            this.log(`   Type: ${service.type}`);
            this.log('');
          });
        } else {
          this.log('❌ No Node.js services found either');
        }
      } else {
        relevantServices.forEach((service, index) => {
          this.log(`${index + 1}. Service Name: ${service.name}`);
          this.log(`   Display Name: ${service.displayName}`);
          this.log(`   State: ${service.state}`);
          this.log(`   Type: ${service.type}`);
          this.log('');
        });
      }

      return relevantServices;
    } catch (err) {
      this.log(`ℹ️  Service ${serviceName} not found or not running`);
      this.log('This is normal if the service has not been installed yet.');
      return [];
    }
  }

  async testCurrentServiceName() {
    this.log('🧪 Testing current configured service name...');
    this.log('');

    const config = require('./config');
    const serviceName = config.name;
    const expectedName = buildServiceExpectedName(serviceName);

    try {
      this.log(`Testing configured service: "${serviceName}"`);
      this.log(`Expected Windows name: "${expectedName}"`);

      const { stdout } = await execAsync(
        `${commands.SC_COMMAND} query "${expectedName}"`
      );
      this.log(`✅ FOUND: Service is properly registered`);
      this.log('Service details:');
      this.log(stdout);
      this.log('');
      return serviceName;
    } catch (err) {
      this.log(`❌ Service not found: ${err.message}`);
      this.log('');
      return null;
    }
  }

  async checkServiceFiles() {
    this.log('📁 Checking for service-related files...');
    const fs = require('fs');
    const path = require('path');

    const daemonPath = path.join(__dirname, 'daemon');
    this.log(`Daemon directory: ${daemonPath}`);

    if (fs.existsSync(daemonPath)) {
      this.log('✅ Daemon directory exists');
      const files = fs.readdirSync(daemonPath);
      this.log(`Files in daemon directory (${files.length}):`);
      files.forEach((file) => {
        this.log(`   ${file}`);
      });
    } else {
      this.log('❌ Daemon directory does not exist');
    }

    this.log('');
  }

  async findService() {
    this.log('🔍 Electricity Tokens Service Finder');
    this.log('================================================');
    this.log('');

    // Step 1: Search for services
    const services = await this.findElectricityService();

    // Step 2: Test current service configuration
    const workingName = await this.testCurrentServiceName();

    // Step 3: Check files
    await this.checkServiceFiles();

    // Summary
    this.log('📋 Summary:');
    if (workingName) {
      this.log(`✅ Service is properly configured and registered`);
      this.log(`   Configuration name: "${workingName}"`);
      this.log(
        `   Windows service name: "${buildServiceExpectedName(workingName)}"`
      );
      this.log('');
      this.log('🎯 Ready for use:');
      this.log(`   - Start: npm run service:start`);
      this.log(`   - Stop: npm run service:stop`);
      this.log(`   - Diagnose: npm run service:diagnose`);
    } else {
      this.log('❌ Service configuration issue detected');
      this.log('');
      this.log('🎯 Recommended actions:');
      this.log('   - Service may not be properly installed');
      this.log('   - Try: npm run service:fix');
      this.log('   - Check Windows Event Viewer for service errors');
    }

    return { services, workingName };
  }
}

async function main() {
  const finder = new ServiceFinder();
  await finder.findService();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ServiceFinder;
