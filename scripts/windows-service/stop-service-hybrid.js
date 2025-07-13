const HybridServiceManager = require('./hybrid-service-manager');

async function stopServiceHybrid() {
  const manager = new HybridServiceManager();

  try {
    console.log(
      '🛑 Stopping Electricity Tokens Tracker service (Hybrid Mode)...'
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

    // Get current status
    const status = await manager.getDetailedStatus();
    console.log(`📊 Current service status: ${status.serviceStatus}`);

    if (!status.isRunning && !status.hasOrphanedProcesses) {
      console.log(
        '✅ Service is already stopped and no orphaned processes found.'
      );
      return;
    }

    if (status.hasOrphanedProcesses) {
      console.log('⚠️  Detected orphaned processes that need cleanup:');
      status.serviceProcesses.forEach((proc) => {
        console.log(`   - PID ${proc.pid}: ${proc.name} (${proc.memUsage})`);
      });
      if (status.portPID) {
        console.log(`   - Port 3000 process: PID ${status.portPID}`);
      }
    }

    // Stop the service using hybrid approach
    await manager.stopService();

    // Verify it's stopped
    const finalStatus = await manager.getDetailedStatus();
    if (!finalStatus.isRunning && !finalStatus.hasOrphanedProcesses) {
      console.log('✅ Service stopped successfully!');
      console.log('🌐 Port 3000 is now available');
    } else {
      console.log('⚠️  Service stop completed with warnings:');

      if (finalStatus.isRunning) {
        console.log(
          `   - Service status: ${finalStatus.serviceStatus} (still running)`
        );
      }

      if (finalStatus.hasOrphanedProcesses) {
        console.log('   - Some processes may still be running:');
        finalStatus.serviceProcesses.forEach((proc) => {
          console.log(`     * PID ${proc.pid}: ${proc.name}`);
        });

        if (finalStatus.portPID) {
          console.log(`     * Port 3000: PID ${finalStatus.portPID}`);
        }

        console.log(
          '\n💡 You may need to manually kill these processes or restart your computer.'
        );
      }
    }
  } catch (err) {
    console.error('❌ Failed to stop service:', err.message);

    // Show diagnostic information
    try {
      const status = await manager.getDetailedStatus();
      console.log('\n🔍 Diagnostic Information:');
      console.log(`   Service Status: ${status.serviceStatus}`);
      console.log(`   Port 3000 PID: ${status.portPID || 'Not found'}`);
      console.log(`   Saved PID: ${status.savedPID || 'None'}`);
      console.log(`   Service Processes: ${status.serviceProcesses.length}`);

      if (status.serviceProcesses.length > 0) {
        console.log('   Running Processes:');
        status.serviceProcesses.forEach((proc) => {
          console.log(
            `     - PID ${proc.pid}: ${proc.name} (${proc.memUsage})`
          );
        });
      }

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
  stopServiceHybrid().catch((err) => {
    console.error('❌ Stop failed:', err.message);
    process.exit(1);
  });
}

module.exports = stopServiceHybrid;
