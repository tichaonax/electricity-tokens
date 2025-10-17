const HybridServiceManager = require('./hybrid-service-manager');
const { promisify } = require('util');
const { exec } = require('child_process');
const config = require('./config');
const buildServiceExpectedName = require('./buildexpectedservicename');

const execAsync = promisify(exec);

class SyncServiceRestart {
  constructor() {
    this.manager = new HybridServiceManager();
    this.serviceName = buildServiceExpectedName(config.name);
    this.maxStopWaitTime = 30; // Maximum seconds to wait for stop
    this.maxStartWaitTime = 60; // Maximum seconds to wait for start
    this.healthCheckRetries = 10; // Health check attempts after start
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async waitForServiceToStop() {
    this.log('Waiting for service to stop completely...');

    let attempts = 0;
    const maxAttempts = this.maxStopWaitTime;

    while (attempts < maxAttempts) {
      try {
        const status = await this.manager.getServiceStatus();

        // Check if service is fully stopped
        if (status === 'STOPPED' || status === 'NOT_INSTALLED') {
          // Additional check: ensure no processes are listening on port 3000
          const portPID = await this.manager.findProcessByPort(3000);

          if (!portPID) {
            this.log('✅ Service is fully stopped and port 3000 is free');
            return true;
          } else {
            this.log(
              `⚠️  Service reports stopped but port 3000 still in use by PID ${portPID}`
            );
            // Force kill the remaining process
            await this.manager.killPID(portPID);
          }
        } else {
          this.log(`Service status: ${status} - continuing to wait...`);
        }

        // Wait 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        this.log(`Error checking service status: ${error.message}`, 'WARN');
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.log(
      `❌ Service did not stop within ${this.maxStopWaitTime} seconds`,
      'ERROR'
    );
    return false;
  }

  async waitForServiceToStart() {
    this.log('Waiting for service to start and become healthy...');

    let attempts = 0;
    const maxAttempts = this.maxStartWaitTime;

    while (attempts < maxAttempts) {
      try {
        const status = await this.manager.getServiceStatus();

        if (status === 'RUNNING') {
          // Service is running, now check if it's actually listening on port
          const portPID = await this.manager.findProcessByPort(3000);

          if (portPID) {
            this.log(
              `✅ Service is running and listening on port 3000 (PID: ${portPID})`
            );

            // Additional health check - try to hit the health endpoint
            const isHealthy = await this.performHealthCheck();
            if (isHealthy) {
              this.log('✅ Service passed health check - restart complete!');
              return true;
            } else {
              this.log(
                '⚠️  Service is running but health check failed, continuing to wait...'
              );
            }
          } else {
            this.log(
              'Service is running but not yet listening on port 3000...'
            );
          }
        } else {
          this.log(`Service status: ${status} - continuing to wait...`);
        }

        // Wait 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        this.log(`Error checking service status: ${error.message}`, 'WARN');
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.log(
      `❌ Service did not start properly within ${this.maxStartWaitTime} seconds`,
      'ERROR'
    );
    return false;
  }

  async performHealthCheck() {
    try {
      const { spawn } = require('child_process');

      // Use curl if available, otherwise use PowerShell
      return new Promise((resolve) => {
        // Try curl first - use PUBLIC endpoint (no auth required)
        const curlProcess = spawn(
          'curl',
          [
            '-f', // fail silently on HTTP errors
            '-s', // silent
            '--connect-timeout',
            '5',
            '--max-time',
            '10',
            'http://localhost:3000/api/health/public',
          ],
          { stdio: 'pipe' }
        );

        let success = false;

        curlProcess.on('close', (code) => {
          if (code === 0) {
            success = true;
          }
          resolve(success);
        });

        curlProcess.on('error', () => {
          // If curl fails, try PowerShell as fallback
          const psProcess = spawn(
            'powershell',
            [
              '-Command',
              `try { 
              $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health/public' -TimeoutSec 10 -UseBasicParsing; 
              if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } 
            } catch { exit 1 }`,
            ],
            { stdio: 'pipe' }
          );

          psProcess.on('close', (psCode) => {
            resolve(psCode === 0);
          });

          psProcess.on('error', () => {
            resolve(false);
          });
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          curlProcess.kill();
          if (!success) {
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'WARN');
      return false;
    }
  }

  async syncRestart() {
    try {
      this.log('🔄 Starting synchronous service restart...');

      // Check if user has admin privileges
      const isAdmin = await this.manager.isAdmin();
      if (!isAdmin) {
        throw new Error(
          'Administrator privileges required for service management'
        );
      }

      // Get initial service status
      const initialStatus = await this.manager.getDetailedStatus();
      this.log(`Initial service status: ${initialStatus.serviceStatus}`);

      // Step 1: Stop the service if it's running
      if (initialStatus.serviceStatus === 'RUNNING') {
        this.log('🛑 Stopping service...');
        await this.manager.stopService();
      } else if (initialStatus.hasOrphanedProcesses) {
        this.log('🧹 Cleaning up orphaned processes...');
        await this.manager.forceKillServiceProcesses();
      } else {
        this.log('ℹ️  Service is already stopped');
      }

      // Step 2: Wait for complete shutdown
      const stopSuccess = await this.waitForServiceToStop();
      if (!stopSuccess) {
        throw new Error('Service failed to stop properly');
      }

      // Step 3: Brief pause to ensure clean state
      this.log('⏳ Ensuring clean state...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 4: Start the service
      this.log('🚀 Starting service...');
      await this.manager.startService();

      // Step 5: Wait for complete startup and health check
      const startSuccess = await this.waitForServiceToStart();
      if (!startSuccess) {
        throw new Error(
          'Service failed to start properly or pass health checks'
        );
      }

      // Step 6: Final status verification
      const finalStatus = await this.manager.getDetailedStatus();
      this.log('📊 Final service status:');
      this.log(`   Windows Service: ${finalStatus.serviceStatus}`);
      this.log(`   Is Running: ${finalStatus.isRunning ? '✅ YES' : '❌ NO'}`);
      this.log(`   Port 3000 PID: ${finalStatus.portPID || 'Not found'}`);
      this.log(
        `   Orphaned Processes: ${finalStatus.hasOrphanedProcesses ? '⚠️  YES' : '✅ NO'}`
      );

      if (
        finalStatus.isRunning &&
        finalStatus.portPID &&
        !finalStatus.hasOrphanedProcesses
      ) {
        this.log('🎉 Synchronous restart completed successfully!');
        return true;
      } else {
        throw new Error(
          'Service restart completed but final state is not healthy'
        );
      }
    } catch (error) {
      this.log(`❌ Synchronous restart failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

async function performSyncRestart() {
  const restarter = new SyncServiceRestart();

  try {
    const success = await restarter.syncRestart();
    if (success) {
      console.log('\n✅ Service restart completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Service restart failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Service restart failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  performSyncRestart();
}

module.exports = SyncServiceRestart;
