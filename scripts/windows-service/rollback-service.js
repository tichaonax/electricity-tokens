const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const config = require('./config');

class ServiceRollback {
  constructor(backupPath) {
    this.serviceName = config.name;
    this.backupPath = backupPath;
  }

  async validateBackup() {
    console.log('🔍 Validating backup...');

    if (!this.backupPath) {
      throw new Error('Backup path is required');
    }

    if (!fs.existsSync(this.backupPath)) {
      throw new Error(`Backup directory not found: ${this.backupPath}`);
    }

    // Check if backup contains essential files
    const requiredFiles = ['package.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(this.backupPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing from backup: ${file}`);
      }
    }

    console.log('✅ Backup validation passed.');
  }

  async getServiceStatus() {
    try {
      const result = execSync(
        `${config.commands.SC_COMMAND} query "${config.buildServiceExpectedName(this.serviceName)}"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        }
      );

      if (result.includes('RUNNING')) return 'RUNNING';
      if (result.includes('STOPPED')) return 'STOPPED';
      if (result.includes('PENDING')) return 'PENDING';
      return 'UNKNOWN';
    } catch (err) {
      return 'NOT_INSTALLED';
    }
  }

  async stopService() {
    console.log('🛑 Stopping service...');

    const status = await this.getServiceStatus();
    if (status === 'STOPPED') {
      console.log('✅ Service is already stopped.');
      return true;
    }

    if (status === 'RUNNING') {
      try {
        execSync(
          `${config.commands.SC_COMMAND} stop "${config.buildServiceExpectedName(this.serviceName)}"`,
          {
            stdio: 'pipe',
          }
        );

        // Wait for service to stop
        let attempts = 0;
        while (attempts < 15) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const currentStatus = await this.getServiceStatus();
          if (currentStatus === 'STOPPED') {
            console.log('✅ Service stopped successfully.');
            return true;
          }
          attempts++;
          console.log(`   ⏳ Waiting for service to stop... (${attempts}/15)`);
        }

        console.warn('⚠️  Service may not have stopped completely.');
        return false;
      } catch (err) {
        console.error(`❌ Failed to stop service: ${err.message}`);
        return false;
      }
    }

    return false;
  }

  async restoreFromBackup() {
    console.log('🔄 Restoring from backup...');

    try {
      const itemsToRestore = fs.readdirSync(this.backupPath);

      for (const item of itemsToRestore) {
        const sourcePath = path.join(this.backupPath, item);
        const destPath = path.join(config.appRoot, item);

        try {
          const stats = fs.statSync(sourcePath);

          if (stats.isDirectory()) {
            // Remove existing directory if it exists
            if (fs.existsSync(destPath)) {
              console.log(`   🗑️  Removing current: ${item}`);
              execSync(`rmdir /S /Q "${destPath}"`, { stdio: 'pipe' });
            }

            // Restore directory
            console.log(`   📁 Restoring directory: ${item}`);
            execSync(`xcopy "${sourcePath}" "${destPath}" /E /I /Q`, {
              stdio: 'pipe',
            });
          } else {
            // Restore file
            console.log(`   📄 Restoring file: ${item}`);
            fs.copyFileSync(sourcePath, destPath);
          }

          console.log(`   ✅ Restored: ${item}`);
        } catch (err) {
          console.warn(`   ⚠️  Could not restore ${item}: ${err.message}`);
        }
      }

      console.log('✅ Files restored from backup.');
      return true;
    } catch (err) {
      console.error('❌ Failed to restore from backup:', err.message);
      return false;
    }
  }

  async reinstallDependencies() {
    console.log('📦 Reinstalling dependencies...');

    try {
      // Clean install to ensure consistency
      const nodeModulesPath = path.join(config.appRoot, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log('🗑️  Removing existing node_modules...');
        execSync(`rmdir /S /Q "${nodeModulesPath}"`, { stdio: 'pipe' });
      }

      const packageLockPath = path.join(config.appRoot, 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
        console.log('🔄 Using package-lock.json for consistent install...');
      }

      try {
        execSync('npm install --no-audit --no-fund', {
          cwd: config.appRoot,
          stdio: 'inherit',
        });
      } catch (installErr) {
        console.warn(
          '⚠️  npm install had issues, trying with --ignore-scripts...'
        );
        execSync('npm install --no-audit --no-fund --ignore-scripts', {
          cwd: config.appRoot,
          stdio: 'inherit',
        });
        console.log('✅ Dependencies installed with --ignore-scripts');
      }

      console.log('✅ Dependencies reinstalled successfully.');
      return true;
    } catch (err) {
      console.error('❌ Failed to reinstall dependencies:', err.message);
      return false;
    }
  }

  async rebuildApplication() {
    console.log('🏗️  Rebuilding application...');

    try {
      execSync('npm run build', {
        cwd: config.appRoot,
        stdio: 'inherit',
      });

      console.log('✅ Application rebuilt successfully.');
      return true;
    } catch (err) {
      console.error('❌ Failed to rebuild application:', err.message);
      return false;
    }
  }

  async startService() {
    console.log('🚀 Starting service...');

    try {
      execSync(
        `${config.commands.SC_COMMAND} start "${config.buildServiceExpectedName(this.serviceName)}"`,
        {
          stdio: 'pipe',
        }
      );

      // Wait for service to start
      let attempts = 0;
      while (attempts < 15) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await this.getServiceStatus();
        if (status === 'RUNNING') {
          console.log('✅ Service started successfully.');
          return true;
        }
        attempts++;
        console.log(`   ⏳ Waiting for service to start... (${attempts}/15)`);
      }

      console.warn('⚠️  Service may not have started properly.');
      return false;
    } catch (err) {
      console.error(`❌ Failed to start service: ${err.message}`);
      return false;
    }
  }

  async verifyRollback() {
    console.log('🔍 Verifying rollback...');

    // Check service status
    const status = await this.getServiceStatus();
    if (status !== 'RUNNING') {
      console.error(`❌ Service is not running. Status: ${status}`);
      return false;
    }

    // Wait for application to initialize
    console.log('⏳ Waiting for application to initialize...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check if application is responding
    try {
      const port = config.env.PORT || 3000;
      const testUrl = `http://localhost:${port}`;

      execSync(
        `powershell -Command "Invoke-WebRequest -Uri '${testUrl}' -UseBasicParsing -TimeoutSec 30"`,
        {
          stdio: 'pipe',
          timeout: 35000,
        }
      );

      console.log('✅ Application is responding to requests.');
      return true;
    } catch (err) {
      console.warn(
        '⚠️  Application may not be responding yet. Check logs for details.'
      );
      return false;
    }
  }

  async showRollbackInfo() {
    console.log('\n📋 Service Rollback Summary:');
    console.log('====================================');
    console.log(`Service Name: ${this.serviceName}`);
    console.log(`Restored From: ${this.backupPath}`);
    console.log(`Application: ${config.appRoot}`);
    console.log(`Status: ${await this.getServiceStatus()}`);
    console.log(`Port: ${config.env.PORT || 3000}`);
    console.log(`URL: ${config.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
    console.log('\n🛠️  Post-Rollback Management:');
    console.log('  Check Status:  npm run service:status');
    console.log('  View Logs:     npm run service:diagnose');
    console.log('  Stop Service:  npm run service:stop');
    console.log('  Start Service: npm run service:start');
  }

  async rollback() {
    try {
      console.log('🔄 Starting Service Rollback Process');
      console.log('====================================\n');

      console.log(`Rolling back to: ${this.backupPath}\n`);

      await this.validateBackup();

      const initialStatus = await this.getServiceStatus();
      console.log(`Current service status: ${initialStatus}\n`);

      // Stop service
      const stopped = await this.stopService();
      if (!stopped) {
        throw new Error('Failed to stop service properly');
      }

      // Restore from backup
      const restored = await this.restoreFromBackup();
      if (!restored) {
        throw new Error('Failed to restore from backup');
      }

      // Reinstall dependencies
      const reinstalled = await this.reinstallDependencies();
      if (!reinstalled) {
        throw new Error('Failed to reinstall dependencies');
      }

      // Rebuild application
      const rebuilt = await this.rebuildApplication();
      if (!rebuilt) {
        throw new Error('Failed to rebuild application');
      }

      // Start service
      const started = await this.startService();
      if (!started) {
        throw new Error('Failed to start service');
      }

      // Verify rollback
      const verified = await this.verifyRollback();

      await this.showRollbackInfo();

      if (verified) {
        console.log('\n🎉 Service rollback completed successfully!');
        console.log(
          'The application has been restored to the previous version.'
        );
      } else {
        console.log(
          '\n⚠️  Service rollback completed but verification failed.'
        );
        console.log('Please check the service status and logs manually.');
      }
    } catch (err) {
      console.error('\n❌ Rollback failed:', err.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('  - Check Windows Event Viewer for detailed error logs');
      console.error('  - Verify backup files are intact');
      console.error('  - Ensure sufficient disk space');
      console.error('  - Run: npm run service:diagnose');

      process.exit(1);
    }
  }
}

if (require.main === module) {
  const backupPath = process.argv[2];

  if (!backupPath) {
    console.error('❌ Backup path is required');
    console.log('Usage: node rollback-service.js <backup-path>');
    console.log(
      'Example: node rollback-service.js "C:\\path\\to\\backup-2024-01-15T10-30-00"'
    );
    process.exit(1);
  }

  const rollback = new ServiceRollback(backupPath);
  rollback.rollback();
}

module.exports = ServiceRollback;
