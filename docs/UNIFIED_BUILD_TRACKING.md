# Unified Build Tracking System

## Overview

This project uses a **unified build tracking system** that ensures all build workflows (service, git hooks, install scripts) can recognize each other's builds and avoid unnecessary rebuilds.

## Problem Solved

Previously, when different parts of the system built the application, they didn't mark the build completion in a consistent way:

- **Service** would check for builds and rebuild if it didn't recognize the build as current
- **Git hooks** would build but the service wouldn't recognize it
- **Install scripts** would build but the service would rebuild anyway

This led to unnecessary rebuilds and wasted time during service starts and deployments.

## How It Works

### Build Markers

When a build completes successfully, the system creates two tracking files:

1. **`.next/build-info.json`** - Contains build metadata:

   ```json
   {
     "version": "0.2.0",
     "gitCommit": "62756c905bd521c06e964f5dd683e67f6a02160d",
     "gitBranch": "main",
     "buildTime": "2025-11-10T14:45:31.667Z",
     "nodeVersion": "v20.15.0",
     "platform": "win32",
     "arch": "x64"
   }
   ```

2. **`.next/.build-complete`** - Build completion marker:
   ```json
   {
     "completedAt": "2025-11-10T14:45:31.669Z",
     "buildId": "-mTTIcEZOAaxv8pdcG846",
     "gitCommit": "62756c905bd521c06e964f5dd683e67f6a02160d"
   }
   ```

### Build Process Flow

```
1. npm run build
   ↓
2. prebuild: generate-build-info.js (creates initial build-info.json)
   ↓
3. next build (creates .next directory and BUILD_ID)
   ↓
4. postbuild: post-build.js (updates build-info.json and creates .build-complete)
   ↓
5. ✅ Build complete and tracked
```

### Service Build Check

When the service starts, it checks:

1. Does `.next` directory exist?
2. Does `BUILD_ID` file exist?
3. Does `.build-complete` marker exist?
4. Does current git commit match build commit?

If all checks pass, the service **skips the rebuild** and uses the existing build.

## Components

### Scripts

- **`scripts/generate-build-info.js`** - Generates build metadata (runs pre-build)
- **`scripts/post-build.js`** - Updates tracking after successful build (runs post-build)

### Package.json Scripts

```json
{
  "build": "node scripts/generate-build-info.js && next build && node scripts/post-build.js",
  "prebuild": "node scripts/generate-build-info.js",
  "postbuild": "node scripts/post-build.js"
}
```

### Workflows Using Unified Tracking

All these workflows now use the same `npm run build` command and benefit from unified tracking:

1. **Windows Service** (`scripts/windows-service/service-wrapper-hybrid.js`)
   - Checks for `.build-complete` marker
   - Skips rebuild if build is current

2. **Git Hooks**
   - `.githooks/post-checkout` - Builds when switching branches
   - `.githooks/post-merge` - Builds after merge/pull

3. **Install Scripts**
   - `scripts/comprehensive-installer.js` - Builds during installation/update
   - `npm run install:update` - Update workflow

## Benefits

1. **No Duplicate Builds**: Service recognizes builds from git hooks and install scripts
2. **Faster Service Starts**: Service skips rebuild when build is current
3. **Consistent Tracking**: All workflows use the same build tracking mechanism
4. **Clear Status**: Build completion marker makes it easy to verify build state

## Debugging

### Check Build Status

```bash
# Check if build is tracked
ls .next/.build-complete

# View build info
cat .next/build-info.json

# View build completion marker
cat .next/.build-complete
```

### Force Rebuild

If you need to force a rebuild:

```bash
# Delete build tracking files
rm -rf .next

# Run build
npm run build
```

### Verify Service Recognition

When the service starts, check logs for:

```
✅ Build is current. No rebuild needed.
```

Or if rebuild is needed:

```
No build completion marker found - rebuild required to create unified tracking
```

## Migration Notes

If you have an existing build from before this system was implemented:

1. The service will detect the missing `.build-complete` marker
2. It will perform one rebuild to create the marker
3. After that, all subsequent starts will recognize the build

## Technical Details

### Why Two Files?

- **`build-info.json`**: Contains comprehensive build metadata for debugging and display
- **`.build-complete`**: Simple marker file that proves build completed successfully

### Why Post-Build?

Running the tracking update AFTER the build ensures:

1. BUILD_ID exists (proves Next.js build completed)
2. Git commit is captured at the END of the build process
3. All build artifacts are in place before marking complete

### Service Integration

The service's `checkIfRebuildNeeded()` method now includes:

```javascript
// Check for build completion marker (unified build tracking)
if (!fs.existsSync(buildCompleteMarker)) {
  this.log(
    'No build completion marker found - rebuild required to create unified tracking'
  );
  return true;
}
```

This ensures the service always recognizes builds created by other workflows.
