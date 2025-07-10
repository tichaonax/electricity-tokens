const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const config = require('./config');

class ServiceDiagnostic {
  constructor() {
    this.service = new Service({
      name: config.name,
      script: config.script,
    });
  }

  checkDirectories() {
    console.log('📁 Checking service directories...');

    const locations = [
      path.join(path.dirname(config.script), 'daemon'),
      path.join(config.appRoot, 'daemon'),
      path.join(config.appRoot, 'logs'),
    ];

    locations.forEach((location) => {
      if (fs.existsSync(location)) {
        console.log(`✅ Directory exists: ${location}`);

        // List contents
        try {
          const files = fs.readdirSync(location);
          if (files.length > 0) {
            console.log(`   Files: ${files.join(', ')}`);
          } else {
            console.log('   (empty)');
          }
        } catch (err) {
          console.log(`   Error reading directory: ${err.message}`);
        }
      } else {
        console.log(`❌ Directory missing: ${location}`);
      }
    });
  }

  checkServiceProperties() {
    console.log('\n🔍 Service properties...');
    console.log(`Service exists: ${this.service.exists}`);
    console.log(`Service name: ${config.name}`);
    console.log(`Service script: ${config.script}`);
    console.log(`App root: ${config.appRoot}`);
  }

  checkLogFiles() {
    console.log('\n📄 Checking log files...');

    const logLocations = [
      path.join(config.appRoot, 'logs', 'service.log'),
      path.join(
        path.dirname(config.script),
        'daemon',
        `${config.name}.out.log`
      ),
      path.join(
        path.dirname(config.script),
        'daemon',
        `${config.name}.err.log`
      ),
      path.join(
        path.dirname(config.script),
        'daemon',
        `${config.name}.wrapper.log`
      ),
    ];

    logLocations.forEach((logPath) => {
      if (fs.existsSync(logPath)) {
        console.log(`✅ Log file exists: ${logPath}`);

        try {
          const content = fs.readFileSync(logPath, 'utf8');
          const lines = content.split('\n').slice(-5); // Last 5 lines
          if (lines.some((line) => line.trim())) {
            console.log('   Recent entries:');
            lines.forEach((line) => {
              if (line.trim()) {
                console.log(`   ${line.trim()}`);
              }
            });
          } else {
            console.log('   (empty)');
          }
        } catch (err) {
          console.log(`   Error reading log: ${err.message}`);
        }
      } else {
        console.log(`❌ Log file missing: ${logPath}`);
      }
    });
  }

  checkProcesses() {
    console.log('\n⚡ Checking for running processes...');

    try {
      const { execSync } = require('child_process');

      // Check for node processes
      const nodeProcesses = execSync(
        'tasklist /FI "IMAGENAME eq node.exe" /FO CSV',
        {
          encoding: 'utf8',
        }
      );

      const lines = nodeProcesses
        .split('\n')
        .filter((line) => line.includes('node.exe'));
      if (lines.length > 0) {
        console.log(`Found ${lines.length} node.exe processes:`);
        lines.forEach((line, index) => {
          console.log(`   ${index + 1}. ${line}`);
        });
      } else {
        console.log('No node.exe processes found');
      }

      // Check for our specific service
      const allProcesses = execSync('tasklist /FO CSV', { encoding: 'utf8' });
      if (
        allProcesses.includes('ElectricityTokensTracker') ||
        allProcesses.includes('electricitytokenstracker')
      ) {
        console.log('✅ Found ElectricityTokensTracker process');
      } else {
        console.log('❌ No ElectricityTokensTracker process found');
      }
    } catch (err) {
      console.log(`Error checking processes: ${err.message}`);
    }
  }

  async run() {
    console.log('🔧 Windows Service Diagnostic Tool');
    console.log('==================================\n');

    this.checkServiceProperties();
    this.checkDirectories();
    this.checkLogFiles();
    this.checkProcesses();

    console.log(
      '\n💡 Diagnostic complete. Check the output above for any issues.'
    );
  }
}

const diagnostic = new ServiceDiagnostic();
diagnostic.run().catch((err) => {
  console.error('Diagnostic failed:', err);
});
