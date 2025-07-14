const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

class TokenBrokerRestorer {
  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async checkAdminPrivileges() {
    const wincmd = require('node-windows');
    return new Promise((resolve) => {
      wincmd.isAdminUser((isAdmin) => {
        resolve(isAdmin);
      });
    });
  }

  async checkTokenBrokerStatus() {
    try {
      const { stdout } = await execAsync('sc.exe query TokenBroker');
      this.log('✅ TokenBroker service is running normally');
      this.log('Service details:');
      this.log(stdout);
      return true;
    } catch (err) {
      this.log('❌ TokenBroker service is missing or not running', 'ERROR');
      return false;
    }
  }

  async restoreTokenBroker() {
    this.log('🔧 Attempting to restore TokenBroker service...');
    this.log('');
    this.log(
      '💡 TokenBroker (Web Account Manager) is a Windows system service.'
    );
    this.log(
      '💡 If it was accidentally deleted, Windows may restore it automatically on reboot.'
    );
    this.log('');

    // Check admin privileges
    const isAdmin = await this.checkAdminPrivileges();
    if (!isAdmin) {
      this.log(
        '❌ Administrator privileges required. Please run as Administrator.'
      );
      return false;
    }

    // Check current status
    const exists = await this.checkTokenBrokerStatus();
    if (exists) {
      this.log('✅ TokenBroker service is already working. No action needed.');
      return true;
    }

    this.log('🔧 Attempting automatic restoration methods...');

    try {
      // Method 1: Try to start the service (might auto-recreate)
      this.log('Method 1: Attempting to start TokenBroker service...');
      try {
        await execAsync('sc.exe start TokenBroker');
        this.log('✅ TokenBroker service started successfully');
        return true;
      } catch (err) {
        this.log('❌ Could not start TokenBroker service');
      }

      // Method 2: Run Windows feature repair
      this.log('Method 2: Running Windows system file checker...');
      this.log('💡 This may take several minutes...');
      try {
        await execAsync('sfc /scannow', { timeout: 300000 }); // 5 minutes timeout
        this.log('✅ System file checker completed');
      } catch (err) {
        this.log('❌ System file checker failed or timed out');
      }

      // Check again after repair attempts
      const restored = await this.checkTokenBrokerStatus();
      if (restored) {
        this.log('✅ TokenBroker service has been restored successfully!');
        return true;
      }
    } catch (err) {
      this.log(`Error during restoration: ${err.message}`, 'ERROR');
    }

    // If all else fails, provide manual instructions
    this.log('');
    this.log('❌ Automatic restoration failed. Manual steps required:');
    this.log('');
    this.log('🔧 Manual Restoration Options:');
    this.log('');
    this.log('Option 1: Restart Windows');
    this.log(
      '   - Windows may automatically restore the TokenBroker service on reboot'
    );
    this.log('   - This is often the simplest solution');
    this.log('');
    this.log('Option 2: Run DISM repair');
    this.log('   - Open Command Prompt as Administrator');
    this.log('   - Run: DISM /Online /Cleanup-Image /RestoreHealth');
    this.log('   - Run: sfc /scannow');
    this.log('   - Restart Windows');
    this.log('');
    this.log('Option 3: Windows Update');
    this.log('   - Check for and install Windows Updates');
    this.log('   - Restart Windows');
    this.log('');
    this.log('Option 4: System Restore');
    this.log(
      '   - Use System Restore to go back to before the service was deleted'
    );
    this.log(
      '   - Control Panel > System > System Protection > System Restore'
    );
    this.log('');
    this.log(
      '💡 TokenBroker manages web account authentication (Microsoft accounts, etc.)'
    );
    this.log(
      '💡 Windows should restore it automatically, but manual intervention may be needed.'
    );

    return false;
  }
}

async function main() {
  const restorer = new TokenBrokerRestorer();

  console.log('🔧 TokenBroker Service Restoration Tool');
  console.log('=====================================');
  console.log('');
  console.log('This tool helps restore the Windows TokenBroker service');
  console.log(
    'if it was accidentally removed by our service management scripts.'
  );
  console.log('');

  try {
    await restorer.restoreTokenBroker();
  } catch (err) {
    console.error('❌ Restoration process failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TokenBrokerRestorer;
