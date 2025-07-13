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

  // Get git commit hash
  let gitCommit = null;
  try {
    // Try multiple approaches to get git commit
    gitCommit = execSync('git rev-parse HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (err) {
    console.warn(`Could not determine git commit: ${err.message}`);

    // Try alternative approach
    try {
      gitCommit = execSync('git log -1 --format="%H"', {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .trim()
        .replace(/"/g, '');
    } catch (err2) {
      console.warn(`Alternative git approach also failed: ${err2.message}`);
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
