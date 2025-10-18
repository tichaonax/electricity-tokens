/**
 * Shared utility functions for Windows service management
 * Centralizes common service operations to avoid code duplication
 */

const HybridServiceManager = require('./hybrid-service-manager');

class ServiceUtils {
  constructor() {
    this.manager = new HybridServiceManager();
  }

  /**
   * Stop the Windows service and wait for it to fully stop
   * Uses the proven HybridServiceManager implementation
   *
   * @param {Function} logFn - Optional logging function
   * @returns {Promise<boolean>} - True if service stopped successfully
   */
  async stopServiceAndWait(logFn = console.log) {
    try {
      logFn('🛑 Stopping Windows service...');

      // Use the battle-tested stopService from HybridServiceManager
      // This handles:
      // - Correct sc.exe command (not PowerShell alias)
      // - Graceful stop with timeout
      // - Force kill if graceful stop fails
      // - Proper error handling for non-existent services
      await this.manager.stopService();

      // Additional wait to ensure file handles are released
      logFn('⏳ Waiting for file handles to release...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logFn('✅ Service stopped successfully');
      return true;
    } catch (error) {
      // Check if error is acceptable (service not installed)
      if (
        error.message.includes('not installed') ||
        error.message.includes('does not exist')
      ) {
        logFn('ℹ️  Service not found (may not be installed)');
        return true; // Not installed is OK
      }

      logFn(`❌ Failed to stop service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if the Windows service exists/is installed
   *
   * @param {Function} logFn - Optional logging function
   * @returns {Promise<boolean>} - True if service is installed
   */
  async isServiceInstalled(logFn = console.log) {
    try {
      const status = await this.manager.getServiceStatus();
      const isInstalled = status !== 'NOT_INSTALLED';

      if (isInstalled) {
        logFn(`✅ Service is installed (status: ${status})`);
      } else {
        logFn('ℹ️  Service is not installed');
      }

      return isInstalled;
    } catch (error) {
      logFn(`⚠️ Could not check service status: ${error.message}`);
      return false;
    }
  }

  /**
   * Get detailed service status information
   *
   * @returns {Promise<Object>} - Detailed status object
   */
  async getDetailedStatus() {
    return await this.manager.getDetailedStatus();
  }

  /**
   * Start the Windows service
   *
   * @param {Function} logFn - Optional logging function
   * @returns {Promise<boolean>} - True if service started successfully
   */
  async startService(logFn = console.log) {
    try {
      logFn('🚀 Starting Windows service...');
      await this.manager.startService();
      logFn('✅ Service started successfully');
      return true;
    } catch (error) {
      logFn(`❌ Failed to start service: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ServiceUtils();
