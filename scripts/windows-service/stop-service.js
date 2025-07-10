const Service = require('node-windows').Service;
const config = require('./config');

async function stopService() {
  console.log('🛑 Stopping Electricity Tokens Tracker service...');

  try {
    // Create service instance
    const svc = new Service({
      name: config.name,
      script: config.script,
    });

    // Check if service exists
    if (!svc.exists) {
      console.error('❌ Service is not installed.');
      console.log('💡 Install the service first with: npm run service:install');
      process.exit(1);
    }

    // Stop the service
    return new Promise((resolve, reject) => {
      svc.on('stop', () => {
        console.log('✅ Service stopped successfully!');
        resolve();
      });

      svc.on('error', (err) => {
        console.error('❌ Failed to stop service:', err.message);
        reject(err);
      });

      svc.stop();
    });
  } catch (err) {
    console.error('❌ Error stopping service:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  stopService().catch((err) => {
    console.error('❌ Stop failed:', err.message);
    process.exit(1);
  });
}

module.exports = stopService;
