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

  async findElectricityTokensServices() {
    this.log('🔍 Searching for Electricity Tokens Tracker services...');
    this.log('');

    try {
      // Get all services and filter for our service
      const { stdout } = await execAsync(
        `${commands.SC_COMMAND} query state= all`
      );

      // Look for services containing relevant keywords
      const lines = stdout.split('\n');
      const services = [];
      let currentService = null;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('SERVICE_NAME:')) {
          if (currentService) {
            services.push(currentService);
          }
          currentService = {
            name: trimmed.replace('SERVICE_NAME:', '').trim(),
            displayName: '',
            state: '',
            type: '',
          };
        } else if (trimmed.startsWith('DISPLAY_NAME:') && currentService) {
          currentService.displayName = trimmed
            .replace('DISPLAY_NAME:', '')
            .trim();
        } else if (trimmed.startsWith('STATE:') && currentService) {
          currentService.state = trimmed.replace('STATE:', '').trim();
        } else if (trimmed.startsWith('TYPE:') && currentService) {
          currentService.type = trimmed.replace('TYPE:', '').trim();
        }
      }

      // Add the last service
      if (currentService) {
        services.push(currentService);
      }

      // Filter for electricity/tokens related services
      const relevantServices = services.filter((service) => {
        const name = service.name.toLowerCase();
        const displayName = service.displayName.toLowerCase();
        return (
          name.includes('electric') ||
          name.includes('token') ||
          name.includes('tracker') ||
          displayName.includes('electric') ||
          displayName.includes('token') ||
          displayName.includes('tracker')
        );
      });

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
      this.log(`Error searching services: ${err.message}`, 'ERROR');
      return [];
    }
  }

  async testServiceCommands() {
    this.log('🧪 Testing different service name formats...');
    this.log('');

    const possibleNames = [
      'electricitytokenstrackerexe.exe',
      'electricitytokenstracker.exe',
      'electricitytokenstracker',
      'ElectricityTokensTracker',
      'Electricity Tokens Tracker',
      'nodejs-electricitytokenstracker',
      'electricitytokenstrackerexe',
    ];

    for (const name of possibleNames) {
      try {
        this.log(`Testing: "${name}"`);
        const { stdout } = await execAsync(
          `${commands.SC_COMMAND} query "${buildServiceExpectedName(name)}"`
        );
        this.log(`✅ FOUND: "${name}"`);
        this.log('Service details:');
        this.log(stdout);
        this.log('');
        return name; // Return the working name
      } catch (err) {
        this.log(`❌ Not found: "${name}"`);
      }
    }

    this.log('');
    this.log('❌ None of the expected service names were found');
    return null;
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
    const services = await this.findElectricityTokensServices();

    // Step 2: Test service commands
    const workingName = await this.testServiceCommands();

    // Step 3: Check files
    await this.checkServiceFiles();

    // Summary
    this.log('📋 Summary:');
    if (workingName) {
      this.log(`✅ Working service name: "${workingName}"`);
      this.log('');
      this.log('🎯 Recommended actions:');
      this.log(`   - Update config.js to use: "${workingName}"`);
      this.log(`   - Test with: ${commands.SC_COMMAND} query "${workingName}"`);
      this.log(
        `   - Start with: ${commands.SC_COMMAND} start "${workingName}"`
      );
    } else {
      this.log('❌ No working service name found');
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
