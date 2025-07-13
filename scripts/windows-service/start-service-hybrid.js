const HybridServiceManager = require('./hybrid-service-manager');

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

    // Get current status
    const status = await manager.getDetailedStatus();
    console.log(`📊 Current service status: ${status.serviceStatus}`);

    if (status.hasOrphanedProcesses) {
      console.log('⚠️  Detected orphaned processes. Cleaning up first...');
      await manager.forceKillServiceProcesses();
    }

    if (status.isRunning) {
      console.log('✅ Service is already running!');
      if (status.portPID) {
        console.log(
          `🌐 Application is accessible on port 3000 (PID: ${status.portPID})`
        );
      }
      return;
    }

    // Start the service
    await manager.startService();

    // Verify it's running
    const finalStatus = await manager.getDetailedStatus();
    if (finalStatus.isRunning) {
      console.log('✅ Service started successfully!');
      console.log(
        `🌐 Application should be accessible at http://localhost:3000`
      );

      if (finalStatus.portPID) {
        console.log(`📊 Next.js process PID: ${finalStatus.portPID}`);
      }

      if (finalStatus.serviceProcesses.length > 0) {
        console.log('📋 Service processes:');
        finalStatus.serviceProcesses.forEach((proc) => {
          console.log(`   - PID ${proc.pid}: ${proc.name} (${proc.memUsage})`);
        });
      }
    } else {
      throw new Error('Service start verification failed');
    }
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
