#!/usr/bin/env node

/**
 * Windows-specific Database Initialization Script
 * 
 * This script handles Windows-specific issues like file locking
 * during Prisma client generation.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function killPrismaProcesses() {
  console.log('🔄 Stopping any running Prisma processes...');
  try {
    // Kill any prisma processes that might be locking files
    await execAsync('taskkill /F /IM prisma.exe 2>nul || echo No prisma.exe processes found');
    await execAsync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq *prisma*" 2>nul || echo No prisma node processes found');
    console.log('✅ Prisma processes stopped');
  } catch (error) {
    // Ignore errors - processes might not exist
    console.log('ℹ️ No Prisma processes to stop');
  }
}

async function clearPrismaCache() {
  console.log('🧹 Clearing Prisma cache...');
  try {
    const prismaDir = path.join(process.cwd(), 'node_modules', '.prisma');
    if (fs.existsSync(prismaDir)) {
      await execAsync(`rmdir /s /q "${prismaDir}" 2>nul || echo Cache already clean`);
      console.log('✅ Prisma cache cleared');
    }
  } catch (error) {
    console.log('ℹ️ Cache already clean or unable to clear');
  }
}

async function generatePrismaClientSafe() {
  console.log('🔧 Generating Prisma client (Windows safe mode)...');
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`  Attempt ${attempt}/${maxRetries}...`);
      
      // Wait a moment for file locks to release
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { stdout, stderr } = await execAsync('npx prisma generate', {
        timeout: 60000 // 60 second timeout
      });
      
      console.log('✅ Prisma client generated successfully!');
      if (stderr && !stderr.includes('warn')) {
        console.log(`Warnings: ${stderr}`);
      }
      return true;
      
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log('⏳ Waiting 5 seconds before retry...');
        await killPrismaProcesses();
        await clearPrismaCache();
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  throw new Error('Failed to generate Prisma client after multiple attempts');
}

async function initializeDatabaseWindows() {
  console.log('🚀 Initializing database for Electricity Tokens Tracker (Windows)...');
  console.log('');
  
  try {
    // Step 1: Test connection
    console.log('🔍 Testing database connection...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    console.log('✅ Database connection successful');
    console.log('');
    
    // Step 2: Clean up any locked processes/files
    await killPrismaProcesses();
    await clearPrismaCache();
    console.log('');
    
    // Step 3: Generate client with retries
    await generatePrismaClientSafe();
    console.log('');
    
    // Step 4: Push schema
    console.log('📊 Creating database tables...');
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
      timeout: 120000 // 2 minute timeout
    });
    console.log('✅ Database tables created');
    if (stderr && !stderr.includes('warn')) {
      console.log(`Warnings: ${stderr}`);
    }
    console.log('');
    
    // Step 5: Verify tables
    console.log('🔍 Verifying table creation...');
    const prismaVerify = new PrismaClient();
    
    const userCount = await prismaVerify.user.count();
    const purchaseCount = await prismaVerify.tokenPurchase.count();
    const contributionCount = await prismaVerify.userContribution.count();
    
    await prismaVerify.$disconnect();
    
    console.log('✅ Tables verified successfully');
    console.log(`📊 Current counts: Users(${userCount}), Purchases(${purchaseCount}), Contributions(${contributionCount})`);
    console.log('');
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the application: npm run dev (for development) or npm run build && npm start (for production)');
    console.log('2. Visit the app in your browser');
    console.log('3. Register your first user');
    console.log('4. Promote user to admin if needed: node scripts/create-admin.js');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error.message);
    console.error('');
    
    if (error.message.includes('EPERM') || error.message.includes('operation not permitted')) {
      console.error('💡 Windows Permission Issue Detected:');
      console.error('');
      console.error('Try these solutions:');
      console.error('1. Run Command Prompt as Administrator');
      console.error('2. Close any running Node.js or development servers');
      console.error('3. Close your code editor (VS Code, etc.)');
      console.error('4. Wait 30 seconds and try again');
      console.error('5. Restart your computer if the issue persists');
      console.error('');
      console.error('Alternative: Try the manual setup:');
      console.error('  npx prisma generate');
      console.error('  npx prisma db push --accept-data-loss');
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('');
      console.error('Please create the database first:');
      console.error('1. Open pgAdmin or psql');
      console.error('2. Run: CREATE DATABASE electricity_tokens;');
      console.error('3. Try this script again');
    }
    
    throw error;
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabaseWindows()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { initializeDatabaseWindows };