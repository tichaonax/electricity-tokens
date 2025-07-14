const HybridServiceManager = require('./hybrid-service-manager');
const { promisify } = require('util');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const execAsync = promisify(exec);

async function getCurrentGitCommit() {
  try {
    return new Promise((resolve) => {
      const gitProcess = spawn('git', ['rev-parse', 'HEAD'], {
        cwd: process.cwd(),
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
          resolve(null);
        }
      });

      gitProcess.on('error', () => {
        resolve(null);
      });
    });
  } catch (err) {
    return null;
  }
}

async function displayBuildInfo() {
  try {
    const buildDir = path.join(process.cwd(), '.next');
    const buildInfoFile = path.join(buildDir, 'build-info.json');

    // Check if build exists
    if (!fs.existsSync(buildDir)) {
      console.log('   Build Directory: ❌ NOT FOUND');
      console.log('   Status: 🚨 No production build available');
      console.log(
        '   Action Required: Run `npm run build` or start service to auto-build'
      );
      return;
    }

    console.log('   Build Directory: ✅ EXISTS');

    // Check build info
    if (!fs.existsSync(buildInfoFile)) {
      console.log('   Build Info: ⚠️  NO BUILD TRACKING (legacy build)');
      console.log(
        '   Recommendation: Restart service to enable smart build detection'
      );
      return;
    }

    // Read build info
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoFile, 'utf8'));
    const currentCommit = await getCurrentGitCommit();

    console.log(
      `   Build Commit: ${buildInfo.gitCommit?.substring(0, 8) || 'unknown'}`
    );
    console.log(
      `   Build Time: ${new Date(buildInfo.buildTime).toLocaleString()}`
    );
    console.log(`   Node Version: ${buildInfo.nodeVersion}`);

    if (currentCommit) {
      console.log(`   Current Commit: ${currentCommit.substring(0, 8)}`);

      if (buildInfo.gitCommit === currentCommit) {
        console.log('   Status: ✅ BUILD UP TO DATE');
      } else {
        console.log('   Status: 🚨 BUILD IS STALE');
        console.log(
          '   Action Required: Restart service to auto-rebuild with latest changes'
        );
      }
    } else {
      console.log('   Current Commit: ❓ Unable to determine');
      console.log('   Status: ⚠️  Cannot verify build freshness');
    }
  } catch (err) {
    console.log(`   Error: ❌ ${err.message}`);
  }
}

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
      const { stdout } = await execAsync(
        `${config.commands.NETSTAT_COMMAND} -ano | findstr :3000`
      );
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
        `tasklist.exe /fi "imagename eq node.exe" /fo csv`
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
      const { stdout } = await execAsync(
        `${config.commands.SC_COMMAND} qc ${config.buildServiceExpectedName(config.name)}`
      );
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
      console.log(`      Try: npm run service:stop && npm run service:start`);
    } else if (!status.isRunning && status.hasOrphanedProcesses) {
      console.log(`   ⚠️  Orphaned processes detected. Clean them up:`);
      console.log(`      Run: npm run service:stop`);
    }

    if (!isAdmin) {
      console.log(
        `   🔑 Run as Administrator for full diagnostic capabilities`
      );
    }

    // Build Information
    console.log(`\n🔨 Build Status:`);
    await displayBuildInfo();

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
