const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function fixPrisma() {
  console.log('🔧 Fixing Prisma client generation issues...');

  const appRoot = path.resolve(__dirname, '../..');

  try {
    // Step 1: Stop any running processes that might be using Prisma
    console.log('🛑 Ensuring no processes are using Prisma files...');

    // Step 2: Clear Prisma generated files
    console.log('🗑️  Removing existing Prisma generated files...');
    const prismaPath = path.join(appRoot, 'node_modules', '.prisma');
    if (fs.existsSync(prismaPath)) {
      try {
        execSync(`rmdir /S /Q "${prismaPath}"`, {
          cwd: appRoot,
          stdio: 'pipe',
        });
        console.log('✅ Cleared .prisma directory');
      } catch (err) {
        console.warn('⚠️  Could not remove .prisma directory, continuing...');
      }
    }

    // Step 3: Clear Prisma cache
    console.log('🧹 Clearing Prisma cache...');
    try {
      execSync('npx prisma generate --generator client --skip-generate', {
        cwd: appRoot,
        stdio: 'pipe',
      });
    } catch (err) {
      // This command might fail, that's ok
    }

    // Step 4: Wait for file handles to release
    console.log('⏳ Waiting for file handles to release...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 5: Force regenerate
    console.log('🔄 Force regenerating Prisma client...');
    try {
      execSync('npx prisma generate --force', {
        cwd: appRoot,
        stdio: 'inherit',
      });
      console.log('✅ Prisma client generated successfully!');
      return true;
    } catch (err) {
      console.error('❌ Force generation failed:', err.message);

      // Step 6: Try alternative approach
      console.log('🔄 Trying alternative approach...');
      try {
        // Remove node_modules/@prisma completely
        const prismaNodeModulesPath = path.join(
          appRoot,
          'node_modules',
          '@prisma'
        );
        if (fs.existsSync(prismaNodeModulesPath)) {
          execSync(`rmdir /S /Q "${prismaNodeModulesPath}"`, {
            cwd: appRoot,
            stdio: 'pipe',
          });
        }

        // Reinstall Prisma
        execSync('npm install @prisma/client prisma --force', {
          cwd: appRoot,
          stdio: 'inherit',
        });

        // Generate again
        execSync('npx prisma generate', {
          cwd: appRoot,
          stdio: 'inherit',
        });

        console.log('✅ Prisma client generated with alternative approach!');
        return true;
      } catch (altErr) {
        console.error('❌ Alternative approach failed:', altErr.message);
        return false;
      }
    }
  } catch (err) {
    console.error('❌ Prisma fix failed:', err.message);
    return false;
  }
}

if (require.main === module) {
  fixPrisma().then((success) => {
    if (success) {
      console.log('\n🎉 Prisma fix completed successfully!');
      console.log('You can now try running the build again.');
    } else {
      console.log('\n❌ Prisma fix failed. Manual steps:');
      console.log('1. Stop any running Node.js processes');
      console.log('2. Delete node_modules\\.prisma folder manually');
      console.log('3. Run: npx prisma generate');
      process.exit(1);
    }
  });
}

module.exports = fixPrisma;
