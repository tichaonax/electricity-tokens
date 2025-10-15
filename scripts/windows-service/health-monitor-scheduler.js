const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class HealthMonitorScheduler {
  constructor() {
    this.taskName = 'ElectricityTrackerHealthMonitor';
    this.appRoot = path.resolve(__dirname, '../..');
    this.scriptPath = path.join(__dirname, 'health-monitor-service.js');
  }

  log(message) {
    console.log(`[HEALTH-SCHEDULER] ${message}`);
  }

  async isAdmin() {
    try {
      await execAsync('net session');
      return true;
    } catch {
      return false;
    }
  }

  async taskExists() {
    try {
      const { stdout } = await execAsync(
        `schtasks /query /tn "${this.taskName}" /fo LIST`
      );
      return stdout.includes(this.taskName);
    } catch {
      return false;
    }
  }

  async createTask() {
    try {
      this.log('Creating Windows scheduled task for health monitoring...');

      const nodeExePath = process.execPath;
      const taskCommand = `"${nodeExePath}" "${this.scriptPath}"`;

      // Create the task XML content
      const taskXml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>${new Date().toISOString()}</Date>
    <Author>Electricity Tracker</Author>
    <Description>Health monitor for Electricity Tokens Tracker service</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
    </BootTrigger>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>ServiceAccount</LogonType>
      <UserId>NT AUTHORITY\\SYSTEM</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
    <RestartPolicy>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartPolicy>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${nodeExePath}</Command>
      <Arguments>"${this.scriptPath}"</Arguments>
      <WorkingDirectory>${this.appRoot}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`;

      // Write task XML to temporary file
      const tempXmlPath = path.join(this.appRoot, 'temp-health-task.xml');
      const fs = require('fs');
      fs.writeFileSync(tempXmlPath, taskXml);

      try {
        // Create the task using the XML file
        await execAsync(
          `schtasks /create /tn "${this.taskName}" /xml "${tempXmlPath}" /f`
        );

        // Clean up temp file
        fs.unlinkSync(tempXmlPath);

        this.log('✅ Health monitor scheduled task created successfully');
        return true;
      } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempXmlPath)) {
          fs.unlinkSync(tempXmlPath);
        }
        throw error;
      }
    } catch (error) {
      this.log(`❌ Failed to create scheduled task: ${error.message}`);
      throw error;
    }
  }

  async startTask() {
    try {
      this.log('Starting health monitor task...');
      await execAsync(`schtasks /run /tn "${this.taskName}"`);
      this.log('✅ Health monitor task started');
      return true;
    } catch (error) {
      this.log(`❌ Failed to start task: ${error.message}`);
      throw error;
    }
  }

  async stopTask() {
    try {
      this.log('Stopping health monitor task...');
      await execAsync(`schtasks /end /tn "${this.taskName}"`);
      this.log('✅ Health monitor task stopped');
      return true;
    } catch (error) {
      // Task might not be running, which is OK
      this.log(`⚠️ Task stop result: ${error.message}`);
      return false;
    }
  }

  async deleteTask() {
    try {
      this.log('Deleting health monitor task...');
      await execAsync(`schtasks /delete /tn "${this.taskName}" /f`);
      this.log('✅ Health monitor task deleted');
      return true;
    } catch (error) {
      this.log(`❌ Failed to delete task: ${error.message}`);
      throw error;
    }
  }

  async getTaskStatus() {
    try {
      const { stdout } = await execAsync(
        `schtasks /query /tn "${this.taskName}" /fo LIST /v`
      );

      const lines = stdout.split('\n');
      const status = {};

      for (const line of lines) {
        if (line.includes('Status:')) {
          status.status = line.split('Status:')[1]?.trim();
        }
        if (line.includes('Last Run Time:')) {
          status.lastRun = line.split('Last Run Time:')[1]?.trim();
        }
        if (line.includes('Next Run Time:')) {
          status.nextRun = line.split('Next Run Time:')[1]?.trim();
        }
        if (line.includes('Last Result:')) {
          status.lastResult = line.split('Last Result:')[1]?.trim();
        }
      }

      return status;
    } catch (error) {
      return { error: error.message };
    }
  }

  async install() {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error(
          'Administrator privileges required to install health monitor'
        );
      }

      // Check if task already exists
      const exists = await this.taskExists();
      if (exists) {
        this.log('Health monitor task already exists, updating...');
        await this.deleteTask();
      }

      // Create new task
      await this.createTask();

      // Start the task
      await this.startTask();

      this.log('🎉 Health monitor installed and started successfully!');
      return true;
    } catch (error) {
      this.log(`❌ Installation failed: ${error.message}`);
      throw error;
    }
  }

  async uninstall() {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error(
          'Administrator privileges required to uninstall health monitor'
        );
      }

      const exists = await this.taskExists();
      if (!exists) {
        this.log('Health monitor task does not exist');
        return true;
      }

      await this.stopTask();
      await this.deleteTask();

      this.log('🎉 Health monitor uninstalled successfully!');
      return true;
    } catch (error) {
      this.log(`❌ Uninstallation failed: ${error.message}`);
      throw error;
    }
  }

  async status() {
    try {
      const exists = await this.taskExists();
      if (!exists) {
        console.log('❌ Health monitor task is not installed');
        return false;
      }

      const status = await this.getTaskStatus();

      console.log('🏥 Health Monitor Task Status:');
      console.log(`   Task Name: ${this.taskName}`);
      console.log(`   Status: ${status.status || 'Unknown'}`);
      console.log(`   Last Run: ${status.lastRun || 'Never'}`);
      console.log(`   Next Run: ${status.nextRun || 'Unknown'}`);
      console.log(`   Last Result: ${status.lastResult || 'Unknown'}`);

      if (status.error) {
        console.log(`   Error: ${status.error}`);
      }

      return true;
    } catch (error) {
      console.log(`❌ Failed to get status: ${error.message}`);
      return false;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  const scheduler = new HealthMonitorScheduler();

  try {
    switch (command) {
      case 'install':
        await scheduler.install();
        break;

      case 'uninstall':
        await scheduler.uninstall();
        break;

      case 'start':
        await scheduler.startTask();
        break;

      case 'stop':
        await scheduler.stopTask();
        break;

      case 'status':
        await scheduler.status();
        break;

      default:
        console.log(
          'Usage: node health-monitor-scheduler.js [install|uninstall|start|stop|status]'
        );
        console.log(
          '  install   - Install health monitor as Windows scheduled task'
        );
        console.log('  uninstall - Remove health monitor scheduled task');
        console.log('  start     - Start health monitor task');
        console.log('  stop      - Stop health monitor task');
        console.log('  status    - Show health monitor task status');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = HealthMonitorScheduler;
