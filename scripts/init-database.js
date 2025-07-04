#!/usr/bin/env node

/**
 * Database Initialization Script (Production)
 * 
 * This script initializes the database for production deployment.
 * It's designed to be run automatically without user interaction.
 * 
 * Usage:
 *   node scripts/init-database.js
 *   npm run db:init
 * 
 * What this script does:
 * 1. Tests database connection
 * 2. Generates Prisma client
 * 3. Pushes schema to database (creates tables)
 * 4. Verifies table creation
 */

const { exec } = require('child_process');
const { promisify } = require('util');

let PrismaClient;
const execAsync = promisify(exec);

async function initializeDatabase() {
  console.log('🚀 Initializing database for Electricity Tokens Tracker...');
  
  try {
    // Step 1: Generate client first
    console.log('🔧 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // Step 2: Test connection
    console.log('🔍 Testing database connection...');
    ({ PrismaClient } = require('@prisma/client'));
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    console.log('✅ Database connection successful');
    
    // Step 3: Push schema
    console.log('📊 Creating database tables...');
    await execAsync('npx prisma db push --accept-data-loss');
    console.log('✅ Database tables created');
    
    // Step 4: Verify tables
    console.log('🔍 Verifying table creation...');
    const prismaVerify = new PrismaClient();
    
    const userCount = await prismaVerify.user.count();
    const purchaseCount = await prismaVerify.tokenPurchase.count();
    const contributionCount = await prismaVerify.userContribution.count();
    
    await prismaVerify.$disconnect();
    
    console.log('✅ Tables verified successfully');
    console.log(`📊 Current counts: Users(${userCount}), Purchases(${purchaseCount}), Contributions(${contributionCount})`);
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the application');
    console.log('2. Register your first user');
    console.log('3. Promote user to admin if needed');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error.message);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('');
      console.error('Please create the database first:');
      console.error('psql -U postgres -c "CREATE DATABASE electricity_tokens;"');
    }
    
    if (error.message.includes('connect')) {
      console.error('');
      console.error('Please check:');
      console.error('1. PostgreSQL is running');
      console.error('2. DATABASE_URL environment variable is correct');
      console.error('3. Database credentials are valid');
    }
    
    throw error;
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };