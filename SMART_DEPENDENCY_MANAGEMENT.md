# Smart Dependency Management

## Overview

The comprehensive installer includes intelligent dependency management for **fresh installations** and **always reinstalls dependencies during updates** to ensure reliability.

## Important: Update Behavior

**For `npm run install:update`:**

- ✅ **ALWAYS runs `npm install`** to ensure dependencies are current
- ✅ Checks dependency status for logging/diagnostic purposes
- ✅ Critical after cleanups, corruption, or any system changes
- ✅ Ensures reliability over speed for production updates

**Why always reinstall during updates?**

- Dependencies may be corrupted even if `node_modules` exists
- Package cache issues may cause subtle bugs
- Network downloads from previous installs may be incomplete
- Better safe than sorry for production deployments
- The 2-5 minute cost is worth the reliability

## How It Works

### Detection Logic (Diagnostic Only for Updates)

The installer checks three conditions to provide diagnostic information:

1. **Missing `node_modules`**
   - If the `node_modules` directory doesn't exist
   - Common after cleanups or fresh checkouts

2. **Changed `package.json`**
   - Tracks SHA-256 hash of `package.json` file
   - Hash stored in `.install-config.json`
   - Detects any changes to dependencies

3. **No Previous Hash**
   - First-time installations
   - After `.install-config.json` is deleted
   - Ensures safe default behavior

### The Logic Flow

```javascript
// For install:update - ALWAYS install
async performUpdate() {
  // Check status for diagnostic purposes
  const needsDepsReinstall = await this.needsDependencyReinstall();

  if (needsDepsReinstall) {
    this.log('⚠️ Dependencies need reinstallation (missing or changed)');
  } else {
    this.log('ℹ️  Dependencies exist but will reinstall to ensure they are current');
  }

  // ALWAYS install - don't skip
  const steps = [
    {
      name: 'Update Dependencies',
      fn: () => this.installDependencies(),
      critical: true
    },
    // ... other steps
  ];
}
```

## Benefits

### Reliability (Primary Goal)

- **Always Current**: Dependencies are always reinstalled during updates
- **Corruption Recovery**: Fixes corrupted `node_modules` automatically
- **Cache Safety**: Bypasses npm cache issues
- **Production Safe**: Never risks incomplete dependencies

### Diagnostics

- **Clear Logging**: Shows dependency status and reasons for actions
- **Change Detection**: Tracks `package.json` changes via SHA-256
- **Missing Detection**: Identifies missing `node_modules`
- **Informed Decisions**: Logs explain what's happening and why

## Usage

### During Updates

```bash
npm run install:update
```

The installer will:

1. ✅ Check service status
2. ✅ Stop service if running
3. 📊 **Check dependencies** (diagnostic)
   - Shows: Missing, changed, or up-to-date
4. 📦 **ALWAYS runs `npm install`** (regardless of check)
   - Ensures reliability over speed
5. ✅ Update database
6. ✅ Rebuild application
7. ✅ Display restart instructions

### Log Messages

**Dependencies missing:**

```
⚠️ node_modules directory missing - reinstall required
⚠️ Dependencies need reinstallation (missing or changed)
📦 Installing Node.js dependencies...
```

**Dependencies changed:**

```
⚠️ package.json has changed - reinstall required
⚠️ Dependencies need reinstallation (missing or changed)
📦 Installing Node.js dependencies...
```

**Dependencies appear current:**

```
✅ Dependencies appear up-to-date
ℹ️  Dependencies exist but will reinstall to ensure they are current
📦 Installing Node.js dependencies...
```

**All cases → npm install runs to ensure reliability**

## Configuration File

The installer stores metadata in `.install-config.json`:

```json
{
  "installType": "fresh",
  "installDate": "2025-10-17T15:30:00.000Z",
  "version": "1.4.0",
  "hasService": true,
  "gitCommit": "abc123def456",
  "lastUpdate": "2025-10-17T16:45:00.000Z",
  "packageJsonHash": "9be9bac346ced88f61d655042142b9942a2ea4443943969ef7962b97b04eeb44"
}
```

### Fields Explained

- **`packageJsonHash`**: SHA-256 hash of `package.json` after successful install
- **`installType`**: "fresh" or "update"
- **`installDate`**: When first installed
- **`lastUpdate`**: When last updated
- **`version`**: App version from package.json
- **`gitCommit`**: Git commit SHA (if available)
- **`hasService`**: Whether Windows service is installed

## Scenarios

### Scenario 1: Normal Update

```bash
npm run install:update
# Dependencies check: ✅ appear up-to-date
# Action: Reinstalls anyway for reliability
# Result: Always runs npm install
# Reason: Ensures no corruption or cache issues
```

### Scenario 2: Dependency Added

```bash
# User runs: npm install new-package --save
# package.json changes → hash changes
npm run install:update
# Dependencies check: ⚠️ package.json changed
# Action: Reinstalls dependencies
# Result: New dependency properly installed
```

