const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class HybridElectricityTokensService {
  constructor() {
    this.appProcess = null;
    this.isShuttingDown = false;
    this.appRoot = path.resolve(__dirname, '../..');
    this.logFile = path.join(this.appRoot, 'logs', 'service-wrapper.log');
    this.pidFile = path.join(this.appRoot, 'logs', 'service.pid');

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
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    // Write to log file
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }

    // Also write to console (will be captured by Windows Event Log)
    console.log(logMessage);
  }

  // Save our process PID for hybrid tracking
  savePID() {
    try {
      // Save the actual Next.js process PID, not the wrapper PID
      if (this.appProcess && this.appProcess.pid) {
        fs.writeFileSync(this.pidFile, this.appProcess.pid.toString());
        this.log(`Saved Next.js PID ${this.appProcess.pid} to ${this.pidFile}`);
      }
    } catch (err) {
      this.log(`Failed to save PID: ${err.message}`, 'ERROR');
    }
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
    const buildInfoFile = path.join(buildDir, 'build-info.json');

    // Check if build directory exists
    if (!fs.existsSync(buildDir)) {
      this.log('No production build found. Building application...', 'WARN');
      return this.buildApplication();
    }

    // Check if build is stale by comparing git commit hashes
    const currentCommit = await this.getCurrentGitCommit();
    const lastBuildCommit = this.getLastBuildCommit(buildInfoFile);

    if (!lastBuildCommit) {
      this.log(
        'No build info found. Rebuilding to ensure freshness...',
        'WARN'
      );
      return this.buildApplication();
    }

    if (currentCommit && currentCommit !== lastBuildCommit) {
      this.log(
        `Code changes detected: ${lastBuildCommit.substring(0, 8)} → ${currentCommit.substring(0, 8)}`,
        'WARN'
      );
      this.log('Rebuilding application with latest changes...', 'WARN');
      return this.buildApplication();
    }

    if (!currentCommit) {
      this.log('Cannot determine git state. Using existing build.', 'WARN');
    } else {
      this.log(
        `Production build current (commit: ${currentCommit.substring(0, 8)})`
      );
    }

    return true;
  }

  async getCurrentGitCommit() {
    try {
      const { spawn } = require('child_process');
      return new Promise((resolve) => {
        const gitProcess = spawn('git', ['rev-parse', 'HEAD'], {
          cwd: this.appRoot,
          stdio: 'pipe',
        });

        let output = '';
        gitProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        gitProcess.on('close', (code) => {
          if (code === 0) {
            resolve(output.trim());
          } else {
            this.log('Could not determine git commit', 'WARN');
            resolve(null);
          }
        });

        gitProcess.on('error', () => {
          this.log('Git not available or not a git repository', 'WARN');
          resolve(null);
        });
      });
    } catch (err) {
      this.log(`Error getting git commit: ${err.message}`, 'WARN');
      return null;
    }
  }

  getLastBuildCommit(buildInfoFile) {
    try {
      if (fs.existsSync(buildInfoFile)) {
        const buildInfo = JSON.parse(fs.readFileSync(buildInfoFile, 'utf8'));
        return buildInfo.gitCommit;
      }
    } catch (err) {
      this.log(`Error reading build info: ${err.message}`, 'WARN');
    }
    return null;
  }

  async saveBuildInfo() {
    try {
      const buildDir = path.join(this.appRoot, '.next');
      const buildInfoFile = path.join(buildDir, 'build-info.json');
      const currentCommit = await this.getCurrentGitCommit();

      const buildInfo = {
        gitCommit: currentCommit,
        buildTime: new Date().toISOString(),
        nodeVersion: process.version,
      };

      fs.writeFileSync(buildInfoFile, JSON.stringify(buildInfo, null, 2));
      this.log(
        `Build info saved: commit ${currentCommit?.substring(0, 8) || 'unknown'}`
      );
    } catch (err) {
      this.log(`Error saving build info: ${err.message}`, 'WARN');
    }
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

      buildProcess.on('close', async (code) => {
        if (code === 0) {
          this.log('Production build completed successfully.');
          // Save build info after successful build
          await this.saveBuildInfo();
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
      this.log('Starting Electricity Tokens Tracker service (Hybrid Mode)...');

      // Ensure we have a production build
      await this.ensureProductionBuild();

      this.log('Starting Next.js application directly...');

      // Start Next.js directly using node, not npm
      // This eliminates the npm layer that causes signal propagation issues
      // Use the actual Next.js JavaScript file instead of the shell script
      const nextPath = path.join(
        this.appRoot,
        'node_modules',
        'next',
        'dist',
        'bin',
        'next'
      );

      this.appProcess = spawn('node', [nextPath, 'start'], {
        cwd: this.appRoot,
        stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout/stderr for logging
        shell: false, // Don't use shell to avoid extra process layers
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: process.env.PORT || 3000,
        },
      });

      // Save the PID for hybrid tracking
      this.savePID();

      // Log output from the Next.js process
      this.appProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log(`Next.js: ${output}`);
        }
      });

      this.appProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          this.log(`Next.js Error: ${error}`, 'ERROR');
        }
      });

      // Handle application exit
      this.appProcess.on('close', (code, signal) => {
        this.log(
          `Next.js process exited with code ${code}, signal ${signal}`,
          code === 0 ? 'INFO' : 'ERROR'
        );

        // Clear PID file when process exits
        try {
          if (fs.existsSync(this.pidFile)) {
            fs.unlinkSync(this.pidFile);
          }
        } catch (err) {
          this.log(`Failed to clear PID file: ${err.message}`, 'WARN');
        }

        if (!this.isShuttingDown) {
          // Let node-windows handle the restart
          process.exit(code || 1);
        }
      });

      this.appProcess.on('error', (err) => {
        this.log(`Failed to start Next.js process: ${err.message}`, 'ERROR');
        if (!this.isShuttingDown) {
          process.exit(1);
        }
      });

      this.log(
        `Next.js process started with PID ${this.appProcess.pid}. Hybrid service monitoring active.`
      );
    } catch (err) {
      this.log(`Failed to start service: ${err.message}`, 'ERROR');
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.log(`Received ${signal}. Initiating graceful shutdown...`);

    if (this.appProcess) {
      this.log('Sending SIGTERM to Next.js process...');

      // Send SIGTERM to the Next.js process
      this.appProcess.kill('SIGTERM');

      // Give it time to shut down gracefully
      const gracefulTimeout = setTimeout(() => {
        this.log('Graceful shutdown timeout reached, force killing...', 'WARN');
        if (this.appProcess) {
          this.appProcess.kill('SIGKILL');
        }
        setTimeout(() => process.exit(0), 1000);
      }, 10000); // 10 seconds for graceful shutdown

      // Wait for the process to exit
      this.appProcess.on('close', () => {
        clearTimeout(gracefulTimeout);
        this.log('Next.js process shut down gracefully');
        process.exit(0);
      });
    } else {
      this.log('No active process to shutdown');
      process.exit(0);
    }
  }
}

// Start the service
async function main() {
  const service = new HybridElectricityTokensService();

  service.log('===== Electricity Tokens Tracker Service (Hybrid Mode) =====');
  service.log(`Node.js version: ${process.version}`);
  service.log(`Working directory: ${service.appRoot}`);
  service.log(`Wrapper Process ID: ${process.pid}`);
  service.log('Direct Next.js execution with hybrid monitoring');

  // Start the application
  await service.startApplication();

  // Keep the main process alive
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

module.exports = HybridElectricityTokensService;
