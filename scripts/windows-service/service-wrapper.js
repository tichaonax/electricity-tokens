const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ElectricityTokensService {
  constructor() {
    this.appProcess = null;
    this.isShuttingDown = false;
    this.appRoot = path.resolve(__dirname, '../..');
    this.logFile = path.join(this.appRoot, 'logs', 'service.log');

    // Ensure logs directory exists
    this.ensureLogsDirectory();

    // Set up signal handlers for graceful shutdown
    this.setupSignalHandlers();
  }

  ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    // Write to log file
    try {
      fs.appendFileSync(this.logFile, logMessage);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }

    // Also write to console (will be captured by Windows Event Log)
    console.log(logMessage.trim());
  }

  setupSignalHandlers() {
    // Handle Windows service stop signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      this.log(`Uncaught exception: ${err.message}`, 'ERROR');
      this.log(`Stack trace: ${err.stack}`, 'ERROR');
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.log(
        `Unhandled rejection at: ${promise}, reason: ${reason}`,
        'ERROR'
      );
    });
  }

  async ensureProductionBuild() {
    this.log('Checking for production build...');

    const buildDir = path.join(this.appRoot, '.next');
    if (!fs.existsSync(buildDir)) {
      this.log('No production build found. Building application...', 'WARN');
      return this.buildApplication();
    }

    this.log('Production build found.');
    return true;
  }

  buildApplication() {
    return new Promise((resolve, reject) => {
      this.log('Starting production build...');

      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
      });

      let buildOutput = '';
      let buildError = '';

      buildProcess.stdout.on('data', (data) => {
        const output = data.toString();
        buildOutput += output;
        this.log(`Build: ${output.trim()}`);
      });

      buildProcess.stderr.on('data', (data) => {
        const error = data.toString();
        buildError += error;
        this.log(`Build Error: ${error.trim()}`, 'ERROR');
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          this.log('Production build completed successfully.');
          resolve(true);
        } else {
          this.log(`Build failed with code ${code}`, 'ERROR');
          reject(new Error(`Build failed: ${buildError}`));
        }
      });
    });
  }

  async startApplication() {
    try {
      this.log('Starting Electricity Tokens Tracker service...');

      // Ensure we have a production build
      await this.ensureProductionBuild();

      this.log('Starting Next.js application...');

      // Start the Next.js production server
      // node-windows will handle restarts, monitoring, etc.
      this.appProcess = spawn('npm', ['start'], {
        cwd: this.appRoot,
        stdio: 'inherit', // Let output go directly to console/logs
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });

      // Handle application exit
      this.appProcess.on('close', (code, signal) => {
        this.log(
          `Application exited with code ${code}, signal ${signal}`,
          code === 0 ? 'INFO' : 'ERROR'
        );

        if (!this.isShuttingDown) {
          // Let node-windows handle the restart
          process.exit(code || 1);
        }
      });

      this.appProcess.on('error', (err) => {
        this.log(`Failed to start application: ${err.message}`, 'ERROR');
        if (!this.isShuttingDown) {
          process.exit(1);
        }
      });

      this.log(
        'Next.js application process started. node-windows will monitor and restart if needed.'
      );
    } catch (err) {
      this.log(`Failed to start service: ${err.message}`, 'ERROR');
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.log(`Received ${signal}. Shutting down...`);

    if (this.appProcess) {
      this.log('Stopping Next.js application...');
      this.appProcess.kill('SIGTERM');

      // Give it a moment to shut down gracefully
      setTimeout(() => {
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  }
}

// Start the service
async function main() {
  const service = new ElectricityTokensService();

  service.log('===== Electricity Tokens Tracker Service =====');
  service.log(`Node.js version: ${process.version}`);
  service.log(`Working directory: ${service.appRoot}`);
  service.log(`Process ID: ${process.pid}`);
  service.log('node-windows will handle service monitoring and restarts');

  // Start the application - node-windows handles the rest
  await service.startApplication();

  // Keep the main process alive
  // node-windows will restart this entire script if it exits
  process.on('SIGTERM', () => service.gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => service.gracefulShutdown('SIGINT'));
}

// Handle startup
if (require.main === module) {
  main().catch((err) => {
    console.error('Service startup failed:', err);
    process.exit(1);
  });
}

module.exports = ElectricityTokensService;
