const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ElectricityTokensService {
  constructor() {
    this.appProcess = null;
    this.isShuttingDown = false;
    this.appRoot = path.resolve(__dirname, '../..');
    this.logFile = path.join(this.appRoot, 'logs', 'service.log');
    this.restartAttempts = 0;
    this.maxRestartAttempts = 3;
    this.lastFailureTime = null;
    this.portConflictDetected = false;

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
      this.log('Service starting - responding to Windows immediately...');

      // Start background initialization immediately
      this.initializeApplicationInBackground();

      // Keep the service process alive
      this.keepAlive();

      this.log('Service responded to Windows successfully.');
    } catch (err) {
      this.log(`Failed to start service: ${err.message}`, 'ERROR');
      process.exit(1);
    }
  }

  async initializeApplicationInBackground() {
    try {
      this.log('Background initialization started...');

      // Ensure we have a production build (this can take time)
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
        const errorMsg = data.toString().trim();
        this.log(`App Error: ${errorMsg}`, 'ERROR');

        // Detect port conflicts
        if (
          errorMsg.includes('EADDRINUSE') ||
          errorMsg.includes('address already in use')
        ) {
          this.portConflictDetected = true;
          this.log(
            'Port conflict detected - another instance may be running',
            'ERROR'
          );
        }
      });

      // Handle application exit
      this.appProcess.on('close', (code, signal) => {
        this.log(
          `Application exited with code ${code}, signal ${signal}`,
          'WARN'
        );

        if (!this.isShuttingDown) {
          this.handleApplicationFailure(code);
        }
      });

      this.appProcess.on('error', (err) => {
        this.log(`Failed to start application: ${err.message}`, 'ERROR');
        this.handleApplicationFailure(1, err.message);
      });

      // Wait for application to be ready
      await this.waitForApplicationReady();

      this.log('Application started successfully.');
    } catch (err) {
      this.log(`Background initialization failed: ${err.message}`, 'ERROR');
      this.handleApplicationFailure(1, err.message);
    }
  }

  handleApplicationFailure(exitCode, errorMessage = '') {
    const now = Date.now();

    // Reset restart attempts if enough time has passed since last failure
    if (this.lastFailureTime && now - this.lastFailureTime > 300000) {
      // 5 minutes
      this.restartAttempts = 0;
      this.portConflictDetected = false;
    }

    this.lastFailureTime = now;
    this.restartAttempts++;

    if (this.portConflictDetected) {
      this.log(
        'Port conflict detected - will not attempt restart to avoid loop',
        'ERROR'
      );
      this.log(
        'Please stop other instances and restart the service manually',
        'ERROR'
      );
      return;
    }

    if (this.restartAttempts > this.maxRestartAttempts) {
      this.log(
        `Maximum restart attempts (${this.maxRestartAttempts}) exceeded. Stopping restart attempts.`,
        'ERROR'
      );
      this.log(
        'Service will continue running but application will not be restarted automatically',
        'ERROR'
      );
      return;
    }

    const delay = Math.min(30000, 5000 * this.restartAttempts); // Max 30 second delay
    this.log(
      `Application failure #${this.restartAttempts}. Retrying in ${delay / 1000} seconds...`,
      'WARN'
    );

    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.log(`Restart attempt #${this.restartAttempts}...`, 'INFO');
        this.initializeApplicationInBackground();
      }
    }, delay);
  }

  async waitForApplicationReady() {
    return new Promise((resolve) => {
      if (!this.appProcess) {
        resolve();
        return;
      }

      // Wait up to 30 seconds for the application to output something
      const timeout = setTimeout(() => {
        this.log('Application startup timeout - assuming ready', 'WARN');
        resolve();
      }, 30000);

      const onData = () => {
        clearTimeout(timeout);
        this.appProcess.stdout.off('data', onData);
        this.log('Application appears to be ready');
        // Reset restart attempts on successful start
        this.restartAttempts = 0;
        this.portConflictDetected = false;
        resolve();
      };

      this.appProcess.stdout.once('data', onData);
    });
  }

  keepAlive() {
    // Keep the service process alive by preventing it from exiting
    // This maintains the service in a running state
    setInterval(() => {
      // Periodically check if the application is still running
      if (this.appProcess && !this.appProcess.killed) {
        // Application is running, service stays alive
        // Only log every 10 minutes to reduce log spam
        if (Date.now() % 600000 < 60000) {
          this.log(
            'Service health check: Application running normally',
            'INFO'
          );
        }
      } else if (
        !this.isShuttingDown &&
        !this.portConflictDetected &&
        this.restartAttempts < this.maxRestartAttempts
      ) {
        this.log(
          'Application process not found, attempting restart...',
          'WARN'
        );
        this.handleApplicationFailure(
          0,
          'Process not found during health check'
        );
      }
    }, 60000); // Check every 60 seconds

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
  service.log(
    'Service will respond to Windows immediately and initialize in background'
  );

  // This now returns quickly, allowing Windows service to start properly
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
