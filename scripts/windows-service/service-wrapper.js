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
      // Ensure we have a production build
      await this.ensureProductionBuild();

      this.log('Starting Electricity Tokens Tracker application...');

      // Start the Next.js production server
      this.appProcess = spawn('npm', ['start'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });

      // Handle application output
      this.appProcess.stdout.on('data', (data) => {
        this.log(`App: ${data.toString().trim()}`);
      });

      this.appProcess.stderr.on('data', (data) => {
        this.log(`App Error: ${data.toString().trim()}`, 'ERROR');
      });

      // Handle application exit
      this.appProcess.on('close', (code, signal) => {
        this.log(
          `Application exited with code ${code}, signal ${signal}`,
          'WARN'
        );

        if (!this.isShuttingDown) {
          this.log(
            'Application crashed unexpectedly. Service will be restarted by Windows Service Manager.',
            'ERROR'
          );
          process.exit(1); // Exit with error code to trigger service restart
        } else {
          // Graceful shutdown
          process.exit(0);
        }
      });

      this.appProcess.on('error', (err) => {
        this.log(`Failed to start application: ${err.message}`, 'ERROR');
        process.exit(1);
      });

      this.log('Application started successfully.');

      // Keep the service process alive
      this.keepAlive();
    } catch (err) {
      this.log(`Failed to start service: ${err.message}`, 'ERROR');
      process.exit(1);
    }
  }

  keepAlive() {
    // Keep the service process alive by preventing it from exiting
    // This maintains the service in a running state
    setInterval(() => {
      // Periodically check if the application is still running
      if (this.appProcess && !this.appProcess.killed) {
        // Application is running, service stays alive
      } else if (!this.isShuttingDown) {
        this.log(
          'Application process not found, service will restart application',
          'WARN'
        );
        // The application will be restarted by the service exit handler
        process.exit(1);
      }
    }, 30000); // Check every 30 seconds

    this.log('Service keep-alive mechanism started');
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.log(`Received ${signal}. Initiating graceful shutdown...`);

    if (this.appProcess) {
      this.log('Stopping application...');

      // Send SIGTERM to the application
      this.appProcess.kill('SIGTERM');

      // Wait for graceful shutdown, but force kill after timeout
      const shutdownTimeout = setTimeout(() => {
        this.log(
          'Graceful shutdown timed out. Force killing application.',
          'WARN'
        );
        this.appProcess.kill('SIGKILL');
      }, 10000); // 10 second timeout

      this.appProcess.on('exit', () => {
        clearTimeout(shutdownTimeout);
        this.log('Application stopped.');
        process.exit(0);
      });
    } else {
      this.log('No application process to stop.');
      process.exit(0);
    }
  }
}

// Start the service
async function main() {
  const service = new ElectricityTokensService();

  service.log('===== Starting Electricity Tokens Tracker Service =====');
  service.log(`Node.js version: ${process.version}`);
  service.log(`Working directory: ${service.appRoot}`);
  service.log(`Process ID: ${process.pid}`);

  await service.startApplication();
}

// Handle startup
if (require.main === module) {
  main().catch((err) => {
    console.error('Service startup failed:', err);
    process.exit(1);
  });
}

module.exports = ElectricityTokensService;
