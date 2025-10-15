const HealthMonitor = require('./health-monitor');

class HealthMonitorService {
  constructor() {
    this.monitor = null;
  }

  async start() {
    console.log('Starting Health Monitor Service...');

    this.monitor = new HealthMonitor({
      checkInterval: 30000, // 30 seconds
      healthTimeout: 10000, // 10 seconds
      maxConsecutiveFailures: 3, // Restart after 3 consecutive failures
      restartCooldown: 300000, // 5 minutes cooldown between restarts
    });

    this.monitor.start();

    // Keep the service alive
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    process.on('SIGTERM', () => {
      console.log('Health Monitor Service received SIGTERM, shutting down...');
      if (this.monitor) {
        this.monitor.stop();
      }
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('Health Monitor Service received SIGINT, shutting down...');
      if (this.monitor) {
        this.monitor.stop();
      }
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('Health Monitor Service uncaught exception:', error);
      if (this.monitor) {
        this.monitor.stop();
      }
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Health Monitor Service unhandled rejection:', reason);
    });
  }
}

// Start the service
async function main() {
  const service = new HealthMonitorService();
  await service.start();

  // Keep the process alive
  setInterval(() => {
    // Health monitoring runs continuously
  }, 60000);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Health Monitor Service failed to start:', error);
    process.exit(1);
  });
}

module.exports = HealthMonitorService;
