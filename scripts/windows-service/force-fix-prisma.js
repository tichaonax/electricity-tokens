const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function forceFix() {
  console.log('🔧 Force fixing Prisma with aggressive Windows approach...');

  const appRoot = path.resolve(__dirname, '../..');

  try {
    // Step 1: Kill any Node.js processes that might be holding file handles
    console.log('🛑 Terminating Node.js processes...');
    try {
      execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
      execSync('taskkill /F /IM npm.exe', { stdio: 'pipe' });
    } catch (err) {
      // Processes might not be running, that's ok
    }

    // Step 2: Wait for processes to fully terminate
    console.log('⏳ Waiting for processes to terminate...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Step 3: Completely remove Prisma-related directories
    console.log('🗑️  Removing all Prisma directories...');
    const pathsToRemove = [
      path.join(appRoot, 'node_modules', '.prisma'),
      path.join(appRoot, 'node_modules', '@prisma'),
      path.join(appRoot, 'node_modules', 'prisma'),
    ];

    for (const dirPath of pathsToRemove) {
      if (fs.existsSync(dirPath)) {
        try {
          console.log(`Removing: ${dirPath}`);
          execSync(`rmdir /S /Q "${dirPath}"`, {
            cwd: appRoot,
            stdio: 'pipe',
          });
        } catch (err) {
          console.warn(`Could not remove ${dirPath}, continuing...`);
        }
      }
    }

    // Step 4: Clear npm cache
    console.log('🧹 Clearing npm cache...');
    execSync('npm cache clean --force', {
      cwd: appRoot,
      stdio: 'pipe',
    });

    // Step 5: Reinstall Prisma packages
    console.log('📦 Reinstalling Prisma packages...');
    execSync('npm install @prisma/client@^6.10.1 prisma@^6.10.1 --force', {
      cwd: appRoot,
      stdio: 'inherit',
    });

    // Step 6: Wait again
    console.log('⏳ Waiting for installation to settle...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 7: Generate Prisma client
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', {
      cwd: appRoot,
      stdio: 'inherit',
    });

    console.log('✅ Prisma client generated successfully!');

    // Step 8: Test the fix with a build
    console.log('🏗️  Testing build...');
    execSync('npm run build', {
      cwd: appRoot,
      stdio: 'inherit',
    });

    console.log('✅ Build test successful!');
    return true;
  } catch (err) {
    console.error('❌ Force fix failed:', err.message);
    console.log('\n📋 Manual Steps to Fix:');
    console.log('1. Open Task Manager and kill all node.exe processes');
    console.log('2. Open Command Prompt as Administrator');
    console.log('3. Navigate to your project directory');
    console.log('4. Run: rmdir /S /Q node_modules\\.prisma');
    console.log('5. Run: rmdir /S /Q node_modules\\@prisma');
    console.log('6. Run: npm install @prisma/client prisma --force');
    console.log('7. Run: npx prisma generate');
    console.log('8. Run: npm run build');
    return false;
  }
}

if (require.main === module) {
  forceFix().then((success) => {
    if (success) {
      console.log('\n🎉 Prisma force fix completed successfully!');
    } else {
      console.log('\n❌ Prisma force fix failed.');
      process.exit(1);
    }
  });
}

module.exports = forceFix;
