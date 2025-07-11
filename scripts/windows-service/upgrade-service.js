const Service = require('node-windows').Service;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const config = require('./config');

class ServiceUpgrader {
  constructor() {
    this.serviceName = config.name;
    this.backupDir = path.join(config.appRoot, 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async validateEnvironment() {
    console.log('🔍 Validating upgrade environment...');

    // Check if running on Windows
    if (process.platform !== 'win32') {
      throw new Error('Service upgrade only works on Windows platforms.');
    }

    // Check if running as Administrator
    try {
      execSync('net session', { stdio: 'pipe' });
    } catch (err) {
      throw new Error(
        'Administrator privileges required. Please run this script as Administrator.'
      );
    }

    // Check if service exists
    const serviceExists = await this.checkServiceExists();
    if (!serviceExists) {
      throw new Error(
        `Service "${this.serviceName}" is not installed. Use npm run service:install instead.`
      );
    }

    console.log('✅ Environment validation passed.');
  }

  async checkServiceExists() {
    try {
      const result = execSync(`sc.exe query "${this.serviceName}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return result.includes('SERVICE_NAME');
    } catch (err) {
      return false;
    }
  }

  async getServiceStatus() {
    try {
      const result = execSync(`sc.exe query "${this.serviceName}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (result.includes('RUNNING')) return 'RUNNING';
      if (result.includes('STOPPED')) return 'STOPPED';
      if (result.includes('PENDING')) return 'PENDING';
      return 'UNKNOWN';
    } catch (err) {
      return 'NOT_INSTALLED';
    }
  }

  async createBackup() {
    console.log('📦 Creating backup of current application...');

    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const backupPath = path.join(this.backupDir, `backup-${this.timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });

    // Files and directories to backup
    const itemsToBackup = [
      'package.json',
      'package-lock.json',
      'next.config.js',
      '.env.local',
      '.env',
      'prisma',
      'src',
      'public',
      'scripts',
      'logs',
    ];

    for (const item of itemsToBackup) {
      const sourcePath = path.join(config.appRoot, item);
      const destPath = path.join(backupPath, item);

      if (fs.existsSync(sourcePath)) {
        try {
          const stats = fs.statSync(sourcePath);
          if (stats.isDirectory()) {
            execSync(`xcopy "${sourcePath}" "${destPath}" /E /I /Q`, {
              stdio: 'pipe',
            });
          } else {
            fs.copyFileSync(sourcePath, destPath);
          }
          console.log(`   ✅ Backed up: ${item}`);
        } catch (err) {
          console.warn(`   ⚠️  Could not backup ${item}: ${err.message}`);
        }
      }
    }

    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
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
        execSync(`sc.exe stop "${this.serviceName}"`, { stdio: 'pipe' });

        // Wait for service to stop (up to 30 seconds)
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

    console.warn(`⚠️  Service status: ${status}`);
    return false;
  }

  async updateApplication() {
    console.log('🔄 Updating application...');

    try {
      // Install/update dependencies
      console.log('📦 Installing dependencies...');
      execSync('npm install', {
        cwd: config.appRoot,
        stdio: 'inherit',
      });

      // Run database migrations if they exist
      const migrationScript = path.join(
        config.appRoot,
        'scripts',
        'migrate-db.js'
      );
      if (fs.existsSync(migrationScript)) {
        console.log('🗄️  Running database migrations...');
        execSync('node scripts/migrate-db.js', {
          cwd: config.appRoot,
          stdio: 'inherit',
        });
      }

      // Build the application
      console.log('🏗️  Building application...');
      execSync('npm run build', {
        cwd: config.appRoot,
        stdio: 'inherit',
      });

      console.log('✅ Application updated successfully.');
      return true;
    } catch (err) {
      console.error('❌ Application update failed:', err.message);
      return false;
    }
  }

  async startService() {
    console.log('🚀 Starting service...');

    try {
      execSync(`sc.exe start "${this.serviceName}"`, { stdio: 'pipe' });

      // Wait for service to start (up to 30 seconds)
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

  async verifyUpgrade() {
    console.log('🔍 Verifying upgrade...');

    // Check service status
    const status = await this.getServiceStatus();
    if (status !== 'RUNNING') {
      console.error(`❌ Service is not running. Status: ${status}`);
      return false;
    }

    // Wait a bit for the application to start
    console.log('⏳ Waiting for application to initialize...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check if application is responding
    try {
      const port = config.env.PORT || 3000;
      const testUrl = `http://localhost:${port}`;

      // Simple health check
      const { execSync: exec } = require('child_process');
      exec(
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

  async rollback(backupPath) {
    console.log('🔄 Rolling back to previous version...');

    try {
      // Stop service
      await this.stopService();

      // Restore from backup
      const itemsToRestore = fs.readdirSync(backupPath);
      for (const item of itemsToRestore) {
        const sourcePath = path.join(backupPath, item);
        const destPath = path.join(config.appRoot, item);

        try {
          if (fs.statSync(sourcePath).isDirectory()) {
            // Remove existing directory and restore
            if (fs.existsSync(destPath)) {
              execSync(`rmdir /S /Q "${destPath}"`, { stdio: 'pipe' });
            }
            execSync(`xcopy "${sourcePath}" "${destPath}" /E /I /Q`, {
              stdio: 'pipe',
            });
          } else {
            fs.copyFileSync(sourcePath, destPath);
          }
          console.log(`   ✅ Restored: ${item}`);
        } catch (err) {
          console.warn(`   ⚠️  Could not restore ${item}: ${err.message}`);
        }
      }

      // Reinstall dependencies
      console.log('📦 Reinstalling dependencies...');
      execSync('npm install', {
        cwd: config.appRoot,
        stdio: 'inherit',
      });

      // Rebuild application
      console.log('🏗️  Rebuilding application...');
      execSync('npm run build', {
        cwd: config.appRoot,
        stdio: 'inherit',
      });

      // Start service
      await this.startService();

      console.log('✅ Rollback completed successfully.');
      return true;
    } catch (err) {
      console.error('❌ Rollback failed:', err.message);
      return false;
    }
  }

  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');

    if (!fs.existsSync(this.backupDir)) {
      return;
    }

    try {
      const backups = fs
        .readdirSync(this.backupDir)
        .filter((name) => name.startsWith('backup-'))
        .map((name) => ({
          name,
          path: path.join(this.backupDir, name),
          created: fs.statSync(path.join(this.backupDir, name)).birthtime,
        }))
        .sort((a, b) => b.created - a.created);

      // Keep only the 5 most recent backups
      const backupsToDelete = backups.slice(5);

      for (const backup of backupsToDelete) {
        execSync(`rmdir /S /Q "${backup.path}"`, { stdio: 'pipe' });
        console.log(`   🗑️  Deleted old backup: ${backup.name}`);
      }

      if (backupsToDelete.length > 0) {
        console.log(`✅ Cleaned up ${backupsToDelete.length} old backups.`);
      } else {
        console.log('✅ No old backups to clean up.');
      }
    } catch (err) {
      console.warn('⚠️  Could not clean up old backups:', err.message);
    }
  }

  async showUpgradeInfo() {
    console.log('\n📋 Service Upgrade Summary:');
    console.log('=====================================');
    console.log(`Service Name: ${this.serviceName}`);
    console.log(`Application: ${config.appRoot}`);
    console.log(`Backup Location: ${this.backupDir}`);
    console.log(`Status: ${await this.getServiceStatus()}`);
    console.log(`Port: ${config.env.PORT || 3000}`);
    console.log(`URL: ${config.env.NEXTAUTH_URL || 'http://localhost:3000'}`);
    console.log('\n🛠️  Post-Upgrade Management:');
    console.log('  Check Status:  npm run service:status');
    console.log('  View Logs:     npm run service:diagnose');
    console.log('  Stop Service:  npm run service:stop');
    console.log('  Start Service: npm run service:start');
  }

  async upgrade() {
    let backupPath = null;

    try {
      console.log('🚀 Starting Service Upgrade Process');
      console.log('====================================\n');

      await this.validateEnvironment();

      const initialStatus = await this.getServiceStatus();
      console.log(`Current service status: ${initialStatus}\n`);

      // Create backup
      backupPath = await this.createBackup();

      // Stop service
      const stopped = await this.stopService();
      if (!stopped) {
        throw new Error('Failed to stop service properly');
      }

      // Update application
      const updated = await this.updateApplication();
      if (!updated) {
        throw new Error('Failed to update application');
      }

      // Start service
      const started = await this.startService();
      if (!started) {
        throw new Error('Failed to start service');
      }

      // Verify upgrade
      const verified = await this.verifyUpgrade();

      // Clean up old backups
      await this.cleanupOldBackups();

      await this.showUpgradeInfo();

      if (verified) {
        console.log('\n🎉 Service upgrade completed successfully!');
        console.log('The application is running and responding to requests.');
      } else {
        console.log('\n⚠️  Service upgrade completed but verification failed.');
        console.log('Please check the service status and logs manually.');
        console.log('\nIf there are issues, you can rollback using:');
        console.log(
          `  node scripts/windows-service/rollback-service.js "${backupPath}"`
        );
      }
    } catch (err) {
      console.error('\n❌ Upgrade failed:', err.message);

      if (backupPath) {
        console.log('\n🔄 Would you like to automatically rollback? (y/N)');
        console.log('Or manually rollback later using:');
        console.log(
          `  node scripts/windows-service/rollback-service.js "${backupPath}"`
        );
      }

      console.error('\n🔧 Troubleshooting:');
      console.error('  - Check Windows Event Viewer for detailed error logs');
      console.error('  - Verify environment variables are properly configured');
      console.error('  - Ensure database is accessible');
      console.error('  - Run: npm run service:diagnose');

      process.exit(1);
    }
  }
}

if (require.main === module) {
  const upgrader = new ServiceUpgrader();
  upgrader.upgrade();
}

module.exports = ServiceUpgrader;
