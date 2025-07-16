#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Generate build information including git commit, build time, and version
 * This script can be run during the build process to capture build metadata
 */
function generateBuildInfo() {
  const rootDir = path.resolve(__dirname, '..');
  const buildDir = path.join(rootDir, '.next');
  const buildInfoFile = path.join(buildDir, 'build-info.json');
  const packageJsonPath = path.join(rootDir, 'package.json');

  console.log('Generating build information...');

  // Get package.json version
  let version = '0.1.0';
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    version = packageJson.version || '0.1.0';
  } catch (err) {
    console.warn(`Could not read package.json version: ${err.message}`);
  }

  // Get git commit hash using multiple methods
  let gitCommit = null;
  try {
    // Method 1: Try git rev-parse HEAD command
    gitCommit = execSync('git rev-parse HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (err) {
    console.warn(`Git rev-parse failed: ${err.message}`);

    // Method 2: Try alternative git log command
    try {
      gitCommit = execSync('git log -1 --format="%H"', {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .trim()
        .replace(/"/g, '');
    } catch (err2) {
      console.warn(`Git log command also failed: ${err2.message}`);

      // Method 3: Try reading from .git/HEAD directly (like service wrapper does)
      try {
        const gitHeadFile = path.join(rootDir, '.git', 'HEAD');
        if (fs.existsSync(gitHeadFile)) {
          const headContent = fs.readFileSync(gitHeadFile, 'utf8').trim();
          if (headContent.startsWith('ref: ')) {
            // It's a reference, read the actual commit
            const refPath = headContent.substring(5);
            const refFile = path.join(rootDir, '.git', refPath);
            if (fs.existsSync(refFile)) {
              gitCommit = fs.readFileSync(refFile, 'utf8').trim();
              console.log(
                `Git commit from .git/HEAD reference: ${gitCommit.substring(0, 8)}`
              );
            }
          } else if (headContent.length === 40) {
            // It's a direct commit hash
            gitCommit = headContent;
            console.log(
              `Git commit from .git/HEAD direct: ${gitCommit.substring(0, 8)}`
            );
          }
        }
      } catch (err3) {
        console.warn(`Direct .git/HEAD read also failed: ${err3.message}`);
      }
    }
  }

  // Get git branch
  let gitBranch = null;
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (err) {
    console.warn(`Could not determine git branch: ${err.message}`);
  }

  // Create build info object
  const buildInfo = {
    version,
    gitCommit,
    gitBranch,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  // Ensure .next directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Write build info to file
  try {
    fs.writeFileSync(buildInfoFile, JSON.stringify(buildInfo, null, 2));
    console.log('✅ Build info generated successfully:');
    console.log(`   Version: ${version}`);
    console.log(
      `   Git Commit: ${gitCommit ? gitCommit.substring(0, 8) : 'unknown'}`
    );
    console.log(`   Git Branch: ${gitBranch || 'unknown'}`);
    console.log(`   Build Time: ${buildInfo.buildTime}`);
    console.log(`   File: ${buildInfoFile}`);
  } catch (err) {
    console.error(`❌ Error writing build info: ${err.message}`);
    process.exit(1);
  }

  // Also create a public version for client-side access
  const publicBuildInfo = {
    version,
    buildTime: buildInfo.buildTime,
    gitCommit: gitCommit ? gitCommit.substring(0, 8) : null,
    gitBranch,
  };

  const publicDir = path.join(rootDir, 'public');
  const publicBuildInfoFile = path.join(publicDir, 'build-info.json');

  try {
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(
      publicBuildInfoFile,
      JSON.stringify(publicBuildInfo, null, 2)
    );
    console.log(`✅ Public build info created: ${publicBuildInfoFile}`);
  } catch (err) {
    console.warn(`⚠️  Could not create public build info: ${err.message}`);
  }

  return buildInfo;
}

// Run if called directly
if (require.main === module) {
  generateBuildInfo();
}

module.exports = { generateBuildInfo };
