#!/usr/bin/env node

/**
 * Promote User to Admin Script
 * 
 * This script promotes a specific user to admin role.
 * Useful for fixing the first user who should have been admin.
 * 
 * Usage:
 *   node scripts/promote-to-admin.js <email>
 *   npm run user:promote <email>
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function getUserEmail() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter the email address of the user to promote to admin: ', (email) => {
      rl.close();
      resolve(email.trim());
    });
  });
}

async function confirmPromotion(user) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    log('', colors.reset);
    log('User Details:', colors.cyan);
    log(`  Name: ${user.name}`, colors.blue);
    log(`  Email: ${user.email}`, colors.blue);
    log(`  Current Role: ${user.role}`, colors.blue);
    log(`  Created: ${user.createdAt.toLocaleDateString()}`, colors.blue);
    log('', colors.reset);
    
    rl.question('Are you sure you want to promote this user to ADMIN? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

async function promoteUserToAdmin(email) {
  try {
    log('🔍 Looking up user...', colors.cyan);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      log(`❌ User not found with email: ${email}`, colors.red);
      log('', colors.reset);
      log('Available users:', colors.yellow);
      
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          role: true
        }
      });
      
      allUsers.forEach(u => {
        log(`  - ${u.email} (${u.name}) - ${u.role}`, colors.yellow);
      });
      
      return false;
    }
    
    // Check if user is already admin
    if (user.role === 'ADMIN') {
      log(`✅ User ${email} is already an ADMIN`, colors.green);
      return true;
    }
    
    // Confirm promotion
    const confirmed = await confirmPromotion(user);
    if (!confirmed) {
      log('❌ Promotion cancelled', colors.yellow);
      return false;
    }
    
    // Promote user
    log('🔄 Promoting user to admin...', colors.cyan);
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'PROMOTE_TO_ADMIN',
        entityType: 'User',
        entityId: updatedUser.id,
        oldValues: { role: 'USER' },
        newValues: { role: 'ADMIN' }
      }
    });
    
    log('✅ User successfully promoted to ADMIN!', colors.green);
    log('', colors.reset);
    log('Updated user details:', colors.cyan);
    log(`  Name: ${updatedUser.name}`, colors.blue);
    log(`  Email: ${updatedUser.email}`, colors.blue);
    log(`  Role: ${updatedUser.role}`, colors.blue);
    
    return true;
    
  } catch (error) {
    log('❌ Error promoting user:', colors.red);
    log(error.message, colors.red);
    return false;
  }
}

async function main() {
  log('🔐 User Promotion to Admin Tool', colors.blue);
  log('=================================', colors.blue);
  log('', colors.reset);
  
  try {
    // Get email from command line or prompt
    let email = process.argv[2];
    
    if (!email) {
      email = await getUserEmail();
    }
    
    if (!email) {
      log('❌ No email provided', colors.red);
      process.exit(1);
    }
    
    log('', colors.reset);
    
    const success = await promoteUserToAdmin(email);
    
    if (success) {
      log('', colors.reset);
      log('🎉 Promotion completed successfully!', colors.green);
      log('', colors.reset);
      log('The user can now:', colors.cyan);
      log('1. Access admin dashboard (/dashboard/admin)', colors.cyan);
      log('2. Manage other users', colors.cyan);
      log('3. Access system settings and reports', colors.cyan);
      log('4. Perform data backup and restore operations', colors.cyan);
    }
    
  } catch (error) {
    log('❌ Unexpected error:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log('❌ Unhandled error occurred:', colors.red);
  log(error.message, colors.red);
  process.exit(1);
});

// Run the promotion
if (require.main === module) {
  main().catch((error) => {
    log('❌ Promotion failed:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  });
}

module.exports = { promoteUserToAdmin };