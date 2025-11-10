const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log(`✅ Loaded environment from ${envPath}`);
  console.log(`📌 PORT set to: ${process.env.PORT}`);
  console.log(
    `📌 DATABASE_URL set to: ${process.env.DATABASE_URL ? 'present' : 'missing'}`
  );
} else {
  console.warn(`⚠️  .env.local not found at ${envPath}`);
}

class HybridElectricityTokensService {
  constructor() {
    this.appProcess = null;
    this.isShuttingDown = false;
    this.appRoot = path.resolve(__dirname, '../..');
    this.logFile = this.getDailyLogFile();
    this.pidFile = path.join(this.appRoot, 'logs', 'service.pid');

    // Built-in health monitoring properties
    this.healthCheckInterval = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    this.healthCheckFrequency = 30000; // 30 seconds
    this.lastRestartTime = 0;
    this.restartCooldown = 300000; // 5 minutes
    this.isHealthMonitoring = false;

    // Ensure logs directory exists
    this.ensureLogsDirectory();

    // Clean up old log files
    this.cleanupOldLogs();

    // Set up signal handlers for graceful shutdown
    this.setupSignalHandlers();
  }

  getDailyLogFile() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return path.join(this.appRoot, 'logs', `service-wrapper-${today}.log`);
  }

  ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  cleanupOldLogs() {
    try {
      const logsDir = path.join(this.appRoot, 'logs');
      if (!fs.existsSync(logsDir)) {
        return;
      }

      const files = fs.readdirSync(logsDir);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      let deletedCount = 0;

      files.forEach((file) => {
        // Match service wrapper log files with date pattern
        const match = file.match(/^service-wrapper-(\d{4}-\d{2}-\d{2})\.log$/);
        if (match) {
          const fileDate = new Date(match[1]);
          if (fileDate < twoWeeksAgo) {
            try {
              fs.unlinkSync(path.join(logsDir, file));
              deletedCount++;
              console.log(`Deleted old log file: ${file}`);
            } catch (err) {
              console.error(`Failed to delete log file ${file}:`, err.message);
            }
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old log files`);
      }
    } catch (err) {
      console.error('Error during log cleanup:', err.message);
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    // Update log file path if date has changed (for daily rotation)
    const currentLogFile = this.getDailyLogFile();
    if (currentLogFile !== this.logFile) {
      this.logFile = currentLogFile;
      this.ensureLogsDirectory();
    }

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

  async checkIfRebuildNeeded() {
    try {
      const buildDir = path.join(this.appRoot, '.next');
      const buildInfoFile = path.join(buildDir, 'build-info.json');
      const buildCompleteMarker = path.join(buildDir, '.build-complete');

      // No build directory = rebuild needed
      if (!fs.existsSync(buildDir)) {
        this.log('No .next directory found - rebuild required');
        return true;
      }

      // No BUILD_ID = rebuild needed
      const buildId = path.join(buildDir, 'BUILD_ID');
      if (!fs.existsSync(buildId)) {
        this.log('No BUILD_ID found - rebuild required');
        return true;
      }

      // Check for build completion marker (unified build tracking)
      if (!fs.existsSync(buildCompleteMarker)) {
        this.log(
          'No build completion marker found - rebuild required to create unified tracking'
        );
        return true;
      }

      // Get current commit from repository (NOT from build info files)
      const currentCommit = await this.getCurrentGitCommit();

      // If no build info file exists, we need to check if we can get current commit
      if (!fs.existsSync(buildInfoFile)) {
        if (currentCommit) {
          this.log(
            'No build info file but can detect git state - rebuild required to create proper build info'
          );
          return true;
        } else {
          this.log(
            'No build info and no git access - assuming build is valid',
            'WARN'
          );
          return false;
        }
      }

      // Get last build commit from build info
      const lastBuildCommit = this.getLastBuildCommit(buildInfoFile);

      // If we can't determine current commit but have build info, be conservative
      if (!currentCommit) {
        if (lastBuildCommit) {
          this.log(
            'Cannot determine current commit but build info exists - assuming build is current',
            'WARN'
          );
          return false;
        } else {
          this.log(
            'No git access and no build commit info - rebuild required for safety'
          );
          return true;
        }
      }

      // If we have current commit but no last build commit, rebuild to create proper tracking
      if (!lastBuildCommit) {
        this.log(
          'Current commit detected but no last build commit info - rebuild required'
        );
        return true;
      }

      // If we have both commits and they're different, rebuild needed
      if (currentCommit !== lastBuildCommit) {
        this.log(
          `Code changes detected: ${lastBuildCommit.substring(0, 8)} → ${currentCommit.substring(0, 8)} - rebuild required`
        );
        return true;
      }

      // All checks passed - commits match, no rebuild needed
      this.log(
        `Build is current - both at commit ${currentCommit.substring(0, 8)}`
      );
      return false;
    } catch (err) {
      this.log(`Error checking rebuild status: ${err.message}`, 'ERROR');
      // Be more aggressive - if we can't determine state, rebuild for safety
      this.log('Unknown build state - rebuilding for safety');
      return true;
    }
  }

  async ensureProductionBuild() {
    this.log('Building application with latest changes...');
    return this.buildApplication();
  }

  async getCurrentGitCommit() {
    try {
      // Get the ACTUAL current git commit from the repository, not from build info
      // This method should return the current state of the repository

      // Method 1: Try to read from .git/HEAD directly
      const gitHeadFile = path.join(this.appRoot, '.git', 'HEAD');
      if (fs.existsSync(gitHeadFile)) {
        try {
          const headContent = fs.readFileSync(gitHeadFile, 'utf8').trim();
          if (headContent.startsWith('ref: ')) {
            // It's a reference, read the actual commit
            const refPath = headContent.substring(5);
            const refFile = path.join(this.appRoot, '.git', refPath);
            if (fs.existsSync(refFile)) {
              const commit = fs.readFileSync(refFile, 'utf8').trim();
              if (commit && commit.length === 40) {
                this.log(
                  `Git commit from .git/HEAD: ${commit.substring(0, 8)}`
                );
                return commit;
              }
            }
          } else if (headContent.length === 40) {
            // It's a direct commit hash
            this.log(
              `Git commit from .git/HEAD: ${headContent.substring(0, 8)}`
            );
            return headContent;
          }
        } catch (err) {
          // Continue to other methods
        }
      }

      // Method 3: Try git command with full path detection
      const { spawn } = require('child_process');
      const gitPaths = [
        'git',
        'C:\\Program Files\\Git\\bin\\git.exe',
        'C:\\Program Files (x86)\\Git\\bin\\git.exe',
        'C:\\Git\\bin\\git.exe',
      ];

      for (const gitPath of gitPaths) {
        try {
          const result = await new Promise((resolve) => {
            const gitProcess = spawn(gitPath, ['rev-parse', 'HEAD'], {
              cwd: this.appRoot,
              stdio: 'pipe',
              shell: true,
            });

            let output = '';
            gitProcess.stdout.on('data', (data) => {
              output += data.toString();
            });

            gitProcess.on('close', (code) => {
              if (code === 0 && output.trim().length === 40) {
                resolve(output.trim());
              } else {
                resolve(null);
              }
            });

            gitProcess.on('error', () => {
              resolve(null);
            });

            // Add timeout
            setTimeout(() => {
              gitProcess.kill();
              resolve(null);
            }, 5000);
          });

          if (result) {
            this.log(`Git commit from ${gitPath}: ${result.substring(0, 8)}`);
            return result;
          }
        } catch (err) {
          // Continue to next git path
        }
      }

      // Method 4: Last resort - try to read from package.json build info (only if no git access)
      this.log('No git access detected, trying fallback methods...', 'WARN');
      const packageJsonFile = path.join(this.appRoot, 'package.json');
      if (fs.existsSync(packageJsonFile)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonFile, 'utf8')
          );
          if (packageJson.buildInfo && packageJson.buildInfo.gitCommit) {
            this.log(
              `Git commit from package.json (fallback): ${packageJson.buildInfo.gitCommit.substring(0, 8)}`
            );
            return packageJson.buildInfo.gitCommit;
          }
        } catch (err) {
          // Continue
        }
      }

      // Method 5: Absolute last resort - check public build info (likely stale)
      const publicBuildInfo = path.join(
        this.appRoot,
        'public',
        'build-info.json'
      );
      if (fs.existsSync(publicBuildInfo)) {
        try {
          const buildInfo = JSON.parse(
            fs.readFileSync(publicBuildInfo, 'utf8')
          );
          if (buildInfo.gitCommit && buildInfo.gitCommit !== 'unknown') {
            this.log(
              `Git commit from public build info (stale fallback): ${buildInfo.gitCommit.substring(0, 8)}`,
              'WARN'
            );
            return buildInfo.gitCommit;
          }
        } catch (err) {
          // Continue
        }
      }

      this.log('Could not determine git commit using any method', 'WARN');
      return null;
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
      this.log('Saving build information...');

      const buildDir = path.join(this.appRoot, '.next');
      const buildInfoFile = path.join(buildDir, 'build-info.json');
      const currentCommit = await this.getCurrentGitCommit();

      // First try to use the dedicated build info generation script
      try {
        const { generateBuildInfo } = require('../generate-build-info.js');
        const buildInfo = generateBuildInfo();

        // Use current commit if script didn't detect git commit properly
        const effectiveCommit = buildInfo.gitCommit || currentCommit;

        // Also save to .next directory for our service to check
        const serviceBuildInfo = {
          version: buildInfo.version || '0.1.0',
          gitCommit: effectiveCommit,
          buildTime: buildInfo.buildTime || new Date().toISOString(),
          nodeVersion: process.version,
        };

        fs.writeFileSync(
          buildInfoFile,
          JSON.stringify(serviceBuildInfo, null, 2)
        );
        this.log(
          `Build info saved successfully: commit ${effectiveCommit?.substring(0, 8) || 'unknown'}, version ${serviceBuildInfo.version}`
        );
        return;
      } catch (generateErr) {
        this.log(
          `Build info generation script failed: ${generateErr.message}`,
          'WARN'
        );
      }

      // Fallback to manual build info creation
      const buildInfo = {
        version: '0.1.0',
        gitCommit: currentCommit,
        buildTime: new Date().toISOString(),
        nodeVersion: process.version,
      };

      fs.writeFileSync(buildInfoFile, JSON.stringify(buildInfo, null, 2));
      this.log(
        `Fallback build info saved: commit ${currentCommit?.substring(0, 8) || 'unknown'}`
      );

      // Also create the public build info for consistency
      try {
        const publicDir = path.join(this.appRoot, 'public');
        const publicBuildInfoFile = path.join(publicDir, 'build-info.json');
        const publicBuildInfo = {
          version: buildInfo.version,
          buildTime: buildInfo.buildTime,
          gitCommit: currentCommit ? currentCommit.substring(0, 8) : null,
          gitBranch: null,
        };

        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(
          publicBuildInfoFile,
          JSON.stringify(publicBuildInfo, null, 2)
        );
        this.log('Public build info file updated');
      } catch (publicErr) {
        this.log(
          `Could not create public build info: ${publicErr.message}`,
          'WARN'
        );
      }
    } catch (err) {
      this.log(`Critical error saving build info: ${err.message}`, 'ERROR');
      throw err; // Re-throw to indicate build process failed
    }
  }

  async buildApplication() {
    try {
      this.log('Starting production build process...');

      // First, ensure dependencies are installed
      await this.ensureDependencies();

      // Then run the build
      return await this.runBuild();
    } catch (err) {
      this.log(`Build process failed: ${err.message}`, 'ERROR');
      throw err;
    }
  }

  async checkNodeWindows() {
    try {
      this.log('Checking for node-windows availability...');

      // First check if it's in local node_modules
      const localNodeWindows = path.join(
        this.appRoot,
        'node_modules',
        'node-windows'
      );
      if (fs.existsSync(localNodeWindows)) {
        this.log('node-windows found in local node_modules');
        return;
      }

      // Check if it's globally available
      const { spawn } = require('child_process');
      const checkGlobal = spawn('npm', ['list', '-g', 'node-windows'], {
        stdio: 'pipe',
        shell: true,
      });

      let output = '';
      checkGlobal.stdout.on('data', (data) => {
        output += data.toString();
      });

      const isGloballyInstalled = await new Promise((resolve) => {
        checkGlobal.on('close', (code) => {
          resolve(code === 0 && output.includes('node-windows'));
        });
      });

      if (isGloballyInstalled) {
        this.log('node-windows found globally');
        return;
      }

      // If not found, provide installation instructions
      this.log('node-windows not found globally or locally', 'WARN');
      this.log(
        'To install node-windows globally, run as Administrator:',
        'WARN'
      );
      this.log('npm install -g node-windows', 'WARN');
      this.log('Continuing with local installation via npm install...', 'WARN');
    } catch (err) {
      this.log(`Error checking node-windows: ${err.message}`, 'WARN');
      this.log('Continuing with dependency installation...', 'WARN');
    }
  }

  async ensureDependencies() {
    this.log('Ensuring dependencies are installed...');

    // Check if node-windows is globally available first
    await this.checkNodeWindows();

    // Check if node_modules exists and is recent
    const nodeModulesDir = path.join(this.appRoot, 'node_modules');
    const packageJsonFile = path.join(this.appRoot, 'package.json');

    if (fs.existsSync(nodeModulesDir) && fs.existsSync(packageJsonFile)) {
      const nodeModulesStat = fs.statSync(nodeModulesDir);
      const packageJsonStat = fs.statSync(packageJsonFile);

      if (nodeModulesStat.mtime > packageJsonStat.mtime) {
        this.log('Dependencies appear to be up to date. Skipping npm install.');
        return Promise.resolve(true);
      }
    }

    this.log('Running npm install to ensure dependencies are current...');

    return new Promise((resolve, reject) => {
      const installProcess = spawn('npm', ['install'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
      });

      let installOutput = '';
      let installError = '';

      installProcess.stdout.on('data', (data) => {
        const output = data.toString();
        installOutput += output;
        this.log(`Install: ${output.trim()}`);
      });

      installProcess.stderr.on('data', (data) => {
        const error = data.toString();
        installError += error;
        this.log(`Install Error: ${error.trim()}`, 'ERROR');
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          this.log('Dependencies installed successfully.');
          resolve(true);
        } else {
          this.log(`npm install failed with code ${code}`, 'ERROR');
          reject(new Error(`npm install failed: ${installError}`));
        }
      });
    });
  }

  async runBuild() {
    this.log('Starting production build...');

    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.appRoot,
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'production', // Use production mode for builds
        },
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
          this.log('Production build process completed successfully.');

          // Wait a brief moment for filesystem operations to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Save build info after successful build
          await this.saveBuildInfo();

          this.log('Build artifacts saved and ready.');
          resolve(true);
        } else {
          this.log(`Build failed with code ${code}`, 'ERROR');
          reject(new Error(`Build failed: ${buildError}`));
        }
      });
    });
  }

  async verifyBuildCompletion() {
    this.log('Verifying build completion...');

    const buildDir = path.join(this.appRoot, '.next');
    const requiredFiles = [
      'BUILD_ID',
      'static',
      'server/pages',
      'server/chunks',
      'package.json',
    ];

    // Wait for essential build files to exist
    const maxRetries = 30; // 30 seconds max wait
    let retryCount = 0;

    while (retryCount < maxRetries) {
      let allFilesExist = true;

      // Check if build directory exists
      if (!fs.existsSync(buildDir)) {
        this.log(`Build directory ${buildDir} does not exist, waiting...`);
        allFilesExist = false;
      } else {
        // Check for required files/directories
        for (const file of requiredFiles) {
          const filePath = path.join(buildDir, file);
          if (!fs.existsSync(filePath)) {
            this.log(`Required build file ${file} missing, waiting...`);
            allFilesExist = false;
            break;
          }
        }
      }

      if (allFilesExist) {
        // Additional check: ensure BUILD_ID is not empty
        const buildIdFile = path.join(buildDir, 'BUILD_ID');
        try {
          const buildId = fs.readFileSync(buildIdFile, 'utf8').trim();
          if (buildId.length === 0) {
            this.log('BUILD_ID is empty, waiting for build to complete...');
            allFilesExist = false;
          }
        } catch (err) {
          this.log(
            'BUILD_ID file unreadable, waiting for build to complete...'
          );
          allFilesExist = false;
        }
      }

      if (allFilesExist) {
        this.log('All required build files verified. Build is complete.');
        return;
      }

      // Wait 1 second before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retryCount++;
    }

    throw new Error(
      'Build verification failed: Required build files not found after 30 seconds'
    );
  }

  async verifyNextJsAvailable() {
    this.log('Verifying Next.js binary availability...');

    const nextPath = path.join(
      this.appRoot,
      'node_modules',
      'next',
      'dist',
      'bin',
      'next'
    );

    if (!fs.existsSync(nextPath)) {
      throw new Error(
        `Next.js binary not found at ${nextPath}. Please run 'npm install' first.`
      );
    }

    // Check if the file is readable
    try {
      fs.accessSync(nextPath, fs.constants.R_OK);
      this.log('Next.js binary verified and accessible.');
    } catch (err) {
      throw new Error(
        `Next.js binary at ${nextPath} is not readable: ${err.message}`
      );
    }
  }

  async runDatabaseMigrations() {
    return new Promise((resolve, reject) => {
      this.log('Running database migrations...');

      // Check if we should skip migrations based on environment
      if (process.env.SKIP_MIGRATIONS === 'true') {
        this.log('Skipping database migrations (SKIP_MIGRATIONS=true)');
        resolve();
        return;
      }

      const { spawn } = require('child_process');

      // First check migration status to see what needs to be applied
      this.log('Checking migration status...');
      const statusProcess = spawn('npx', ['prisma', 'migrate', 'status'], {
        cwd: this.appRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'development',
        },
      });

      let statusOutput = '';
      statusProcess.stdout.on('data', (data) => {
        const output = data.toString();
        statusOutput += output;
        output.split('\n').forEach((line) => {
          if (line.trim()) {
            this.log(`[MIGRATION STATUS] ${line.trim()}`);
          }
        });
      });

      statusProcess.stderr.on('data', (data) => {
        const output = data.toString();
        statusOutput += output;
        output.split('\n').forEach((line) => {
          if (line.trim()) {
            this.log(`[MIGRATION STATUS] ${line.trim()}`);
          }
        });
      });

      statusProcess.on('close', (code) => {
        this.log('Now applying any pending migrations...');
        this.log('Executing: npx prisma migrate deploy');

        const migrationProcess = spawn('npx', ['prisma', 'migrate', 'deploy'], {
          cwd: this.appRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true, // Use shell for Windows compatibility
          env: {
            ...process.env,
            NODE_ENV: 'development',
          },
        });

        let stdout = '';
        let stderr = '';

        migrationProcess.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          // Log migration output in real-time
          output.split('\n').forEach((line) => {
            if (line.trim()) {
              this.log(`[MIGRATION] ${line.trim()}`);
            }
          });
        });

        migrationProcess.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          // Log migration errors in real-time
          output.split('\n').forEach((line) => {
            if (line.trim()) {
              this.log(`[MIGRATION ERROR] ${line.trim()}`, 'WARN');
            }
          });
        });

        // Set a timeout for migrations (5 minutes max)
        const timeout = setTimeout(
          () => {
            migrationProcess.kill('SIGTERM');
            reject(new Error('Database migration timeout after 5 minutes'));
          },
          5 * 60 * 1000
        );

        migrationProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            this.log('✅ Database migrations completed successfully');
            this.log('Regenerating Prisma client...');

            // Generate Prisma client after successful migration
            const generateProcess = spawn('npx', ['prisma', 'generate'], {
              cwd: this.appRoot,
              stdio: ['ignore', 'pipe', 'pipe'],
              shell: true,
              env: {
                ...process.env,
                NODE_ENV: 'development',
              },
            });

            generateProcess.stdout.on('data', (data) => {
              const output = data.toString();
              output.split('\n').forEach((line) => {
                if (line.trim()) {
                  this.log(`[PRISMA GENERATE] ${line.trim()}`);
                }
              });
            });

            generateProcess.stderr.on('data', (data) => {
              const output = data.toString();
              output.split('\n').forEach((line) => {
                if (line.trim()) {
                  this.log(`[PRISMA GENERATE ERROR] ${line.trim()}`, 'WARN');
                }
              });
            });

            generateProcess.on('close', (generateCode) => {
              if (generateCode === 0) {
                this.log('✅ Prisma client regenerated successfully');

                // Seed admin user after successful Prisma client generation
                this.log('Seeding admin user...');
                const seedAdminProcess = spawn(
                  'node',
                  ['scripts/seed-admin.js'],
                  {
                    cwd: this.appRoot,
                    stdio: ['ignore', 'pipe', 'pipe'],
                    shell: true,
                  }
                );

                seedAdminProcess.stdout.on('data', (data) => {
                  const output = data.toString();
                  output.split('\n').forEach((line) => {
                    if (line.trim()) {
                      this.log(`[ADMIN SEED] ${line.trim()}`);
                    }
                  });
                });

                seedAdminProcess.stderr.on('data', (data) => {
                  const output = data.toString();
                  output.split('\n').forEach((line) => {
                    if (line.trim()) {
                      this.log(`[ADMIN SEED ERROR] ${line.trim()}`, 'WARN');
                    }
                  });
                });

                seedAdminProcess.on('close', (seedCode) => {
                  if (seedCode === 0) {
                    this.log('✅ Admin user seeded successfully');
                  } else {
                    this.log(
                      '⚠️ Admin seed completed with warnings (non-critical)',
                      'WARN'
                    );
                  }
                  // Always resolve, admin seed is non-critical
                  resolve();
                });

                seedAdminProcess.on('error', (err) => {
                  this.log(`⚠️ Admin seed error: ${err.message}`, 'WARN');
                  // Non-critical - continue anyway
                  resolve();
                });
              } else {
                this.log('❌ Prisma client generation failed', 'ERROR');
                reject(
                  new Error(`Prisma generate failed with code ${generateCode}`)
                );
              }
            });
          } else {
            // Check if this is a P3005 error (database not empty, needs baseline)
            if (
              stderr.includes('P3005') &&
              stderr.includes('migrate-baseline')
            ) {
              this.log(
                '⚠️  Database needs baselining for existing production data'
              );
              this.log('🔧 Attempting automatic baseline...');
              this.handleBaseline()
                .then(() => {
                  this.log('✅ Baseline completed, retrying migration...');
                  // Retry the migration after baseline
                  this.runDatabaseMigrations().then(resolve).catch(reject);
                })
                .catch((baselineError) => {
                  this.log('❌ Automatic baseline failed', 'ERROR');
                  reject(
                    new Error(`Baseline failed: ${baselineError.message}`)
                  );
                });
            } else {
              this.log('❌ Database migration failed', 'ERROR');
              reject(
                new Error(
                  `Database migration failed with code ${code}. STDERR: ${stderr}`
                )
              );
            }
          }
        });

        migrationProcess.on('error', (err) => {
          clearTimeout(timeout);
          const error = `Failed to run database migrations: ${err.message}`;
          this.log(error, 'ERROR');
          reject(new Error(error));
        });
      });
    });
  }

  async handleBaseline() {
    return new Promise((resolve, reject) => {
      this.log('Baselining existing database...');

      const { spawn } = require('child_process');

      // List of baseline migrations to mark as applied
      const baselineMigrations = [
        '20250706132952_init',
        '20250706215039_add_user_theme_preference',
        '20250707201336_add_last_login_at',
        '20250708004551_add_metadata_to_audit_log',
        '20250708005417_add_cascade_delete_to_audit_logs',
        '20250708120000_add_performance_indexes',
      ];

      let migrationIndex = 0;

      const resolveNextMigration = () => {
        if (migrationIndex >= baselineMigrations.length) {
          this.log('✅ All baseline migrations resolved');
          resolve();
          return;
        }

        const migration = baselineMigrations[migrationIndex];
        this.log(`Marking migration as applied: ${migration}`);

        const resolveProcess = spawn(
          'npx',
          ['prisma', 'migrate', 'resolve', '--applied', migration],
          {
            cwd: this.appRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
            env: {
              ...process.env,
              NODE_ENV: 'development',
            },
          }
        );

        resolveProcess.on('close', (code) => {
          if (code === 0) {
            this.log(`✅ ${migration} marked as applied`);
            migrationIndex++;
            resolveNextMigration();
          } else {
            reject(
              new Error(
                `Failed to resolve migration ${migration} with code ${code}`
              )
            );
          }
        });

        resolveProcess.on('error', (err) => {
          reject(
            new Error(
              `Failed to resolve migration ${migration}: ${err.message}`
            )
          );
        });
      };

      resolveNextMigration();
    });
  }

  async verifyNextJsStarted() {
    this.log('Verifying Next.js is listening on port...');

    const port = process.env.PORT || 3000;
    const maxRetries = 30; // 30 seconds max wait
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Try to connect to the port
        const net = require('net');
        const socket = new net.Socket();

        const isListening = await new Promise((resolve) => {
          socket.setTimeout(1000);

          socket.on('connect', () => {
            socket.destroy();
            resolve(true);
          });

          socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
          });

          socket.on('error', () => {
            socket.destroy();
            resolve(false);
          });

          socket.connect(port, 'localhost');
        });

        if (isListening) {
          this.log(`Next.js is successfully listening on port ${port}`);
          return;
        }

        this.log(
          `Port ${port} not ready yet, waiting... (${retryCount + 1}/30)`
        );
      } catch (err) {
        this.log(`Error checking port ${port}: ${err.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      retryCount++;
    }

    throw new Error(
      `Next.js failed to start listening on port ${port} after 30 seconds`
    );
  }

  async startApplication() {
    try {
      this.log('Starting Electricity Tokens Tracker service (Hybrid Mode)...');

      // Check if a rebuild is needed BEFORE doing anything else
      const needsRebuild = await this.checkIfRebuildNeeded();

      if (needsRebuild) {
        this.log('Build is stale or missing. Rebuild required.', 'WARN');
        // Ensure we have a production build
        await this.ensureProductionBuild();

        // Additional verification that build is complete and ready
        await this.verifyBuildCompletion();
      } else {
        this.log('✅ Build is current. No rebuild needed.');
      }

      // Verify Next.js binary is available
      await this.verifyNextJsAvailable();

      // Run database migrations before starting the application
      await this.runDatabaseMigrations();

      this.log(
        'Production build and database verified. Starting Next.js application directly...'
      );

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
          NODE_ENV: 'production', // Match the build environment for consistent cookie behavior
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
          // Extra: If error looks like a JSON parse error, log possible file suspects
          if (error.includes('Unexpected token') && error.includes('JSON')) {
            this.log(
              '⚠️  JSON parse error detected. Possible corrupted or empty JSON file.',
              'ERROR'
            );
            this.log(
              'Check .next/build-info.json, public/build-info.json, package.json, and any cache/config files for corruption.',
              'ERROR'
            );
            this.log(
              'You can delete .next and re-run npm run build to regenerate.',
              'ERROR'
            );
          }
        }
      });

      // Wait a moment for Next.js to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify Next.js actually started by checking if it's listening
      await this.verifyNextJsStarted();

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
        `🚀 SERVICE STARTUP COMPLETE: Next.js process started with PID ${this.appProcess.pid} and verified listening on port ${process.env.PORT || 3000}. Starting built-in health monitoring...`
      );

      // Start built-in health monitoring
      this.startHealthMonitoring();
    } catch (err) {
      this.log(`Failed to start service: ${err.message}`, 'ERROR');
      process.exit(1);
    }
  }

  // Built-in health monitoring methods
  startHealthMonitoring() {
    if (this.isHealthMonitoring) {
      return;
    }

    this.isHealthMonitoring = true;

    // Wait 5 minutes (300 seconds) after service starts before beginning health checks
    // This gives Next.js plenty of time to:
    // - Complete initialization
    // - Load all modules
    // - Establish database connections
    // - Build runtime caches
    // - Stabilize all services
    const initialDelay = 300000; // 5 minutes in milliseconds

    this.log(
      `🏥 Health monitoring will begin in ${initialDelay / 1000} seconds (${initialDelay / 60000} minutes)`
    );
    this.log(
      `   This delay ensures Next.js is fully initialized before health checks start`
    );

    // Perform initial health check after 5 minutes
    setTimeout(() => {
      this.log(
        `🏥 Starting built-in health monitoring (check every ${this.healthCheckFrequency / 1000}s)`
      );

      // Perform initial check with retry logic
      this.performInitialHealthCheck();

      // Set up recurring health checks
      this.healthCheckInterval = setInterval(() => {
        this.performHealthCheck();
      }, this.healthCheckFrequency);
    }, initialDelay);
  }

  async performInitialHealthCheck() {
    // The first health check after the delay should be more forgiving
    // Try multiple times before considering it a failure
    const maxInitialRetries = 5;
    let retryCount = 0;

    while (retryCount < maxInitialRetries) {
      const isHealthy = await this.checkApplicationHealth();

      if (isHealthy) {
        this.log('✅ Initial health check passed - service is ready');
        this.consecutiveFailures = 0;
        return;
      }

      retryCount++;
      this.log(
        `⏳ Initial health check attempt ${retryCount}/${maxInitialRetries} failed, retrying in 10s...`,
        'WARN'
      );

      if (retryCount < maxInitialRetries) {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10s between retries
      }
    }

    // If all initial retries failed, start counting as regular failures
    this.consecutiveFailures = 1;
    this.log(
      `❌ Initial health check failed after ${maxInitialRetries} attempts (1/${this.maxConsecutiveFailures})`,
      'WARN'
    );
  }

  stopHealthMonitoring() {
    if (!this.isHealthMonitoring) {
      return;
    }

    this.isHealthMonitoring = false;
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.log('🛑 Stopped built-in health monitoring');
  }

  async performHealthCheck() {
    if (this.isShuttingDown) {
      return;
    }

    try {
      const isHealthy = await this.checkApplicationHealth();

      if (isHealthy) {
        // Reset failure counter on successful health check
        if (this.consecutiveFailures > 0) {
          this.log(
            `✅ Service recovered after ${this.consecutiveFailures} failures`
          );
          this.consecutiveFailures = 0;
        }
        // Only log occasionally to avoid log spam
        const now = Date.now();
        if (!this.lastHealthyLog || now - this.lastHealthyLog > 300000) {
          // 5 minutes
          this.log(`✅ Service is healthy (PID: ${this.appProcess?.pid})`);
          this.lastHealthyLog = now;
        }
      } else {
        this.consecutiveFailures++;
        this.log(
          `❌ Health check failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures})`,
          'WARN'
        );

        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          await this.handleUnhealthyService();
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.log(
        `❌ Health check error: ${error.message} (${this.consecutiveFailures}/${this.maxConsecutiveFailures})`,
        'ERROR'
      );

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        await this.handleUnhealthyService();
      }
    }
  }

  async checkApplicationHealth() {
    try {
      // Check 1: Verify the app process is still running
      if (!this.appProcess || this.appProcess.killed) {
        this.log('App process is not running', 'WARN');
        return false;
      }

      // Check 2: Verify port 3000 is listening
      const port = process.env.PORT || 3000;
      const isPortListening = await this.checkPortListening(port);
      if (!isPortListening) {
        this.log(`Port ${port} is not listening`, 'WARN');
        return false;
      }

      // Check 3: HTTP health endpoint check
      const httpHealthy = await this.checkHttpHealth();
      if (!httpHealthy) {
        this.log('HTTP health endpoint failed', 'WARN');
        return false;
      }

      return true;
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'WARN');
      return false;
    }
  }

  async checkPortListening(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();

      socket.setTimeout(2000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, 'localhost');
    });
  }

  async checkHttpHealth() {
    return new Promise((resolve) => {
      const port = process.env.PORT || 3000;
      const timeout = setTimeout(() => {
        this.log('HTTP health check timeout', 'WARN');
        resolve(false);
      }, 8000); // 8 second timeout (increased from 5)

      // Try curl first (more reliable) - use PUBLIC endpoint (no auth required)
      const { spawn } = require('child_process');
      const curlProcess = spawn(
        'curl',
        [
          '-f', // Fail on HTTP errors
          '-s', // Silent mode
          '-A', // User-Agent header to avoid middleware warnings
          'ElectricityTracker-HealthMonitor/1.0',
          '--connect-timeout',
          '5', // Increased from 3
          '--max-time',
          '8', // Increased from 5
          `http://localhost:${port}/api/health`,
        ],
        { stdio: 'pipe' }
      );

      let responseData = '';
      let errorData = '';

      curlProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      curlProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      curlProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          try {
            const healthData = JSON.parse(responseData);
            // Accept both 'healthy' and 'degraded' as passing
            // 'degraded' means DB issues but app is still responding
            const isHealthy =
              healthData.status === 'healthy' ||
              healthData.status === 'degraded';

            if (isHealthy) {
              // Only log status changes or periodically
              const now = Date.now();
              if (
                !this.lastHealthCheckLog ||
                now - this.lastHealthCheckLog > 300000
              ) {
                // 5 minutes
                this.log(
                  `✅ HTTP health check passed: ${healthData.status}`,
                  'INFO'
                );
                this.lastHealthCheckLog = now;
              }
            } else {
              this.log(
                `❌ HTTP health check failed: unexpected status ${healthData.status}`,
                'WARN'
              );
            }
            resolve(isHealthy);
          } catch (parseError) {
            this.log(
              `❌ HTTP health check failed: invalid JSON response: ${responseData.substring(0, 100)}`,
              'WARN'
            );
            resolve(false);
          }
        } else {
          this.log(
            `❌ HTTP health check failed: curl exit code ${code}${errorData ? ', error: ' + errorData.substring(0, 100) : ''}`,
            'WARN'
          );
          resolve(false);
        }
      });

      curlProcess.on('error', (err) => {
        clearTimeout(timeout);
        this.log(
          `❌ HTTP health check error: curl command failed: ${err.message}`,
          'WARN'
        );
        // If curl itself fails to execute, fallback to basic port check
        // Port check already passed, so assume healthy
        resolve(true);
      });
    });
  }

  async handleUnhealthyService() {
    const now = Date.now();

    // Check cooldown period to prevent restart loops
    if (now - this.lastRestartTime < this.restartCooldown) {
      const remainingCooldown = Math.round(
        (this.restartCooldown - (now - this.lastRestartTime)) / 1000
      );
      this.log(
        `⏳ Service restart on cooldown (${remainingCooldown}s remaining)`,
        'WARN'
      );
      return;
    }

    this.log('🔄 Service is unhealthy, initiating auto-restart...', 'WARN');
    this.lastRestartTime = now;
    this.consecutiveFailures = 0;

    try {
      // Stop health monitoring temporarily
      this.stopHealthMonitoring();

      // Kill the unhealthy app process
      if (this.appProcess && !this.appProcess.killed) {
        this.log('Terminating unhealthy app process...');
        this.appProcess.kill('SIGTERM');

        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (this.appProcess && !this.appProcess.killed) {
              this.log('Force killing app process...', 'WARN');
              this.appProcess.kill('SIGKILL');
            }
            resolve();
          }, 5000);

          if (this.appProcess) {
            this.appProcess.on('close', () => {
              clearTimeout(timeout);
              resolve();
            });
          } else {
            clearTimeout(timeout);
            resolve();
          }
        });
      }

      // Wait a moment before restart
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Restart the application
      this.log('🚀 Restarting application...');
      await this.startApplicationOnly();

      this.log('✅ Application restarted successfully');

      // Resume health monitoring
      this.startHealthMonitoring();
    } catch (error) {
      this.log(`❌ Auto-restart failed: ${error.message}`, 'ERROR');
      this.log(
        '🔄 Service will continue attempting restarts on next health check cycle'
      );

      // Resume health monitoring even if restart failed
      setTimeout(() => {
        this.startHealthMonitoring();
      }, 30000); // Resume monitoring in 30 seconds
    }
  }

  async startApplicationOnly() {
    // Start Next.js directly without all the build/migration checks
    // (those were already done during initial startup)
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
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: {
        ...process.env,
        // NODE_ENV: 'production', // Removed - let .env.local control it
        PORT: process.env.PORT || 3000,
      },
    });

    // Save the new PID
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
        this.log('Application process exited unexpectedly', 'WARN');
      }
    });

    this.appProcess.on('error', (err) => {
      this.log(`Failed to start Next.js process: ${err.message}`, 'ERROR');
    });

    // Wait for app to start listening
    await this.verifyNextJsStarted();
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    this.log(`Received ${signal}. Initiating graceful shutdown...`);

    // Stop health monitoring first
    this.stopHealthMonitoring();

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
