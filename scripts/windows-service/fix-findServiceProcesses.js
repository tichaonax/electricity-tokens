const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

function getSavedPID() {
  // TODO: Implement logic to retrieve the saved PID if needed
  return null;
}

function log(msg, level = 'INFO') {
  console.log(`[${level}] ${msg}`);
}

async function findServiceProcesses() {
  try {
    const processes = [];

    // CRITICAL FIX: Use WMIC to get command line info to identify ONLY our service processes
    // This prevents killing other node-windows services (e.g., multi-business service)
    const { stdout } = await execAsync(
      `wmic process where "name='node.exe'" get ProcessId,CommandLine,Name /format:csv`
    );

    const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith('Node'));

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const commandLine = parts[1] || '';
        const name = parts[2] || '';
        const pid = parts[3] || '';

        // Only identify processes that belong to THIS service (electricity-tokens)
        // Check for unique identifiers in command line:
        // 1. electricity-app or electricity-tokens path (unique to this service)
        // 2. ElectricityTracker (service name)
        // 3. Saved PID match
        if (
          commandLine.includes('electricity-app') ||
          commandLine.includes('electricity-tokens') ||
          commandLine.includes('ElectricityTracker') ||
          parseInt(pid, 10) === getSavedPID()
        ) {
          processes.push({
            PID: pid.trim(),
            Name: name.trim(),
            CommandLine: commandLine.trim(),
            ImageName: name.trim(),
            SessionName: 'Services',
            MemUsage: 'N/A',
          });
        }
      }
    }

    log(`Found ${processes.length} electricity-tokens service processes`);
    return processes;
  } catch (err) {
    log(`Error finding service processes: ${err.message}`, 'WARN');
    return [];
  }
}

module.exports = { findServiceProcesses };
