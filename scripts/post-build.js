#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { generateBuildInfo } = require('./generate-build-info');

/**
 * Post-build script that ensures build info is updated AFTER build completion
 * This creates a unified build tracking mechanism used by:
 * - npm run build
 * - Git hooks (post-checkout, post-merge)
 * - Service wrapper
 * - Install scripts
 */

function postBuild() {
  console.log('');
  console.log('='.repeat(60));
  console.log('POST-BUILD: Updating build tracking information...');
  console.log('='.repeat(60));

  const rootDir = path.resolve(__dirname, '..');
  const buildDir = path.join(rootDir, '.next');
  const buildIdFile = path.join(buildDir, 'BUILD_ID');

  // Verify that the build actually completed successfully
  if (!fs.existsSync(buildDir)) {
    console.error('❌ ERROR: .next directory does not exist');
    console.error('   Build may have failed. Skipping build info update.');
    process.exit(1);
  }

  if (!fs.existsSync(buildIdFile)) {
    console.error('❌ ERROR: BUILD_ID file does not exist');
    console.error('   Build may not have completed successfully.');
    process.exit(1);
  }

  try {
    const buildId = fs.readFileSync(buildIdFile, 'utf8').trim();
    if (!buildId) {
      console.error('❌ ERROR: BUILD_ID is empty');
      process.exit(1);
    }
    console.log(`✅ Build verification passed (BUILD_ID: ${buildId})`);
  } catch (err) {
    console.error(`❌ ERROR: Could not read BUILD_ID: ${err.message}`);
    process.exit(1);
  }

  // Generate and save build info AFTER successful build
  console.log('');
  console.log('Regenerating build info with post-build commit hash...');
  const buildInfo = generateBuildInfo();

  if (!buildInfo || !buildInfo.gitCommit) {
    console.warn(
      '⚠️  WARNING: Build info generated but git commit may be unknown'
    );
  }

  // Create a marker file to indicate post-build completed
  const markerFile = path.join(buildDir, '.build-complete');
  const markerData = {
    completedAt: new Date().toISOString(),
    buildId: fs.readFileSync(buildIdFile, 'utf8').trim(),
    gitCommit: buildInfo?.gitCommit || 'unknown',
  };

  try {
    fs.writeFileSync(markerFile, JSON.stringify(markerData, null, 2));
    console.log(`✅ Build completion marker created: ${markerFile}`);
  } catch (err) {
    console.warn(`⚠️  Could not create build marker: ${err.message}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ POST-BUILD: Build tracking updated successfully');
  console.log('   All workflows will now recognize this build');
  console.log('='.repeat(60));
  console.log('');
}

// Run if called directly
if (require.main === module) {
  try {
    postBuild();
  } catch (err) {
    console.error(`❌ Post-build script failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

module.exports = { postBuild };
