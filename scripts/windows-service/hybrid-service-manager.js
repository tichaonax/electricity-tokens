const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const wincmd = require('node-windows');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

class HybridServiceManager {
  constructor() {
    this.serviceName = 'ElectricityTokensTracker';
    this.appRoot = path.resolve(__dirname, '../..');
    this.logFile = path.join(this.appRoot, 'logs', 'hybrid-service.log');
    this.pidFile = path.join(this.appRoot, 'logs', 'service.pid');

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
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }

    console.log(logMessage);
  }

  // Save PID for tracking
  savePID(pid) {
    try {
      fs.writeFileSync(this.pidFile, pid.toString());
      this.log(`Saved PID ${pid} to ${this.pidFile}`);
    } catch (err) {
      this.log(`Failed to save PID: ${err.message}`, 'ERROR');
    }
  }

  // Get saved PID
  getSavedPID() {
    try {
      if (fs.existsSync(this.pidFile)) {
        const pid = fs.readFileSync(this.pidFile, 'utf8').trim();
        return parseInt(pid, 10);
      }
    } catch (err) {
      this.log(`Failed to read PID file: ${err.message}`, 'WARN');
    }
    return null;
  }

  // Clear PID file
  clearPID() {
    try {
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
        this.log('Cleared PID file');
      }
    } catch (err) {
      this.log(`Failed to clear PID file: ${err.message}`, 'WARN');
    }
  }

  // Check if user is admin
  async isAdmin() {
    return new Promise((resolve) => {
      wincmd.isAdminUser((isAdmin) => {
        resolve(isAdmin);
      });
    });
  }

  // Get service status using sc.exe
  async getServiceStatus() {
    try {
      const { stdout } = await execAsync(`sc query "${this.serviceName}"`);

      if (stdout.includes('RUNNING')) return 'RUNNING';
      if (stdout.includes('STOPPED')) return 'STOPPED';
      if (stdout.includes('START_PENDING')) return 'START_PENDING';
      if (stdout.includes('STOP_PENDING')) return 'STOP_PENDING';

      return 'UNKNOWN';
    } catch (err) {
      if (err.message.includes('does not exist')) {
        return 'NOT_INSTALLED';
      }
      throw err;
    }
  }

  // Find processes related to our service
  async findServiceProcesses() {
    return new Promise((resolve) => {
      wincmd.list((processes) => {
        const serviceProcesses = processes.filter((proc) => {
          const imageName = proc.ImageName?.toLowerCase() || '';
          const windowTitle = proc.WindowTitle?.toLowerCase() || '';

          return (
            imageName === 'node.exe' &&
            (windowTitle.includes('next') ||
              windowTitle.includes('electricity') ||
              proc.PID === this.getSavedPID()?.toString())
          );
        });

        resolve(serviceProcesses);
      }, true); // verbose output
    });
  }

  // Find processes by port (Next.js typically runs on 3000)
  async findProcessByPort(port = 3000) {
    try {
      // Try PowerShell approach first (more reliable on modern Windows)
      try {
        const { stdout } = await execAsync(
          `powershell "Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object OwningProcess | Format-Table -HideTableHeaders"`
        );
        const lines = stdout.split('\n').filter((line) => line.trim());
        if (lines.length > 0) {
          const pid = parseInt(lines[0].trim(), 10);
          if (!isNaN(pid) && pid > 0) {
            return pid;
          }
        }
      } catch (psError) {
        // Fall back to netstat
        const { stdout } = await execAsync(`netstat -ano`);
        const lines = stdout.split('\n');

        for (const line of lines) {
          if (line.includes(`:${port} `) && line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              return parseInt(pid, 10);
            }
          }
        }
      }
    } catch (err) {
      this.log(
        `Could not find process on port ${port}: ${err.message}`,
        'WARN'
      );
    }
    return null;
  }

  // Start service using sc.exe
  async startService() {
    try {
      this.log('Starting service using sc.exe...');

      const status = await this.getServiceStatus();
      if (status === 'RUNNING') {
        this.log('Service is already running');
        return true;
      }

      if (status === 'NOT_INSTALLED') {
        throw new Error(
          'Service is not installed. Run npm run service:install first.'
        );
      }

      // Start the service
      await execAsync(`sc start "${this.serviceName}"`);

      // Wait for service to start and track PID
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const currentStatus = await this.getServiceStatus();
        if (currentStatus === 'RUNNING') {
          this.log('Service started successfully');

          // Try to find and save the actual Next.js process PID
          const pid = await this.findProcessByPort(3000);
          if (pid) {
            this.savePID(pid);
            this.log(`Found Next.js process PID: ${pid}`);
          }

          return true;
        }

        attempts++;
      }

      throw new Error('Service failed to start within timeout period');
    } catch (err) {
      this.log(`Failed to start service: ${err.message}`, 'ERROR');
      throw err;
    }
  }

  // Stop service with hybrid approach
  async stopService() {
    try {
      this.log('Stopping service using hybrid approach...');

      const status = await this.getServiceStatus();
      if (status === 'STOPPED') {
        this.log('Service is already stopped');
        this.clearPID();
        return true;
      }

      if (status === 'NOT_INSTALLED') {
        this.log('Service is not installed');
        return true;
      }

      // Step 1: Try graceful stop using sc.exe
      this.log('Attempting graceful stop...');
      try {
        await execAsync(`sc stop "${this.serviceName}"`);

        // Wait for graceful stop
        let attempts = 0;
        const maxAttempts = 10; // 10 seconds for graceful stop

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const currentStatus = await this.getServiceStatus();
          if (currentStatus === 'STOPPED') {
            this.log('Service stopped gracefully');
            this.clearPID();
            return true;
          }

          attempts++;
        }

        this.log('Graceful stop timed out, trying force kill...', 'WARN');
      } catch (err) {
        this.log(`Graceful stop failed: ${err.message}`, 'WARN');
      }

      // Step 2: Force kill processes if graceful stop failed
      await this.forceKillServiceProcesses();

      // Step 3: Verify service is stopped
      const finalStatus = await this.getServiceStatus();
      if (finalStatus === 'STOPPED') {
        this.log('Service stopped successfully (force killed)');
        this.clearPID();
        return true;
      }

      throw new Error('Failed to stop service even with force kill');
    } catch (err) {
      this.log(`Failed to stop service: ${err.message}`, 'ERROR');
      throw err;
    }
  }

  // Force kill all service-related processes
  async forceKillServiceProcesses() {
    this.log('Force killing service processes...');

    // Kill by saved PID first
    const savedPID = this.getSavedPID();
    if (savedPID) {
      await this.killPID(savedPID);
    }

    // Kill by port
    const portPID = await this.findProcessByPort(3000);
    if (portPID && portPID !== savedPID) {
      await this.killPID(portPID);
    }

    // Find and kill any remaining service processes
    const serviceProcesses = await this.findServiceProcesses();
    for (const proc of serviceProcesses) {
      const pid = parseInt(proc.PID, 10);
      if (pid && pid !== savedPID && pid !== portPID) {
        await this.killPID(pid);
      }
    }
  }

  // Kill process by PID using Windows taskkill command
  async killPID(pid) {
    try {
      // Ensure PID is a number
      const numericPID = typeof pid === 'number' ? pid : parseInt(pid, 10);

      if (isNaN(numericPID)) {
        this.log(`Invalid PID: ${pid} (type: ${typeof pid})`, 'ERROR');
        return;
      }

      this.log(`Attempting to kill PID ${numericPID}...`);

      // Use Windows taskkill command instead of node-windows kill
      // This approach is more reliable and doesn't have API compatibility issues
      try {
        await execAsync(`taskkill /PID ${numericPID} /F`);
        this.log(`Successfully killed PID ${numericPID}`);
      } catch (err) {
        // Check if the process was already terminated
        if (
          err.message.includes('not found') ||
          err.message.includes('not running')
        ) {
          this.log(`PID ${numericPID} was already terminated`);
        } else {
          this.log(`Failed to kill PID ${numericPID}: ${err.message}`, 'WARN');
        }
      }
    } catch (err) {
      this.log(`Error in killPID: ${err.message}`, 'ERROR');
    }
  }

  // Get detailed service status
  async getDetailedStatus() {
    const status = await this.getServiceStatus();
    const savedPID = this.getSavedPID();
    const portPID = await this.findProcessByPort(3000);
    const serviceProcesses = await this.findServiceProcesses();

    return {
      serviceStatus: status,
      savedPID,
      portPID,
      serviceProcesses: serviceProcesses.map((p) => ({
        pid: p.PID,
        name: p.ImageName,
        memUsage: p.MemUsage,
        windowTitle: p.WindowTitle,
      })),
      isRunning: status === 'RUNNING',
      hasOrphanedProcesses:
        (portPID && status !== 'RUNNING') || serviceProcesses.length > 0,
    };
  }
}

module.exports = HybridServiceManager;
