const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function fixPrismaGeneration() {
  console.log('🔧 Fixing Prisma client generation...');
  
  try {
    // Step 1: Kill any hanging Node processes
    console.log('🛑 Stopping any running Node processes...');
    try {
      await execAsync('taskkill /f /im node.exe 2>nul || echo "No node processes found"');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    } catch (error) {
      console.log('⚠️ Process cleanup had issues (continuing anyway)');
    }

    // Step 2: Remove the locked Prisma client directory
    const prismaClientDir = path.join(__dirname, '..', 'node_modules', '.prisma');
    if (fs.existsSync(prismaClientDir)) {
      console.log('🗑️ Removing locked Prisma client directory...');
      try {
        fs.rmSync(prismaClientDir, { recursive: true, force: true });
      } catch (error) {
        console.log('⚠️ Could not remove directory normally, trying system command...');
        try {
          await execAsync(`rmdir /s /q "${prismaClientDir}" 2>nul || echo "Force cleanup attempted"`);
        } catch (sysError) {
          console.log('⚠️ System cleanup also had issues, continuing...');
        }
      }
    }

    // Step 3: Generate Prisma client with retry
    console.log('⚡ Generating Prisma client...');
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!success && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}...`);
      
      try {
        await execAsync('npx prisma generate', {
          cwd: path.join(__dirname, '..'),
          timeout: 120000, // 2 minutes timeout
        });
        success = true;
        console.log('✅ Prisma client generated successfully!');
      } catch (error) {
        console.log(`❌ Attempt ${attempts} failed: ${error.message}`);
        if (attempts < maxAttempts) {
          console.log('⏳ Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    if (!success) {
      throw new Error('Failed to generate Prisma client after all attempts');
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to fix Prisma generation:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  fixPrismaGeneration()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixPrismaGeneration };