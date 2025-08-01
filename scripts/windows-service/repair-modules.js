const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function repairModules() {
  console.log('🔧 Repairing Node.js modules for Windows deployment...');

  const appRoot = path.resolve(__dirname, '../..');

  try {
    // Step 1: Clean slate approach
    console.log('🗑️  Removing node_modules...');
    const nodeModulesPath = path.join(appRoot, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      execSync(`rmdir /S /Q "${nodeModulesPath}"`, {
        cwd: appRoot,
        stdio: 'pipe',
      });
    }

    // Step 2: Clean npm cache
    console.log('🧹 Cleaning npm cache...');
    execSync('npm cache clean --force', {
      cwd: appRoot,
      stdio: 'pipe',
    });

    // Step 3: Fresh install with verbose output
    console.log('📦 Fresh installation of all dependencies...');
    execSync('npm install --no-audit --no-fund --verbose', {
      cwd: appRoot,
      stdio: 'inherit',
    });

    // Step 4: Verify critical dependencies
    console.log('🔍 Verifying critical dependencies...');
    const criticalDeps = [
      'tailwindcss',
      'autoprefixer',
      'postcss',
      'next',
      '@next/swc-win32-x64-msvc',
    ];

    for (const dep of criticalDeps) {
      const depPath = path.join(appRoot, 'node_modules', dep);
      if (fs.existsSync(depPath)) {
        console.log(`✅ ${dep} is properly installed`);
      } else {
        console.warn(`⚠️  ${dep} is missing, attempting to install...`);
        try {
          execSync(`npm install ${dep} --save-dev`, {
            cwd: appRoot,
            stdio: 'inherit',
          });
        } catch (err) {
          console.error(`❌ Failed to install ${dep}: ${err.message}`);
        }
      }
    }

    // Step 5: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      // First attempt: Normal generation
      execSync('npx prisma generate', {
        cwd: appRoot,
        stdio: 'inherit',
      });
      console.log('✅ Prisma client generated successfully!');
    } catch (prismaErr) {
      console.warn('⚠️  Initial Prisma generation failed, trying fixes...');

      try {
        // Second attempt: Clear Prisma cache and try again
        console.log('🧹 Clearing Prisma cache...');
        const prismaPath = path.join(appRoot, 'node_modules', '.prisma');
        if (fs.existsSync(prismaPath)) {
          execSync(`rmdir /S /Q "${prismaPath}"`, {
            cwd: appRoot,
            stdio: 'pipe',
          });
        }

        // Wait a moment for file handles to release
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log('🔄 Retrying Prisma generation...');
        execSync('npx prisma generate', {
          cwd: appRoot,
          stdio: 'inherit',
        });
        console.log('✅ Prisma client generated successfully on retry!');
      } catch (retryErr) {
        console.error(
          '❌ Prisma generation failed after retry:',
          retryErr.message
        );
        console.log(
          'ℹ️  Continuing without Prisma generation - you may need to run "npx prisma generate" manually'
        );
        // Don't fail the entire process for Prisma issues
      }
    }

    // Step 6: Test build
    console.log('🏗️  Testing build process...');
    try {
      execSync('npm run build', {
        cwd: appRoot,
        stdio: 'inherit',
      });
      console.log('✅ Build test successful!');
      return true;
    } catch (buildErr) {
      console.error('❌ Build test failed:', buildErr.message);
      return false;
    }
  } catch (err) {
    console.error('❌ Module repair failed:', err.message);
    return false;
  }
}

if (require.main === module) {
  repairModules().then((success) => {
    if (success) {
      console.log('\n🎉 Module repair completed successfully!');
      console.log('You can now run: npm run service:start');
    } else {
      console.log('\n❌ Module repair failed. Check the errors above.');
      process.exit(1);
    }
  });
}

module.exports = repairModules;
