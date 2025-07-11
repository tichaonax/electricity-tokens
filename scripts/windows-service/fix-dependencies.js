const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function fixDependencies() {
  console.log('🔧 Fixing common dependency issues...');

  const appRoot = path.resolve(__dirname, '../..');

  try {
    // Critical dependencies that often cause build issues
    const criticalDeps = [
      'tailwindcss@^3.4.17',
      'autoprefixer@^10.4.20',
      'postcss@^8.4.49',
      '@next/swc-win32-x64-msvc',
      'husky',
    ];

    console.log('📦 Installing critical dependencies...');
    for (const dep of criticalDeps) {
      try {
        console.log(`Installing ${dep}...`);
        execSync(`npm install ${dep} --no-audit --save-dev`, {
          cwd: appRoot,
          stdio: 'inherit',
        });
        console.log(`✅ Installed ${dep}`);
      } catch (err) {
        console.warn(`⚠️  Could not install ${dep}: ${err.message}`);
      }
    }

    // Run npm install to ensure everything is linked properly
    console.log('🔄 Running final npm install...');
    execSync('npm install --no-audit --no-fund', {
      cwd: appRoot,
      stdio: 'inherit',
    });

    // Setup husky if needed
    console.log('🔧 Setting up husky...');
    try {
      execSync('npx husky install', {
        cwd: appRoot,
        stdio: 'pipe',
      });
      console.log('✅ Husky setup completed');
    } catch (huskyErr) {
      console.log('ℹ️  Husky setup skipped (not critical)');
    }

    console.log('✅ Dependency fixes completed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Failed to fix dependencies:', err.message);
    return false;
  }
}

if (require.main === module) {
  fixDependencies();
}

module.exports = fixDependencies;