### Scenario 3: After Cleanup

```bash
# User deletes node_modules to save space
npm run install:update
# Dependencies check: ⚠️ node_modules missing
# Action: Reinstalls dependencies
# Result: Automatic recovery without manual intervention
```

### Scenario 4: After Build Failure

```bash
# Previous build failed, dependencies may be corrupted
npm run install:update
# Dependencies check: ✅ appear intact
# Action: Reinstalls anyway (corruption protection)
# Result: Fresh dependencies ensure successful build
```

## Edge Cases Handled

### 1. Corrupted node_modules

If `node_modules` exists but is corrupted:

- Manual fix: Delete `node_modules` and run update
- Automatic: Delete `.install-config.json` to force reinstall

### 2. Manual package.json edits

Any change to `package.json` (even whitespace) triggers reinstall:

- Safe: Ensures consistency between package.json and installed packages
- To avoid: Use `npm install` commands instead of manual edits

### 3. Hash comparison failure

If hash cannot be generated or compared:

- Fallback: Install dependencies (safe default)
- Logged as warning for debugging

### 4. Partial installations

If npm install fails midway:

- Next update will detect missing packages
- `node_modules` exists check may pass, but build will fail
- Build failure triggers recovery logic

## Technical Details

### Hash Algorithm

- **Algorithm**: SHA-256
- **Input**: Complete `package.json` file content (UTF-8)
- **Output**: 64-character hexadecimal string
- **Why SHA-256**: Fast, reliable, no collisions for practical use

### Performance Impact

- **Hash generation**: <10ms (negligible)
- **File system checks**: <50ms (negligible)
- **Config file I/O**: <20ms (negligible)
- **Total overhead**: <100ms vs 2-5 minutes saved

### Storage

- **Config file size**: ~200-300 bytes
- **Location**: `.install-config.json` in app root
- **Backup**: Should be in `.gitignore` (local state only)

## Future Enhancements

### Possible Improvements

1. **Lock file checking**: Also hash `package-lock.json`
2. **Dependency validation**: Verify installed versions match package.json
3. **Selective updates**: Only install new/changed packages (not full reinstall)
4. **Cache detection**: Check npm cache health
5. **Parallel checks**: Run detection checks concurrently

### Performance Metrics

Track and log:

- How often installs are skipped
- Time saved per skip
- False positive rate (skipped when shouldn't have)

## Maintenance

### When to Clear Config

Delete `.install-config.json` if:

- Installer behavior seems incorrect
- Want to force full reinstall
- Debugging dependency issues
- After major Node.js version upgrade

### When to Run Manual Install

Use `npm install` directly when:

- Adding a single package quickly
- Testing package compatibility
- Debugging package issues
- Working without the installer

## Related Files

- `scripts/comprehensive-installer.js` - Main implementation
- `.install-config.json` - State storage (not in git)
- `package.json` - Tracked for changes
- `package-lock.json` - Future: also track this

## Testing

### Test 1: Skip when unchanged

```bash
npm run install:update  # First time - installs
npm run install:update  # Second time - should skip
```

### Test 2: Detect package.json change

```bash
npm install lodash --save  # Modifies package.json
npm run install:update     # Should detect and reinstall
```

### Test 3: Detect missing node_modules

```bash
rm -rf node_modules       # Delete dependencies
npm run install:update    # Should detect and reinstall
```

### Test 4: First-time behavior

```bash
rm .install-config.json   # Remove config
npm run install:update    # Should install (safe default)
```

## Troubleshooting

**Issue**: Installer keeps reinstalling even though nothing changed

- **Check**: `.install-config.json` exists and has `packageJsonHash`
- **Fix**: Ensure file isn't being deleted between runs

**Issue**: Installer skipped install but build failed

- **Cause**: `node_modules` exists but is corrupted
- **Fix**: Delete `node_modules` manually and run update again

**Issue**: Hash mismatch on every run

- **Cause**: Something is modifying `package.json` during install
- **Check**: Look for scripts that auto-format or modify package.json
- **Fix**: Disable auto-formatting of package.json during install

## Summary

The installer prioritizes reliability over speed for updates:

- ✅ **Always Installs**: Updates always run `npm install` for safety
- ✅ **Diagnostic Checks**: Still tracks changes for logging and debugging
- ✅ **Corruption Safe**: Protects against corrupted/incomplete installs
- ✅ **Cache Safe**: Bypasses npm cache issues
- ✅ **Production Ready**: Reliability is more important than 2-5 minutes
- ✅ **Clear Logging**: Explains why and what's happening

**Philosophy:** For production deployments, spending 2-5 minutes on `npm install` is a small price to pay for the confidence that all dependencies are fresh, complete, and correct. The diagnostic checks provide valuable information but the installer always errs on the side of caution by reinstalling during updates.
