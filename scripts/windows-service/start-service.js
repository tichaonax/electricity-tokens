const Service = require('node-windows').Service;
const config = require('./config');

async function startService() {
  console.log('🚀 Starting Electricity Tokens Tracker service...');

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

    // Start the service
    return new Promise((resolve, reject) => {
      svc.on('start', () => {
        console.log('✅ Service started successfully!');
        resolve();
      });

      svc.on('error', (err) => {
        console.error('❌ Failed to start service:', err.message);
        reject(err);
      });

      svc.start();
    });
  } catch (err) {
    console.error('❌ Error starting service:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('❌ Start failed:', err.message);
    process.exit(1);
  });
}

module.exports = startService;
