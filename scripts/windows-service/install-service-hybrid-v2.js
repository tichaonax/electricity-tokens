const Service = require('node-windows').Service;
const config = require('./config');
const path = require('path');

async function installHybridService() {
  console.log(
    '🔧 Installing Electricity Tokens Tracker service (Hybrid Mode)...'
  );

  try {
    // Create service instance with hybrid wrapper
    const svc = new Service({
      name: config.name,
      description:
        config.description + ' (Hybrid Mode - Direct Next.js execution)',
      script: path.resolve(__dirname, 'service-wrapper-hybrid.js'), // Use hybrid wrapper
      nodeOptions: config.nodeOptions,
      env: config.env,

      // Enhanced options for better process management
      stopparentfirst: true, // Stop parent process first
      stopchild: true, // Also stop child processes

      // Logging
      logOnAs: config.logOnAs,

      // Auto-restart configuration
      restart: config.restart,

      // Dependencies
      dependencies: config.dependencies,
    });

    // Check if service already exists
    if (svc.exists) {
      console.log('⚠️  Service already exists. Uninstalling first...');

      return new Promise((resolve, reject) => {
        svc.on('uninstall', () => {
          console.log('✅ Previous service uninstalled.');

          // Install the new version
          installNewService(svc, resolve, reject);
        });

        svc.on('error', (err) => {
          console.error(
            '❌ Failed to uninstall existing service:',
            err.message
          );
          reject(err);
        });

        svc.uninstall();
      });
    } else {
      // Install new service
      return new Promise((resolve, reject) => {
        installNewService(svc, resolve, reject);
      });
    }
  } catch (err) {
    console.error('❌ Error installing service:', err.message);
    process.exit(1);
  }
}

function installNewService(svc, resolve, reject) {
  svc.on('install', () => {
    console.log('✅ Hybrid service installed successfully!');
    console.log('📋 Service Details:');
    console.log(`   Name: ${svc.name}`);
    console.log(`   Description: ${svc.description}`);
    console.log(`   Script: ${svc.script}`);
    console.log('');
    console.log('🚀 Usage:');
    console.log('   Start:     npm run service:start-hybrid');
    console.log('   Stop:      npm run service:stop-hybrid');
    console.log('   Diagnose:  npm run service:diagnose-hybrid');
    console.log('');
    console.log('💡 The hybrid service provides:');
    console.log('   • Direct Next.js process execution (no npm layer)');
    console.log('   • Enhanced process tracking and PID management');
    console.log('   • Force-kill capabilities for orphaned processes');
    console.log('   • Graceful shutdown with fallback to force kill');
    console.log('   • sc.exe integration for reliable start/stop operations');

    resolve();
  });

  svc.on('error', (err) => {
    console.error('❌ Failed to install service:', err.message);

    if (err.message.includes('Access is denied')) {
      console.log('');
      console.log('💡 This error usually means:');
      console.log('   • You need to run this command as Administrator');
      console.log(
        '   • Windows Defender or antivirus is blocking the installation'
      );
      console.log(
        '   • The service is currently running and needs to be stopped first'
      );
      console.log('');
      console.log('🔧 Try:');
      console.log('   1. Run Command Prompt as Administrator');
      console.log('   2. Navigate to your project directory');
      console.log('   3. Run: npm run service:install-hybrid');
    }

    reject(err);
  });

  console.log('Installing hybrid service...');
  svc.install();
}

if (require.main === module) {
  installHybridService().catch((err) => {
    console.error('❌ Installation failed:', err.message);
    process.exit(1);
  });
}

module.exports = installHybridService;
