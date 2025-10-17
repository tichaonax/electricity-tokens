const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

async function seedAdmin() {
  const prisma = new PrismaClient();

  try {
    console.log('🔐 Seeding admin user...');

    const password_hash = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@electricity.local' },
      update: {
        password: password_hash,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        id: randomUUID(),
        email: 'admin@electricity.local',
        password: password_hash,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Admin user seeded successfully');
    console.log('   Email:', admin.email);
    console.log('   Password: admin123');
    console.log('   Role:', admin.role);
  } catch (error) {
    console.error('❌ Admin seed failed:', error.message);
    // Don't throw - allow service to continue even if admin seed fails
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
