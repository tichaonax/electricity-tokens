const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Find or create admin user
    const adminUser = await prisma.user.upsert({
      where: {
        email: 'admin@test.com'
      },
      update: {
        role: 'ADMIN'
      },
      create: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: '$2a$10$dummy.hash.for.testing.purposes.only',
        role: 'ADMIN'
      }
    });

    console.log('Admin user created/updated:', adminUser);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();