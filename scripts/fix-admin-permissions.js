#!/usr/bin/env node

/**
 * Script to ensure admin users have no specific permissions stored in the database.
 * Admin users should have role='ADMIN' and permissions=null for automatic full access.
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function fixAdminPermissions() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking admin users...');

    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, permissions: true }
    });

    console.log(`Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.email}: permissions = ${JSON.stringify(user.permissions)}`);
    });

    // Update admin users to have null permissions
    const updateResult = await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { permissions: null }
    });

    if (updateResult.count > 0) {
      console.log(`✅ Updated ${updateResult.count} admin user(s) to have null permissions`);
      console.log('Admin users now have automatic full access without specific permission grants.');
    } else {
      console.log('✅ All admin users already have null permissions');
    }

  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions();