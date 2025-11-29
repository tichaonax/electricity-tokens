import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️ Resetting database...');

  // Delete in order to respect foreign key constraints
  await prisma.userContribution.deleteMany({});
  await prisma.tokenPurchase.deleteMany({});
  await prisma.meterReading.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.verificationToken.deleteMany({});

  // Keep users for now, but reset their login data
  await prisma.user.updateMany({
    data: {
      lastLoginAt: null,
      passwordResetRequired: false,
    },
  });

  console.log('✅ Database reset complete');
}

async function restoreFromBackup() {
  try {
    console.log('📁 Loading backup file...');
    const backupPath = join(process.cwd(), 'et-backup_full_2025-11-27.json');
    const backupData = JSON.parse(readFileSync(backupPath, 'utf-8'));

    console.log('📊 Backup metadata:', backupData.metadata);

    const results = {
      restored: {
        users: 0,
        tokenPurchases: 0,
        userContributions: 0,
        meterReadings: 0,
        auditLogs: 0,
        accounts: 0,
        sessions: 0,
        verificationTokens: 0,
      },
      errors: [] as string[],
    };

    await prisma.$transaction(async (tx) => {
      // Restore users
      if (backupData.users) {
        console.log(`👥 Restoring ${backupData.users.length} users...`);
        for (const user of backupData.users) {
          try {
            await tx.user.upsert({
              where: { email: user.email },
              update: {
                name: user.name,
                password: user.password,
                role: user.role,
                locked: user.locked,
                passwordResetRequired: user.passwordResetRequired,
                permissions: user.permissions || null,
                themePreference: user.themePreference,
                lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
              },
              create: {
                id: user.id,
                email: user.email,
                name: user.name,
                password: user.password,
                role: user.role,
                locked: user.locked,
                passwordResetRequired: user.passwordResetRequired,
                permissions: user.permissions || null,
                themePreference: user.themePreference,
                lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
              },
            });
            results.restored.users++;
          } catch (error) {
            results.errors.push(`Failed to restore user ${user.email}: ${error}`);
          }
        }
      }

      // Restore purchases and contributions
      if (backupData.tokenPurchases && backupData.userContributions) {
        console.log(`🛒 Restoring ${backupData.tokenPurchases.length} purchases and contributions...`);

        const contributionMap = new Map(
          backupData.userContributions.map((c: any) => [c.purchaseId, c])
        );

        for (const purchase of backupData.tokenPurchases) {
          try {
            const creator = await tx.user.findUnique({
              where: { email: purchase.creator?.email },
            });

            if (!creator) {
              results.errors.push(`Creator not found for purchase ${purchase.id}`);
              continue;
            }

            const contribution = contributionMap.get(purchase.id);
            if (!contribution) {
              results.errors.push(`No contribution found for purchase ${purchase.id}`);
              continue;
            }

            const contributionUser = await tx.user.findUnique({
              where: { email: contribution.user.email },
            });

            if (!contributionUser) {
              results.errors.push(`Contribution user not found for purchase ${purchase.id}`);
              continue;
            }

            await tx.tokenPurchase.upsert({
              where: { id: purchase.id },
              update: {
                totalTokens: purchase.totalTokens,
                totalPayment: purchase.totalPayment,
                meterReading: purchase.meterReading || 0,
                purchaseDate: new Date(purchase.purchaseDate),
                isEmergency: purchase.isEmergency,
                createdAt: new Date(purchase.createdAt),
                updatedAt: new Date(purchase.updatedAt),
              },
              create: {
                id: purchase.id,
                totalTokens: purchase.totalTokens,
                totalPayment: purchase.totalPayment,
                meterReading: purchase.meterReading || 0,
                purchaseDate: new Date(purchase.purchaseDate),
                isEmergency: purchase.isEmergency,
                createdBy: creator.id,
                createdAt: new Date(purchase.createdAt),
                updatedAt: new Date(purchase.updatedAt),
              },
            });

            await tx.userContribution.upsert({
              where: { id: contribution.id },
              update: {
                contributionAmount: contribution.contributionAmount,
                meterReading: contribution.meterReading,
                tokensConsumed: contribution.tokensConsumed,
                createdAt: new Date(contribution.createdAt),
                updatedAt: new Date(contribution.updatedAt),
              },
              create: {
                id: contribution.id,
                purchaseId: contribution.purchaseId,
                userId: contributionUser.id,
                contributionAmount: contribution.contributionAmount,
                meterReading: contribution.meterReading,
                tokensConsumed: contribution.tokensConsumed,
                createdAt: new Date(contribution.createdAt),
                updatedAt: new Date(contribution.updatedAt),
              },
            });

            results.restored.tokenPurchases++;
            results.restored.userContributions++;
          } catch (error) {
            results.errors.push(`Failed to restore purchase ${purchase.id}: ${error}`);
          }
        }
      }

      // Restore meter readings
      if (backupData.meterReadings) {
        console.log(`📊 Restoring ${backupData.meterReadings.length} meter readings...`);
        for (const reading of backupData.meterReadings) {
          try {
            const userExists = await tx.user.findUnique({
              where: { id: reading.userId },
            });

            if (!userExists) {
              results.errors.push(`User not found for meter reading ${reading.id}`);
              continue;
            }

            await tx.meterReading.upsert({
              where: { id: reading.id },
              update: {
                reading: reading.reading,
                readingDate: new Date(reading.readingDate),
                notes: reading.notes,
                createdAt: new Date(reading.createdAt),
                updatedAt: new Date(reading.updatedAt),
              },
              create: {
                id: reading.id,
                userId: reading.userId,
                reading: reading.reading,
                readingDate: new Date(reading.readingDate),
                notes: reading.notes,
                createdAt: new Date(reading.createdAt),
                updatedAt: new Date(reading.updatedAt),
              },
            });
            results.restored.meterReadings++;
          } catch (error) {
            results.errors.push(`Failed to restore meter reading ${reading.id}: ${error}`);
          }
        }
      }

      // Restore other data...
      console.log('✅ Restore transaction completed');
    });

    console.log('🎉 Restore completed successfully!');
    console.log('📊 Results:', results);

    // Run post-restore fixes
    console.log('🔧 Running post-restore fixes...');
    const { recalculateAllTokensConsumed, fixAllAccountBalances } = await import('../src/lib/balance-fix');
    await recalculateAllTokensConsumed();
    await fixAllAccountBalances();
    console.log('✅ Post-restore fixes completed');

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await resetDatabase();
  await restoreFromBackup();
}

main();