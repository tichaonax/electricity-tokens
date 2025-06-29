const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function manageUser(email, action = 'check') {
  try {
    console.log(
      `🔄 ${action === 'check' ? 'Checking' : 'Managing'} user: ${email}`
    );

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locked: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      console.log('✅ User found:', existingUser);

      if (action === 'update' && existingUser.role !== 'USER') {
        // Update to USER role
        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            role: 'USER',
            locked: false,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            locked: true,
          },
        });
        console.log('🔄 User updated to USER role:', updatedUser);
        return updatedUser;
      }

      return existingUser;
    }

    if (action === 'create') {
      // Create new user with USER role
      const hashedPassword = await bcrypt.hash('password123', 12);

      const newUser = await prisma.user.create({
        data: {
          name: 'Tichaona',
          email: email,
          password: hashedPassword,
          role: 'USER',
          locked: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          locked: true,
        },
      });

      console.log('✅ New USER created:', newUser);
      console.log(`📧 Login credentials: ${email} / password123`);
      return newUser;
    }

    console.log('❌ User not found');
    return null;
  } catch (error) {
    console.error('❌ Error managing user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function grantUserPermissions(email) {
  try {
    console.log(`🔄 Granting USER permissions to: ${email}`);

    // First check if user exists
    let user = await manageUser(email, 'check');

    if (!user) {
      console.log('👤 User not found. Creating new user...');
      user = await manageUser(email, 'create');
    } else if (user.role !== 'USER' || user.locked) {
      console.log('🔄 Updating user permissions...');
      user = await manageUser(email, 'update');
    } else {
      console.log('✅ User already has correct USER permissions');
    }

    // Show final permissions
    console.log('\n📋 Final user permissions:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Locked: ${user.locked}`);
    console.log(`   Can: Create contributions, view own data`);
    console.log(`   Cannot: Manage other users, access admin features`);

    return user;
  } catch (error) {
    console.error('💥 Failed to grant permissions:', error);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  const email = process.argv[2] || 'tichaona@yahoo.com';

  grantUserPermissions(email)
    .then(() => {
      console.log(
        `\n🎉 Successfully configured USER permissions for ${email}!`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { grantUserPermissions, manageUser };
