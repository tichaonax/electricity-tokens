# Service Utils Refactoring

## Problem
The comprehensive installer was directly calling Windows `sc` commands with multiple issues:

1. **Wrong Command**: Used `sc stop` instead of `sc.exe stop`
   - `sc` is a PowerShell alias for `Set-Content`
   - This caused the stop command to fail completely

2. **Code Duplication**: Service management logic was duplicated across multiple files
   - `comprehensive-installer.js` had its own implementation
   - `sync-restart-service.js` had another implementation
   - `hybrid-service-manager.js` had the correct, battle-tested implementation

3. **Hardcoded Service Name**: Service name was hardcoded as `"ElectricityTracker.exe"`
   - The actual service name is `"ElectricityTracker"` (without .exe)
   - The correct name is built dynamically using `buildServiceExpectedName()`

## Solution

### Created `scripts/windows-service/service-utils.js`
A shared utility module that centralizes all Windows service operations:

```javascript
const serviceUtils = require('./windows-service/service-utils');

// Stop service with proper error handling
await serviceUtils.stopServiceAndWait(logFunction);

// Check if service is installed
const isInstalled = await serviceUtils.isServiceInstalled(logFunction);

// Start service
await serviceUtils.startService(logFunction);

// Get detailed status
const status = await serviceUtils.getDetailedStatus();
```

### Key Features

1. **Uses `sc.exe` Explicitly**
   - Defined in `config.js` as `SC_COMMAND: 'sc.exe'`
   - Avoids PowerShell alias conflicts

2. **Dynamic Service Name Detection**
   - Uses `buildServiceExpectedName()` from config
   - Handles different service name formats automatically

3. **Robust Error Handling**
   - Graceful stop with timeout
   - Force kill if graceful stop fails
   - Proper handling of non-existent services
   - File handle release wait time

4. **Battle-Tested Implementation**
   - Delegates to `HybridServiceManager.stopService()`
   - This method is already proven in production
   - Handles edge cases (service not installed, already stopped, etc.)

### Updated Files

1. **`scripts/comprehensive-installer.js`**
   - Added `serviceUtils` import
   - Replaced `checkServiceExists()` to use `serviceUtils.isServiceInstalled()`
   - Replaced `stopServiceAndWait()` to use `serviceUtils.stopServiceAndWait()`
   - Removed 45 lines of duplicate/broken code

2. **`scripts/windows-service/service-utils.js`** (NEW)
   - Centralized service management utilities
   - Singleton pattern for easy import/use
   - Comprehensive JSDoc documentation

## Benefits

1. **Single Source of Truth**: All service operations go through one module
2. **No Code Duplication**: Service logic in one place, used everywhere
3. **Correct Commands**: Always uses `sc.exe`, never PowerShell aliases
4. **Easier Maintenance**: Fix bugs once, benefit everywhere
5. **Better Testing**: Can test service utils independently
6. **Consistent Logging**: Unified logging approach across all callers

## Migration Path

Any new code that needs to interact with the Windows service should:

```javascript
// ❌ DON'T DO THIS
await execAsync('sc stop "ServiceName"');

// ✅ DO THIS INSTEAD
const serviceUtils = require('./windows-service/service-utils');
await serviceUtils.stopServiceAndWait(this.log.bind(this));
```

## Future Improvements

Consider migrating these files to use `service-utils.js`:

- `scripts/windows-service/complete-service-setup.js`
- Any other scripts that directly call `sc.exe` or `taskkill.exe`
- Test suites that need to mock service operations

## Smart Dependency Management (Added)

The installer now intelligently detects when dependencies need to be reinstalled:

### Detection Logic

1. **Missing node_modules**: If the `node_modules` directory doesn't exist, dependencies are reinstalled
2. **Changed package.json**: Tracks SHA-256 hash of `package.json` and reinstalls if it changes
3. **First-time updates**: If no previous hash exists, dependencies are installed

### Benefits

- ✅ **Faster updates**: Skips dependency installation when package.json hasn't changed
- ✅ **Automatic recovery**: Detects missing node_modules (e.g., after cleanup)
- ✅ **Change detection**: Always reinstalls when dependencies are updated
- ✅ **Build safety**: Ensures dependencies are current before building

### Implementation

```javascript
// In performUpdate()
const needsDepsReinstall = await this.needsDependencyReinstall();

if (needsDepsReinstall) {
  // Install dependencies
} else {
  this.log('⏭️  Skipping dependency installation (no changes detected)');
}
```

The hash is saved in `.install-config.json` after successful installs for future comparison.

## Testing

The refactored code should be tested with:

```bash
# Test installer update workflow
npm run install:update

# Should now correctly:
# 1. Stop service using sc.exe (not PowerShell alias)
# 2. Wait for service to fully stop
# 3. Wait for file handles to release
# 4. Perform updates without EPERM errors
# 5. Complete successfully
```

## Related Files

- `scripts/windows-service/hybrid-service-manager.js` - Core service management
- `scripts/windows-service/config.js` - Service configuration and commands
- `scripts/windows-service/buildexpectedservicename.js` - Service name builder
- `scripts/windows-service/sync-restart-service.js` - Uses HybridServiceManager correctly
