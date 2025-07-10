const path = require('path');
const fs = require('fs');
const config = require('./config');

class ManualServiceInstaller {
  constructor() {
    this.serviceName = config.name;
    this.serviceDescription = config.description;
    this.scriptPath = config.script;
    this.appRoot = config.appRoot;
    this.nodeExe = process.execPath;
  }

  validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check platform
    if (process.platform !== 'win32') {
      throw new Error('This script only works on Windows');
    }

    // Check if script exists
    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`Service wrapper script not found: ${this.scriptPath}`);
    }

    console.log('✅ Environment validation passed.');
  }

  showManualInstructions() {
    console.log('\n📋 Manual Windows Service Installation Instructions');
    console.log('==================================================\n');

    console.log(
      '🔧 Copy and paste these commands in PowerShell (Run as Administrator):\n'
    );

    console.log('1️⃣  Create the service (PowerShell - use sc.exe):');
    console.log('```');
    console.log(
      `sc.exe create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto`
    );
    console.log('```');
    console.log('💡 Or in Command Prompt (cmd):');
    console.log('```');
    console.log(
      `sc create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto`
    );
    console.log('```\n');

    console.log('2️⃣  Set service description:');
    console.log('```');
    console.log(
      `sc.exe description "${this.serviceName}" "${this.serviceDescription}"`
    );
    console.log('```\n');

    console.log('3️⃣  Configure service recovery (optional):');
    console.log('```');
    console.log(
      `sc.exe failure "${this.serviceName}" reset=3600 actions=restart/60000/restart/120000/restart/300000`
    );
    console.log('```\n');

    console.log('4️⃣  Start the service:');
    console.log('```');
    console.log(`sc.exe start "${this.serviceName}"`);
    console.log('```\n');

    console.log('5️⃣  Check service status:');
    console.log('```');
    console.log(`sc.exe query "${this.serviceName}"`);
    console.log('```\n');

    console.log('🗑️  To remove the service later:');
    console.log('```');
    console.log(`sc.exe stop "${this.serviceName}"`);
    console.log(`sc.exe delete "${this.serviceName}"`);
    console.log('```\n');

    console.log('📊 Service Information:');
    console.log('----------------------');
    console.log(`Service Name: ${this.serviceName}`);
    console.log(`Description: ${this.serviceDescription}`);
    console.log(`Node.js Path: ${this.nodeExe}`);
    console.log(`Service Script: ${this.scriptPath}`);
    console.log(`Working Directory: ${this.appRoot}`);
    console.log(`Log File: ${path.join(this.appRoot, 'logs', 'service.log')}`);

    console.log('\n💡 Alternative single command (PowerShell):');
    console.log('```');
    const singleCommand = `sc.exe create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto; sc.exe description "${this.serviceName}" "${this.serviceDescription}"; sc.exe start "${this.serviceName}"`;
    console.log(singleCommand);
    console.log('```\n');

    console.log('💡 For Command Prompt (cmd):');
    console.log('```');
    const cmdCommand = `sc create "${this.serviceName}" binPath= "\\"${this.nodeExe}\\" \\"${this.scriptPath}\\"" DisplayName= "${this.serviceName}" start= auto && sc description "${this.serviceName}" "${this.serviceDescription}" && sc start "${this.serviceName}"`;
    console.log(cmdCommand);
    console.log('```\n');

    console.log('⚠️  Important Notes:');
    console.log('- Run all commands as Administrator');
    console.log('- Ensure all file paths are correct');
    console.log('- Check Windows Event Viewer if service fails to start');
    console.log('- Service will auto-start on system boot');
  }

  showTroubleshooting() {
    console.log('\n🚨 Troubleshooting Common Issues:');
    console.log('=================================\n');

    console.log('❌ "Access Denied" error:');
    console.log('   → Run PowerShell as Administrator\n');

    console.log('❌ "The specified service already exists":');
    console.log(`   → Delete existing: sc delete "${this.serviceName}"\n`);

    console.log('❌ Service starts but application not accessible:');
    console.log('   → Check environment variables');
    console.log('   → Verify database connection');
    console.log('   → Check Windows Event Viewer');
    console.log(
      `   → Check log file: ${path.join(this.appRoot, 'logs', 'service.log')}\n`
    );

    console.log('❌ "The system cannot find the file specified":');
    console.log('   → Verify Node.js path is correct');
    console.log('   → Check service wrapper script exists');
    console.log('   → Use full absolute paths\n');

    console.log('✅ Verify installation:');
    console.log('   → Service appears in Windows Services (services.msc)');
    console.log('   → Application accessible at http://localhost:3000');
    console.log(
      '   → Check service status with: sc query ElectricityTokensTracker'
    );
  }
}

async function main() {
  const installer = new ManualServiceInstaller();

  try {
    installer.validateEnvironment();
    installer.showManualInstructions();
    installer.showTroubleshooting();
  } catch (err) {
    console.error('\n❌ Validation failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ManualServiceInstaller;
