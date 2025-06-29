const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        locked: false,
      },
    });

    console.log('✅ Admin user created:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    });

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'user@test.com',
        password: hashedPassword,
        role: 'USER',
        locked: false,
      },
    });

    console.log('✅ Regular user created:', {
      id: regularUser.id,
      name: regularUser.name,
      email: regularUser.email,
      role: regularUser.role,
    });

    console.log('\n🎉 Test users created successfully!');
    console.log('You can now log in with:');
    console.log('Admin: admin@test.com / password123');
    console.log('User: user@test.com / password123');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  createTestUser()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser };
