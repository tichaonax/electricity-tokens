const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class CompleteServiceReset {
  constructor() {
    this.possibleServiceNames = [
      'ElectricityTokensTracker.exe',
      'electricitytokenstracker.exe',
      'electricitytokenstrackerexe.exe',
      'ElectricityTokensTracker',
      'electricitytokenstracker',
      'electricitytokenstrackerexe',
    ];
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

  async findAllElectricityServices() {
    this.log('🔍 Finding ALL electricity-related services...');

    try {
      const { stdout } = await execAsync('sc.exe query state= all');
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
          };
        } else if (trimmed.startsWith('DISPLAY_NAME:') && currentService) {
          currentService.displayName = trimmed
            .replace('DISPLAY_NAME:', '')
            .trim();
        } else if (trimmed.startsWith('STATE:') && currentService) {
          currentService.state = trimmed.replace('STATE:', '').trim();
        }
      }

      if (currentService) {
        services.push(currentService);
      }

      // Filter for electricity services
      const electricityServices = services.filter((service) => {
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

      this.log(
        `Found ${electricityServices.length} electricity-related services:`
      );
      electricityServices.forEach((service) => {
        this.log(`  - ${service.name} (${service.state})`);
      });

      return electricityServices;
    } catch (err) {
      this.log(`Error finding services: ${err.message}`, 'ERROR');
      return [];
    }
  }

  async removeAllElectricityServices() {
    this.log('🗑️ Removing ALL electricity-related services...');

    const services = await this.findAllElectricityServices();

    for (const service of services) {
      try {
        // Stop the service first
        this.log(`Stopping service: ${service.name}`);
        try {
          await execAsync(`sc.exe stop "${service.name}"`);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        } catch (err) {
          this.log(`Service was not running: ${service.name}`);
        }

        // Delete the service
        this.log(`Deleting service: ${service.name}`);
        await execAsync(`sc.exe delete "${service.name}"`);
        this.log(`✅ Deleted: ${service.name}`);
      } catch (err) {
        this.log(`Failed to delete ${service.name}: ${err.message}`, 'WARN');
      }
    }
  }

  async cleanupDaemonDirectory() {
    this.log('🧹 Cleaning up daemon directory...');

    const daemonDir = path.join(__dirname, 'daemon');
    if (fs.existsSync(daemonDir)) {
      try {
        this.log(`Removing daemon directory: ${daemonDir}`);
        fs.rmSync(daemonDir, { recursive: true, force: true });
        this.log('✅ Daemon directory removed');
      } catch (err) {
        this.log(`Failed to remove daemon directory: ${err.message}`, 'ERROR');
      }
    } else {
      this.log('Daemon directory does not exist');
    }
  }

  async installCleanService() {
    this.log('🚀 Installing clean service with simple name...');

    return new Promise((resolve, reject) => {
      const Service = require('node-windows').Service;
      const config = require('./config');

      // Use a very simple, clean name
      const cleanServiceName = 'ElectricityTracker';

      this.log(`Installing service with name: "${cleanServiceName}"`);
      this.log(`This should become: "${cleanServiceName}.exe" in Windows`);

      const svc = new Service({
        name: cleanServiceName,
        description: 'Electricity Tokens Tracker Service',
        script: path.resolve(__dirname, 'service-wrapper-hybrid.js'),
        nodeOptions: config.nodeOptions || [],
        env: config.env || {},

        // Keep it simple - minimal options
        stopparentfirst: true,
        stopchild: true,
      });

      svc.on('install', () => {
        this.log('✅ Clean service installed successfully!');
        this.log(`Expected Windows service name: ${cleanServiceName}.exe`);

        // Update our config to use this name
        this.updateConfigFile(cleanServiceName);

        resolve(cleanServiceName);
      });

      svc.on('error', (err) => {
        this.log(`Installation error: ${err.message}`, 'ERROR');
        reject(err);
      });

      svc.on('invalidinstallation', (err) => {
        this.log(`Invalid installation: ${err.message}`, 'ERROR');
        reject(err);
      });

      svc.install();
    });
  }

  updateConfigFile(newServiceName) {
    try {
      const configPath = path.join(__dirname, 'config.js');
      let configContent = fs.readFileSync(configPath, 'utf8');

      // Replace the service name in config
      configContent = configContent.replace(
        /name: '[^']*'/,
        `name: '${newServiceName}'`
      );

      fs.writeFileSync(configPath, configContent);
      this.log(`✅ Updated config.js with new service name: ${newServiceName}`);
    } catch (err) {
      this.log(`Failed to update config: ${err.message}`, 'ERROR');
    }
  }

  async completeReset() {
    this.log('🔄 Starting complete service reset...');
    this.log('');

    // Check admin privileges
    const isAdmin = await this.checkAdminPrivileges();
    if (!isAdmin) {
      throw new Error(
        '❌ Administrator privileges required. Please run as Administrator.'
      );
    }
    this.log('✅ Admin privileges confirmed');

    // Step 1: Find and remove all existing services
    await this.removeAllElectricityServices();

    // Step 2: Clean up daemon files
    await this.cleanupDaemonDirectory();

    // Step 3: Wait for cleanup
    this.log('⏳ Waiting for cleanup...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 4: Install clean service
    const newServiceName = await this.installCleanService();

    this.log('');
    this.log('✅ Complete service reset completed successfully!');
    this.log('');
    this.log('🎯 Service Details:');
    this.log(`   Clean name: ${newServiceName}`);
    this.log(`   Windows name: ${newServiceName}.exe`);
    this.log('');
    this.log('🎯 Next Steps:');
    this.log('   1. Test: npm run service:diagnose');
    this.log('   2. Start: npm run service:start');
    this.log('   3. Check logs: logs/service-wrapper-YYYY-MM-DD.log');

    return newServiceName;
  }
}

async function main() {
  const resetter = new CompleteServiceReset();

  try {
    await resetter.completeReset();
  } catch (err) {
    console.error('❌ Complete reset failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CompleteServiceReset;
