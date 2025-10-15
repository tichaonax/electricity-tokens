const HybridServiceManager = require('./hybrid-service-manager');
const SyncServiceRestart = require('./sync-restart-service');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class HealthMonitor {
  constructor(options = {}) {
    this.manager = new HybridServiceManager();
    this.restarter = new SyncServiceRestart();

    // Configuration
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.healthTimeout = options.healthTimeout || 10000; // 10 seconds
    this.maxConsecutiveFailures = options.maxConsecutiveFailures || 3;
    this.restartCooldown = options.restartCooldown || 300000; // 5 minutes

    // State
    this.consecutiveFailures = 0;
    this.lastRestartTime = 0;
    this.isMonitoring = false;
    this.monitorInterval = null;

    // Logging
    this.logFile = path.join(process.cwd(), 'logs', 'health-monitor.log');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [HEALTH-MONITOR] [${level}] ${message}`;

    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to health monitor log:', err);
    }

    console.log(logMessage);
  }

  async checkServiceHealth() {
    try {
      // Step 1: Check if Windows service is running
      const serviceStatus = await this.manager.getServiceStatus();
      if (serviceStatus !== 'RUNNING') {
        this.log(`Service status check failed: ${serviceStatus}`, 'WARN');
        return {
          healthy: false,
          reason: `Windows service is ${serviceStatus}`,
          critical: true,
        };
      }

      // Step 2: Check if port 3000 is listening
      const portPID = await this.manager.findProcessByPort(3000);
      if (!portPID) {
        this.log('Port 3000 is not listening', 'WARN');
        return {
          healthy: false,
          reason: 'No process listening on port 3000',
          critical: true,
        };
      }

      // Step 3: Check HTTP health endpoint
      const httpHealthy = await this.checkHttpHealth();
      if (!httpHealthy.healthy) {
        this.log(`HTTP health check failed: ${httpHealthy.reason}`, 'WARN');
        return httpHealthy;
      }

      // All checks passed
      return {
        healthy: true,
        reason: 'All health checks passed',
        portPID: portPID,
      };
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'ERROR');
      return {
        healthy: false,
        reason: `Health check failed: ${error.message}`,
        critical: true,
      };
    }
  }

  async checkHttpHealth() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          healthy: false,
          reason: 'HTTP health check timeout',
          critical: false,
        });
      }, this.healthTimeout);

      // Try curl first
      const curlProcess = spawn(
        'curl',
        [
          '-f', // fail on HTTP errors
          '-s', // silent
          '--connect-timeout',
          '5',
          '--max-time',
          '8',
          'http://localhost:3000/api/health',
        ],
        { stdio: 'pipe' }
      );

      let responseData = '';

      curlProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      curlProcess.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          try {
            const healthData = JSON.parse(responseData);
            if (healthData.status === 'healthy') {
              resolve({
                healthy: true,
                reason: 'HTTP health endpoint returned healthy status',
                healthData: healthData,
              });
            } else {
              resolve({
                healthy: false,
                reason: `Health endpoint returned status: ${healthData.status}`,
                critical: false,
                healthData: healthData,
              });
            }
          } catch (parseError) {
            resolve({
              healthy: false,
              reason: 'Health endpoint returned invalid JSON',
              critical: false,
            });
          }
        } else {
          resolve({
            healthy: false,
            reason: `HTTP request failed with exit code ${code}`,
            critical: false,
          });
        }
      });

      curlProcess.on('error', () => {
        // Fallback to PowerShell if curl is not available
        clearTimeout(timeout);

        const psTimeout = setTimeout(() => {
          resolve({
            healthy: false,
            reason: 'PowerShell health check timeout',
            critical: false,
          });
        }, this.healthTimeout);

        const psProcess = spawn(
          'powershell',
          [
            '-Command',
            `try { 
            $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 8 -UseBasicParsing; 
            $response | ConvertTo-Json -Compress
          } catch { 
            Write-Output '{"error": "' + $_.Exception.Message + '"}' 
          }`,
          ],
          { stdio: 'pipe' }
        );

        let psResponseData = '';

        psProcess.stdout.on('data', (data) => {
          psResponseData += data.toString();
        });

        psProcess.on('close', (psCode) => {
          clearTimeout(psTimeout);

          try {
            const healthData = JSON.parse(psResponseData.trim());
            if (healthData.error) {
              resolve({
                healthy: false,
                reason: `PowerShell health check failed: ${healthData.error}`,
                critical: false,
              });
            } else if (healthData.status === 'healthy') {
              resolve({
                healthy: true,
                reason:
                  'HTTP health endpoint returned healthy status (PowerShell)',
                healthData: healthData,
              });
            } else {
              resolve({
                healthy: false,
                reason: `Health endpoint returned status: ${healthData.status} (PowerShell)`,
                critical: false,
                healthData: healthData,
              });
            }
          } catch (parseError) {
            resolve({
              healthy: false,
              reason: 'PowerShell health check returned invalid response',
              critical: false,
            });
          }
        });

        psProcess.on('error', () => {
          clearTimeout(psTimeout);
          resolve({
            healthy: false,
            reason: 'Both curl and PowerShell health checks failed',
            critical: true,
          });
        });
      });
    });
  }

  async handleUnhealthyService(healthResult) {
    this.consecutiveFailures++;
    this.log(
      `Service unhealthy (${this.consecutiveFailures}/${this.maxConsecutiveFailures}): ${healthResult.reason}`,
      'WARN'
    );

    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      const now = Date.now();
      const timeSinceLastRestart = now - this.lastRestartTime;

      if (timeSinceLastRestart < this.restartCooldown) {
        const remainingCooldown = Math.ceil(
          (this.restartCooldown - timeSinceLastRestart) / 1000
        );
        this.log(
          `Service restart needed but still in cooldown period (${remainingCooldown}s remaining)`,
          'WARN'
        );
        return false;
      }

      try {
        this.log(
          '🚨 CRITICAL: Attempting automatic service restart due to health failures...',
          'ERROR'
        );
        this.lastRestartTime = now;
        this.consecutiveFailures = 0; // Reset counter before restart attempt

        // Perform synchronous restart
        await this.restarter.syncRestart();

        this.log('✅ Automatic service restart completed successfully', 'INFO');
        return true;
      } catch (restartError) {
        this.log(
          `❌ Automatic service restart failed: ${restartError.message}`,
          'ERROR'
        );
        this.log('🚨 MANUAL INTERVENTION REQUIRED', 'ERROR');
        return false;
      }
    }

    return false;
  }

  async performHealthCheck() {
    try {
      const healthResult = await this.checkServiceHealth();

      if (healthResult.healthy) {
        // Reset failure counter on successful health check
        if (this.consecutiveFailures > 0) {
          this.log(
            `✅ Service recovered after ${this.consecutiveFailures} failures`,
            'INFO'
          );
          this.consecutiveFailures = 0;
        } else {
          // Only log every 10th success to avoid log spam
          const now = Date.now();
          if (!this.lastSuccessLog || now - this.lastSuccessLog > 300000) {
            // 5 minutes
            this.log(
              `✅ Service is healthy (PID: ${healthResult.portPID})`,
              'INFO'
            );
            this.lastSuccessLog = now;
          }
        }
      } else {
        await this.handleUnhealthyService(healthResult);
      }
    } catch (error) {
      this.log(`Health monitoring error: ${error.message}`, 'ERROR');
      this.consecutiveFailures++;
    }
  }

  start() {
    if (this.isMonitoring) {
      this.log('Health monitor is already running', 'WARN');
      return;
    }

    this.isMonitoring = true;
    this.log(
      `🏥 Starting health monitor (check interval: ${this.checkInterval / 1000}s, max failures: ${this.maxConsecutiveFailures})`,
      'INFO'
    );

    // Perform initial health check immediately
    this.performHealthCheck();

    // Set up recurring health checks
    this.monitorInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);

    // Handle process termination
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  stop() {
    if (!this.isMonitoring) {
      return;
    }

    this.log('🛑 Stopping health monitor...', 'INFO');
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  async getMonitorStatus() {
    const serviceStatus = await this.manager.getDetailedStatus();

    return {
      isMonitoring: this.isMonitoring,
      consecutiveFailures: this.consecutiveFailures,
      maxConsecutiveFailures: this.maxConsecutiveFailures,
      lastRestartTime: this.lastRestartTime,
      checkInterval: this.checkInterval,
      serviceStatus: serviceStatus,
    };
  }
}

// Command line interface
async function runHealthMonitor() {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';

  switch (command) {
    case 'start':
      {
        const monitor = new HealthMonitor();
        monitor.start();

        // Keep the process alive
        process.on('SIGTERM', () => {
          monitor.stop();
          process.exit(0);
        });

        process.on('SIGINT', () => {
          monitor.stop();
          process.exit(0);
        });

        // Keep the main process running
        setInterval(() => {
          // Health monitoring runs in the background
        }, 60000);
      }
      break;

    case 'status':
      {
        const monitor = new HealthMonitor();
        const status = await monitor.getMonitorStatus();

        console.log('🏥 Health Monitor Status:');
        console.log(
          `   Monitoring: ${status.isMonitoring ? '✅ Active' : '❌ Inactive'}`
        );
        console.log(
          `   Consecutive Failures: ${status.consecutiveFailures}/${status.maxConsecutiveFailures}`
        );
        console.log(`   Check Interval: ${status.checkInterval / 1000}s`);
        console.log(`   Service Status: ${status.serviceStatus.serviceStatus}`);
        console.log(
          `   Port 3000 PID: ${status.serviceStatus.portPID || 'Not found'}`
        );

        if (status.lastRestartTime > 0) {
          const lastRestart = new Date(status.lastRestartTime);
          console.log(`   Last Auto-Restart: ${lastRestart.toLocaleString()}`);
        }
      }
      break;

    case 'check':
      {
        const monitor = new HealthMonitor();
        const healthResult = await monitor.checkServiceHealth();

        console.log('🏥 Health Check Result:');
        console.log(
          `   Status: ${healthResult.healthy ? '✅ Healthy' : '❌ Unhealthy'}`
        );
        console.log(`   Reason: ${healthResult.reason}`);

        if (healthResult.portPID) {
          console.log(`   Port 3000 PID: ${healthResult.portPID}`);
        }

        process.exit(healthResult.healthy ? 0 : 1);
      }
      break;

    default:
      console.log('Usage: node health-monitor.js [start|status|check]');
      console.log('  start  - Start continuous health monitoring');
      console.log('  status - Show current monitor status');
      console.log('  check  - Perform a single health check');
      process.exit(1);
  }
}

if (require.main === module) {
  runHealthMonitor().catch((error) => {
    console.error('Health monitor failed:', error.message);
    process.exit(1);
  });
}

module.exports = HealthMonitor;
