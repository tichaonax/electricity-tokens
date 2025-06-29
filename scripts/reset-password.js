const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUserPassword(email, newPassword = 'password123') {
  try {
    console.log(`🔄 Resetting password for user: ${email}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locked: true,
      },
    });

    if (!existingUser) {
      console.log('❌ User not found');
      return null;
    }

    console.log('✅ User found:', {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      locked: existingUser.locked,
    });

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log('✅ Password updated successfully!');
    console.log(`📧 Login credentials: ${email} / ${newPassword}`);

    return {
      email: existingUser.email,
      name: existingUser.name,
      newPassword: newPassword,
    };
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3] || 'password123';

  if (!email) {
    console.log('❌ Please provide an email address');
    console.log('Usage: node scripts/reset-password.js <email> [password]');
    console.log(
      'Example: node scripts/reset-password.js tichaona@yahoo.com password123'
    );
    process.exit(1);
  }

  resetUserPassword(email, password)
    .then((result) => {
      if (result) {
        console.log(`\n🎉 Password reset completed for ${result.email}!`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Password reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetUserPassword };
