const HybridServiceManager = require('./hybrid-service-manager');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

async function diagnoseService() {
  const manager = new HybridServiceManager();

  try {
    console.log('🔍 Electricity Tokens Tracker Service Diagnostic Report');
    console.log('='.repeat(60));

    // Check admin privileges
    const isAdmin = await manager.isAdmin();
    console.log(`\n👤 User Privileges:`);
    console.log(`   Administrator: ${isAdmin ? '✅ YES' : '❌ NO'}`);

    if (!isAdmin) {
      console.log(
        '   ⚠️  Some diagnostic features require administrator privileges'
      );
    }

    // Get detailed service status
    const status = await manager.getDetailedStatus();

    console.log(`\n🔧 Service Status:`);
    console.log(`   Windows Service: ${status.serviceStatus}`);
    console.log(`   Is Running: ${status.isRunning ? '✅ YES' : '❌ NO'}`);
    console.log(
      `   Has Orphaned Processes: ${status.hasOrphanedProcesses ? '⚠️  YES' : '✅ NO'}`
    );

    console.log(`\n📊 Process Information:`);
    console.log(`   Saved PID: ${status.savedPID || 'None'}`);
    console.log(`   Port 3000 PID: ${status.portPID || 'Not found'}`);
    console.log(`   Service Processes: ${status.serviceProcesses.length}`);

    if (status.serviceProcesses.length > 0) {
      console.log(`\n📋 Running Service Processes:`);
      status.serviceProcesses.forEach((proc) => {
        console.log(`   - PID ${proc.pid}: ${proc.name} (${proc.memUsage})`);
        if (proc.windowTitle && proc.windowTitle !== 'N/A') {
          console.log(`     Window: ${proc.windowTitle}`);
        }
      });
    }

    // Check port 3000 specifically
    try {
      const { stdout } = await execAsync('netstat -ano | findstr :3000');
      console.log(`\n🌐 Port 3000 Status:`);
      const lines = stdout.split('\n').filter((line) => line.trim());

      if (lines.length > 0) {
        lines.forEach((line) => {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            console.log(`   ✅ LISTENING - PID ${pid}`);
          } else if (line.includes('ESTABLISHED')) {
            console.log(`   🔗 ${line.trim()}`);
          }
        });
      } else {
        console.log(`   ❌ No processes listening on port 3000`);
      }
    } catch (err) {
      console.log(`\n🌐 Port 3000 Status: ❌ Could not check (${err.message})`);
    }

    // Check for zombie processes
    try {
      const { stdout } = await execAsync(
        'tasklist /fi "imagename eq node.exe" /fo csv'
      );
      const lines = stdout
        .split('\n')
        .slice(1)
        .filter((line) => line.trim());

      console.log(`\n🧟 All Node.js Processes:`);
      if (lines.length > 0) {
        lines.forEach((line) => {
          const parts = line.split(',').map((part) => part.replace(/"/g, ''));
          if (parts.length >= 2) {
            const [name, pid, sessionName, session, memUsage] = parts;
            console.log(`   - PID ${pid}: ${memUsage || 'Unknown'} memory`);
          }
        });
      } else {
        console.log(`   ✅ No Node.js processes found`);
      }
    } catch (err) {
      console.log(
        `\n🧟 Node.js Processes: ❌ Could not check (${err.message})`
      );
    }

    // Service configuration check
    console.log(`\n⚙️  Service Configuration:`);
    try {
      const { stdout } = await execAsync(`sc qc "ElectricityTokensTracker"`);
      const lines = stdout.split('\n');

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          trimmed.includes('BINARY_PATH_NAME') ||
          trimmed.includes('START_TYPE') ||
          trimmed.includes('SERVICE_START_NAME')
        ) {
          console.log(`   ${trimmed}`);
        }
      });
    } catch (err) {
      console.log(`   ❌ Service not installed or access denied`);
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`);

    if (!status.isRunning && !status.hasOrphanedProcesses) {
      console.log(`   ✅ Service is properly stopped. Ready to start.`);
    } else if (status.isRunning && status.portPID) {
      console.log(`   ✅ Service is running normally.`);
    } else if (status.isRunning && !status.portPID) {
      console.log(`   ⚠️  Service is running but not listening on port 3000.`);
      console.log(
        `      Try: npm run service:stop-hybrid && npm run service:start-hybrid`
      );
    } else if (!status.isRunning && status.hasOrphanedProcesses) {
      console.log(`   ⚠️  Orphaned processes detected. Clean them up:`);
      console.log(`      Run: npm run service:stop-hybrid`);
    }

    if (!isAdmin) {
      console.log(
        `   🔑 Run as Administrator for full diagnostic capabilities`
      );
    }

    console.log(`\n📝 Log Files:`);
    console.log(`   Hybrid Service Log: logs/hybrid-service.log`);
    console.log(`   PID File: logs/service.pid`);
    console.log(`   Standard Service Log: logs/service.log`);
  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  diagnoseService().catch((err) => {
    console.error('❌ Diagnostic failed:', err.message);
    process.exit(1);
  });
}

module.exports = diagnoseService;
