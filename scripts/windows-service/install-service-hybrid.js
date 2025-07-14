const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const config = require('./config');
const buildServiceExpectedName = require('./buildexpectedservicename');

class HybridServiceInstaller {
  constructor() {
    this.service = null;
    this.serviceName = config.name;
    this.daemonPath = path.join(path.dirname(config.script), 'daemon');
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check if running on Windows
    if (process.platform !== 'win32') {
      throw new Error(
        'This service installer only works on Windows platforms.'
      );
    }

    // Check if running as Administrator
    try {
      execSync('net session', { stdio: 'pipe' });
    } catch (err) {
      throw new Error(
        'Administrator privileges required. Please run this script as Administrator.'
      );
    }

    // Check if application files exist
    if (!fs.existsSync(config.appRoot)) {
      throw new Error(`Application directory not found: ${config.appRoot}`);
    }

    if (!fs.existsSync(config.script)) {
      throw new Error(`Service wrapper not found: ${config.script}`);
    }

    console.log('✅ Environment validation passed.');
  }

  async cleanupExisting() {
    console.log('🔍 Cleaning up any existing installations...');

    // Check Windows SCM first
    try {
      const result = execSync(
        `${config.commands.SC_COMMAND} query "${buildServiceExpectedName(this.serviceName)}"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        }
      );

      if (result.includes('SERVICE_NAME')) {
        console.log('🛑 Stopping existing Windows service...');
        try {
          execSync(
            `${config.commands.SC_COMMAND} stop "${buildServiceExpectedName(this.serviceName)}"`,
            {
              stdio: 'pipe',
            }
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (err) {
          console.log('ℹ️  Service was not running.');
        }

        console.log('🗑️  Removing existing Windows service...');
        execSync(
          `${config.commands.SC_COMMAND} delete "${buildServiceExpectedName(this.serviceName)}"`,
          {
            stdio: 'pipe',
          }
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.log('✅ No existing Windows service found.');
    }

    // Clean up node-windows files
    if (fs.existsSync(this.daemonPath)) {
      console.log('🗑️  Removing existing daemon files...');
      try {
        execSync(`rmdir /S /Q "${this.daemonPath}"`, { stdio: 'pipe' });
      } catch (err) {
        console.warn('⚠️  Could not remove daemon directory:', err.message);
      }
    }
  }

  async createNodeWindowsService() {
    console.log('📦 Creating node-windows service files...');

    return new Promise((resolve, reject) => {
      // Filter out undefined environment variables
      const cleanEnv = {};
      Object.entries(config.env).forEach(([key, value]) => {
        if (key !== undefined && key !== 'undefined' && value !== undefined) {
          cleanEnv[key] = String(value);
        }
      });

      this.service = new Service({
        name: this.serviceName,
        description: config.description,
        script: config.script,
        nodeOptions: config.nodeOptions || [],
        env: cleanEnv,
        workingDirectory: config.appRoot,
        allowServiceLogon: true,
        wait: 2,
        grow: 0.25,
        maxRetries: 5,
        maxRestarts: 3,
        abortOnError: false,
      });

      let installCompleted = false;

      // Set up timeout
      const installTimeout = setTimeout(() => {
        if (!installCompleted) {
          console.log('⚠️  Node-windows installation timeout.');
          installCompleted = true;
          resolve(); // Continue anyway
        }
      }, 30000);

      this.service.on('install', () => {
        if (!installCompleted) {
          console.log('✅ Node-windows service files created.');
          installCompleted = true;
          clearTimeout(installTimeout);
          resolve();
        }
      });

      this.service.on('error', (err) => {
        if (!installCompleted) {
          console.error('❌ Node-windows installation failed:', err);
          installCompleted = true;
          clearTimeout(installTimeout);
          reject(err);
        }
      });

      this.service.on('alreadyinstalled', () => {
        if (!installCompleted) {
          console.log('✅ Node-windows service files already exist.');
          installCompleted = true;
          clearTimeout(installTimeout);
          resolve();
        }
      });

      // Don't start the service automatically
      this.service.install();
    });
  }

  async registerWithWindows() {
    console.log(
      '🔧 Registering service with Windows Service Control Manager...'
    );

    // Wait for daemon files to be created
    let attempts = 0;
    while (attempts < 10) {
      if (fs.existsSync(this.daemonPath)) {
        break;
      }
      console.log(
        `⏳ Waiting for daemon files... (attempt ${attempts + 1}/10)`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    if (!fs.existsSync(this.daemonPath)) {
      throw new Error('Daemon directory was not created by node-windows');
    }

    const exePath = path.join(
      this.daemonPath,
      `${this.serviceName.toLowerCase()}.exe`
    );
    if (!fs.existsSync(exePath)) {
      throw new Error(`Service executable not found: ${exePath}`);
    }

    console.log(`📋 Service executable: ${exePath}`);

    // Register with Windows using sc.exe
    const createCommand = `${config.commands.SC_COMMAND} create "${buildServiceExpectedName(this.serviceName)}" binPath= "\\"${exePath}\\"" DisplayName= "${this.serviceName}" start= auto`;
    console.log('🔧 Registering with Windows SCM...');

    try {
      execSync(createCommand, { stdio: 'pipe' });
      console.log('✅ Service registered with Windows SCM.');
    } catch (err) {
      throw new Error(`Failed to register service: ${err.message}`);
    }

    // Set description
    try {
      execSync(
        `${config.commands.SC_COMMAND} description "${buildServiceExpectedName(this.serviceName)}" "${config.description}"`,
        { stdio: 'pipe' }
      );
      console.log('✅ Service description set.');
    } catch (err) {
      console.warn('⚠️  Could not set service description:', err.message);
    }

    // Configure service timeout to allow for Next.js startup
    try {
      // Set service to auto-start
      execSync(
        `${config.commands.SC_COMMAND} config "${buildServiceExpectedName(this.serviceName)}" start= auto`,
        {
          stdio: 'pipe',
        }
      );

      // Set a longer service timeout (120 seconds) via registry
      // This prevents Windows from killing the service during Next.js startup
      const timeoutMs = 120000; // 2 minutes
      execSync(
        `reg add "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control" /v ServicesPipeTimeout /t REG_DWORD /d ${timeoutMs} /f`,
        { stdio: 'pipe' }
      );

      console.log('✅ Service startup timeout configured (120 seconds).');
    } catch (err) {
      console.warn('⚠️  Could not configure service timeout:', err.message);
    }
  }

  async startService() {
    console.log('🚀 Starting Windows service...');

    try {
      execSync(
        `${config.commands.SC_COMMAND} start "${buildServiceExpectedName(this.serviceName)}"`,
        {
          stdio: 'pipe',
        }
      );
      console.log('✅ Service started successfully!');

      // Wait and verify
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const result = execSync(
        `${config.commands.SC_COMMAND} query "${buildServiceExpectedName(this.serviceName)}"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        }
      );

      if (result.includes('RUNNING')) {
        console.log('✅ Service is running.');
        return true;
      } else {
        console.log('⚠️  Service may not be running properly.');
        return false;
      }
    } catch (err) {
      console.error('❌ Failed to start service:', err.message);
      return false;
    }
  }

  async showServiceInfo() {
    console.log('\n📋 Service Installation Summary:');
    console.log('=====================================');
    console.log(`Service Name: ${this.serviceName}`);
    console.log(`Description: ${config.description}`);
    console.log(`Application: ${config.appRoot}`);
    console.log(`Port: ${config.env.PORT || 3000}`);
    console.log(`Logs: ${path.join(config.appRoot, 'logs', 'service.log')}`);
    console.log('\n🛠️  Service Management Commands:');
    console.log(`  Start:     sc.exe start "${this.serviceName}"`);
    console.log(`  Stop:      sc.exe stop "${this.serviceName}"`);
    console.log(`  Status:    sc.exe query "${this.serviceName}"`);
    console.log(`  Uninstall: npm run service:uninstall`);
    console.log('\n🌐 Application Access:');
    console.log(`  URL: ${config.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
  }

  async install() {
    try {
      console.log('🚀 Starting Hybrid Windows Service Installation');
      console.log('================================================\n');

      await this.validateEnvironment();
      await this.cleanupExisting();
      await this.createNodeWindowsService();
      await this.registerWithWindows();

      const started = await this.startService();

      await this.showServiceInfo();

      if (started) {
        console.log('\n🎉 Installation completed successfully!');
        console.log('The service is running and should appear in services.msc');
      } else {
        console.log(
          '\n⚠️  Installation completed but service may not be running properly.'
        );
        console.log('Check Windows Event Viewer for detailed error logs.');
      }
    } catch (err) {
      console.error('\n❌ Installation failed:', err.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('  - Ensure you are running as Administrator');
      console.error('  - Check that all application files are present');
      console.error('  - Verify environment variables are properly configured');
      console.error('  - Check Windows Event Viewer for detailed error logs');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const installer = new HybridServiceInstaller();
  installer.install();
}

module.exports = HybridServiceInstaller;
