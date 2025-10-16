const HybridServiceManager = require('./hybrid-service-manager');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const SERVICE_NAME = 'ElectricityTracker.exe';
const SC = process.env.SC_COMMAND || 'sc.exe';
const MAX_WAIT_TIME = 30000; // 30 seconds
const CHECK_INTERVAL = 1000; // 1 second

/**
 * Wait for service to reach RUNNING state
 * Windows services take time to start - they go through START_PENDING state
 */
async function waitForServiceRunning() {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    try {
      const { stdout } = await execAsync(`${SC} query ${SERVICE_NAME}`);

      if (stdout.includes('RUNNING')) {
        console.log('✅ Service fully started');
        return true;
      }

      if (stdout.includes('START_PENDING')) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`⏳ Waiting for service to start... (${elapsed}s)`);
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
        continue;
      }

      if (stdout.includes('STOPPED')) {
        throw new Error('Service stopped unexpectedly during startup');
      }
    } catch (error) {
      if (error.message.includes('stopped unexpectedly')) {
        throw error;
      }
      // Other errors during startup - wait and retry
    }

    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }

  throw new Error(
    `Service did not start within ${MAX_WAIT_TIME / 1000} seconds`
  );
}

async function startServiceHybrid() {
  const manager = new HybridServiceManager();

  try {
    console.log(
      '🚀 Starting Electricity Tokens Tracker service (Hybrid Mode)...'
    );

    // Check if user has admin privileges
    const isAdmin = await manager.isAdmin();
    if (!isAdmin) {
      console.error(
        '❌ Administrator privileges required to manage Windows services.'
      );
      console.log('💡 Please run this command as Administrator.');
      process.exit(1);
    }

    console.log('📊 Current service status: Checking...');

    // Get current status
    const status = await manager.getDetailedStatus();
    console.log(`📊 Current service status: ${status.serviceStatus}`);

    if (status.hasOrphanedProcesses) {
      console.log('⚠️  Detected orphaned processes that need cleanup:');
      status.orphanedPIDs?.forEach((pid) => {
        console.log(`   - PID ${pid}`);
      });
      console.log('Cleaning up orphaned processes...');
      await manager.forceKillServiceProcesses();
    }

    if (status.isRunning) {
      console.log('📊 Current service status: ALREADY RUNNING');
      console.log('✅ Service is already started!');
      console.log(
        '🌐 Application should be accessible at http://localhost:3000'
      );
      if (status.portPID) {
        console.log(`   Port 3000 PID: ${status.portPID}`);
      }
      return;
    }

    // Start the service
    console.log(
      `[${new Date().toISOString()}] [INFO] Starting service using sc.exe...`
    );

    const { stdout, stderr } = await execAsync(`${SC} start ${SERVICE_NAME}`);
    console.log(stdout);
    if (stderr) console.error(stderr);

    // Wait for service to actually start and reach RUNNING state
    console.log(
      `[${new Date().toISOString()}] [INFO] Waiting for service to fully start...`
    );
    await waitForServiceRunning();

    console.log(
      `[${new Date().toISOString()}] [INFO] Service started successfully`
    );
    console.log('🌐 Application should be accessible at http://localhost:3000');

    // Show process information
    try {
      console.log('📋 Service processes:');
      const { stdout: procOut } = await execAsync(
        'wmic process where "name=\'node.exe\'" get ProcessId,PageFileUsage,Name /format:csv | findstr node.exe'
      );
      const lines = procOut
        .split('\n')
        .filter((line) => line.trim() && line.includes('node.exe'));
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const name = parts[1];
          const memory = parts[2];
          const pid = parts[3];
          if (pid && pid.trim()) {
            console.log(`   - PID ${pid.trim()}: ${name} (${memory} K)`);
          }
        }
      }
    } catch (err) {
      // Ignore process listing errors
    }

    console.log('\n✅ Service start command completed');
  } catch (err) {
    console.error('❌ Failed to start service:', err.message);

    // Show diagnostic information
    try {
      const status = await manager.getDetailedStatus();
      console.log('\n🔍 Diagnostic Information:');
      console.log(`   Service Status: ${status.serviceStatus}`);
      console.log(`   Port 3000 PID: ${status.portPID || 'Not found'}`);
      console.log(`   Saved PID: ${status.savedPID || 'None'}`);
      console.log(`   Service Processes: ${status.serviceProcesses.length}`);

      console.log(
        '\n💡 Try running: npm run service:diagnose for more information'
      );
    } catch (diagErr) {
      console.log('Could not gather diagnostic information:', diagErr.message);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  startServiceHybrid().catch((err) => {
    console.error('❌ Start failed:', err.message);
    process.exit(1);
  });
}

module.exports = startServiceHybrid;
