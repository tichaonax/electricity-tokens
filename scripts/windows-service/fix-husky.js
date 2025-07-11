const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function fixHuskySetup() {
  console.log('🔧 Fixing Husky setup for Windows service deployment...');

  const appRoot = path.resolve(__dirname, '../..');

  try {
    // Check if .husky directory exists
    const huskyDir = path.join(appRoot, '.husky');
    if (!fs.existsSync(huskyDir)) {
      console.log('📁 Creating .husky directory...');
      fs.mkdirSync(huskyDir, { recursive: true });
    }

    // Install husky specifically
    console.log('📦 Installing husky...');
    execSync('npm install husky --save-dev --no-audit', {
      cwd: appRoot,
      stdio: 'inherit',
    });

    // Initialize husky
    console.log('🔄 Initializing husky...');
    try {
      execSync('npx husky install', {
        cwd: appRoot,
        stdio: 'inherit',
      });
    } catch (err) {
      console.warn('⚠️  Husky install command failed, but continuing...');
    }

    // Create pre-commit hook if it doesn't exist
    const preCommitPath = path.join(huskyDir, 'pre-commit');
    if (!fs.existsSync(preCommitPath)) {
      console.log('📝 Creating pre-commit hook...');
      fs.writeFileSync(
        preCommitPath,
        '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx lint-staged\n'
      );

      // Make it executable (chmod +x equivalent)
      try {
        execSync(`icacls "${preCommitPath}" /grant Everyone:F`, {
          stdio: 'pipe',
        });
      } catch (err) {
        console.warn('⚠️  Could not set executable permissions');
      }
    }

    console.log('✅ Husky setup completed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Failed to fix husky setup:', err.message);
    return false;
  }
}

if (require.main === module) {
  fixHuskySetup();
}

module.exports = fixHuskySetup;
