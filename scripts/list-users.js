const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Listing all users in the database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      console.log('❌ No users found in the database');
      return [];
    }

    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Role: ${user.role}`);
      console.log(`   🔒 Locked: ${user.locked ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log('');
    });

    // Show summary
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const userCount = users.filter((u) => u.role === 'USER').length;
    const lockedCount = users.filter((u) => u.locked).length;

    console.log('📊 Summary:');
    console.log(`   👑 Admins: ${adminCount}`);
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   🔒 Locked: ${lockedCount}`);

    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  listUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { listUsers };
