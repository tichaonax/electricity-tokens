const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./config');

async function debugInstall() {
  console.log('🔍 Windows Service Installation Debug');
  console.log('====================================\n');

  // Basic environment check
  console.log('📋 Environment Information:');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Node.js Path: ${process.execPath}`);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`App Root: ${config.appRoot}`);
  console.log(`Service Script: ${config.script}`);
  console.log('');

  // Check if running as admin
  console.log('🔐 Checking Administrator Privileges:');
  try {
    execSync('net session', { stdio: 'pipe' });
    console.log('✅ Running as Administrator');
  } catch (err) {
    console.log('❌ NOT running as Administrator');
    console.log('   Please run PowerShell as Administrator and try again');
    process.exit(1);
  }
  console.log('');

  // Check if files exist
  console.log('📁 File System Check:');
  console.log(
    `Service wrapper exists: ${fs.existsSync(config.script) ? '✅' : '❌'}`
  );
  console.log(
    `Config file exists: ${fs.existsSync(path.join(__dirname, 'config.js')) ? '✅' : '❌'}`
  );
  console.log(
    `Package.json exists: ${fs.existsSync(path.join(config.appRoot, 'package.json')) ? '✅' : '❌'}`
  );
  console.log('');

  // Check existing service
  console.log('🔍 Checking Existing Service:');
  try {
    const result = execSync(`sc query "${config.name}"`, { encoding: 'utf8' });
    console.log('⚠️  Service already exists:');
    console.log(result);
    console.log(
      '   You may need to delete it first with: sc delete "ElectricityTokensTracker"'
    );
  } catch (err) {
    console.log('✅ No existing service found');
  }
  console.log('');

  // Test sc command
  console.log('🧪 Testing SC Command Access:');
  try {
    const scHelp = execSync('sc', { encoding: 'utf8' });
    console.log('✅ SC command is available');
  } catch (err) {
    console.log('❌ SC command failed:', err.message);
  }
  console.log('');

  // Show the exact command that would be run
  console.log('🔧 Service Creation Command:');
  const nodeExe = process.execPath;
  const scriptPath = config.script;
  const serviceName = config.name;
  const serviceDesc = config.description;

  console.log('Command components:');
  console.log(`- Node.js executable: "${nodeExe}"`);
  console.log(`- Service script: "${scriptPath}"`);
  console.log(`- Service name: "${serviceName}"`);
  console.log(`- Description: "${serviceDesc}"`);
  console.log('');

  const psCommand = `sc.exe create "${serviceName}" binPath= "\\"${nodeExe}\\" \\"${scriptPath}\\"" DisplayName= "${serviceName}" start= auto`;
  const cmdCommand = `sc create "${serviceName}" binPath= "\\"${nodeExe}\\" \\"${scriptPath}\\"" DisplayName= "${serviceName}" start= auto`;

  console.log('Commands to create service:');
  console.log('');

  // Test the command (dry run info)
  console.log('🚀 Ready to create service!');
  console.log('');

  console.log('For PowerShell (Run as Administrator):');
  console.log('```');
  console.log(psCommand);
  console.log('```');
  console.log('');

  console.log('For Command Prompt (Run as Administrator):');
  console.log('```');
  console.log(cmdCommand);
  console.log('```');
  console.log('');

  console.log('📊 Next Steps:');
  console.log('1. Copy the command above');
  console.log('2. Open PowerShell as Administrator');
  console.log('3. Paste and run the command');
  console.log(
    '4. If successful, start with: sc start "ElectricityTokensTracker"'
  );
  console.log('5. Check status with: sc query "ElectricityTokensTracker"');
  console.log('');

  console.log('📞 For more help, run: npm run service:install-manual');
}

if (require.main === module) {
  debugInstall().catch((err) => {
    console.error('Debug failed:', err);
    process.exit(1);
  });
}

module.exports = debugInstall;
