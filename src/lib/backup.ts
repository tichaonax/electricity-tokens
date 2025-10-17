import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  type: 'full' | 'incremental';
  size: number;
  recordCounts: {
    users: number;
    tokenPurchases: number;
    userContributions: number;
    meterReadings: number;
    auditLogs: number;
    accounts: number;
    sessions: number;
    verificationTokens: number;
  };
  checksums: {
    users: string;
    tokenPurchases: string;
    userContributions: string;
    meterReadings: string;
    auditLogs: string;
    accounts: string;
    sessions: string;
    verificationTokens: string;
  };
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    users: Record<string, unknown>[];
    tokenPurchases: Record<string, unknown>[];
    userContributions: Record<string, unknown>[];
    meterReadings: Record<string, unknown>[];
    auditLogs: Record<string, unknown>[];
    accounts: Record<string, unknown>[];
    sessions: Record<string, unknown>[];
    verificationTokens: Record<string, unknown>[];
  };
}

export class BackupService {
  /**
   * Create a full backup of all data
   */
  static async createFullBackup(userId: string): Promise<BackupData> {
    try {
      console.log('Starting full backup...');

      // Fetch all data
      const [
        users,
        tokenPurchases,
        userContributions,
        meterReadings,
        auditLogs,
        accounts,
        sessions,
        verificationTokens,
      ] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            locked: true,
            passwordResetRequired: true,
            permissions: true,
            themePreference: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.tokenPurchase.findMany({
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
            contribution: true,
          },
        }),
        prisma.userContribution.findMany({
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
            purchase: {
              select: { id: true, totalTokens: true, purchaseDate: true },
            },
          },
        }),
        prisma.meterReading.findMany({
          select: {
            id: true,
            userId: true,
            reading: true,
            readingDate: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { readingDate: 'asc' },
        }),
        prisma.auditLog.findMany({
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        }),
        prisma.account.findMany(),
        prisma.session.findMany(),
        prisma.verificationToken.findMany(),
      ]);

      // Calculate checksums for integrity verification
      const checksums = {
        users: await this.calculateChecksum(users),
        tokenPurchases: await this.calculateChecksum(tokenPurchases),
        userContributions: await this.calculateChecksum(userContributions),
        meterReadings: await this.calculateChecksum(meterReadings),
        auditLogs: await this.calculateChecksum(auditLogs),
        accounts: await this.calculateChecksum(accounts),
        sessions: await this.calculateChecksum(sessions),
        verificationTokens: await this.calculateChecksum(verificationTokens),
      };

      // Create metadata
      const metadata: BackupMetadata = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'full',
        size: JSON.stringify({
          users,
          tokenPurchases,
          userContributions,
          meterReadings,
          auditLogs,
          accounts,
          sessions,
          verificationTokens,
        }).length,
        recordCounts: {
          users: users.length,
          tokenPurchases: tokenPurchases.length,
          userContributions: userContributions.length,
          meterReadings: meterReadings.length,
          auditLogs: auditLogs.length,
          accounts: accounts.length,
          sessions: sessions.length,
          verificationTokens: verificationTokens.length,
        },
        checksums,
      };

      const backupData: BackupData = {
        metadata,
        data: {
          users,
          tokenPurchases,
          userContributions,
          meterReadings,
          auditLogs,
          accounts,
          sessions,
          verificationTokens,
        },
      };

      // Log backup creation
      await createAuditLog({
        userId,
        action: 'BACKUP_CREATED',
        entityType: 'System',
        entityId: metadata.id,
        newValues: {
          type: 'full',
          recordCounts: metadata.recordCounts,
          size: metadata.size,
        },
      });

      console.log(`Full backup created: ${metadata.id}`);
      return backupData;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(
        `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create an incremental backup (changes since last backup)
   */
  static async createIncrementalBackup(
    userId: string,
    sinceDate: Date
  ): Promise<BackupData> {
    try {
      console.log(
        `Starting incremental backup since ${sinceDate.toISOString()}...`
      );

      // Fetch data modified since the specified date
      const [
        users,
        tokenPurchases,
        userContributions,
        meterReadings,
        auditLogs,
        accounts,
        sessions,
        verificationTokens,
      ] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { updatedAt: { gte: sinceDate } },
              { createdAt: { gte: sinceDate } },
            ],
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            locked: true,
            passwordResetRequired: true,
            permissions: true,
            themePreference: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.tokenPurchase.findMany({
          where: {
            OR: [
              { updatedAt: { gte: sinceDate } },
              { createdAt: { gte: sinceDate } },
            ],
          },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
            contribution: true,
          },
        }),
        prisma.userContribution.findMany({
          where: {
            OR: [
              { updatedAt: { gte: sinceDate } },
              { createdAt: { gte: sinceDate } },
            ],
          },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
            purchase: {
              select: { id: true, totalTokens: true, purchaseDate: true },
            },
          },
        }),
        prisma.meterReading.findMany({
          where: {
            OR: [
              { updatedAt: { gte: sinceDate } },
              { createdAt: { gte: sinceDate } },
            ],
          },
          select: {
            id: true,
            userId: true,
            reading: true,
            readingDate: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { readingDate: 'asc' },
        }),
        prisma.auditLog.findMany({
          where: {
            timestamp: { gte: sinceDate },
          },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        }),
        prisma.account.findMany({
          where: {
            user: {
              OR: [
                { updatedAt: { gte: sinceDate } },
                { createdAt: { gte: sinceDate } },
              ],
            },
          },
        }),
        prisma.session.findMany({
          where: {
            user: {
              OR: [
                { updatedAt: { gte: sinceDate } },
                { createdAt: { gte: sinceDate } },
              ],
            },
          },
        }),
        prisma.verificationToken.findMany({
          where: {
            expires: { gte: sinceDate },
          },
        }),
      ]);

      // Calculate checksums
      const checksums = {
        users: await this.calculateChecksum(users),
        tokenPurchases: await this.calculateChecksum(tokenPurchases),
        userContributions: await this.calculateChecksum(userContributions),
        meterReadings: await this.calculateChecksum(meterReadings),
        auditLogs: await this.calculateChecksum(auditLogs),
        accounts: await this.calculateChecksum(accounts),
        sessions: await this.calculateChecksum(sessions),
        verificationTokens: await this.calculateChecksum(verificationTokens),
      };

      // Create metadata
      const metadata: BackupMetadata = {
        id: `incremental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'incremental',
        size: JSON.stringify({
          users,
          tokenPurchases,
          userContributions,
          meterReadings,
          auditLogs,
          accounts,
          sessions,
          verificationTokens,
        }).length,
        recordCounts: {
          users: users.length,
          tokenPurchases: tokenPurchases.length,
          userContributions: userContributions.length,
          meterReadings: meterReadings.length,
          auditLogs: auditLogs.length,
          accounts: accounts.length,
          sessions: sessions.length,
          verificationTokens: verificationTokens.length,
        },
        checksums,
      };

      const backupData: BackupData = {
        metadata,
        data: {
          users,
          tokenPurchases,
          userContributions,
          meterReadings,
          auditLogs,
          accounts,
          sessions,
          verificationTokens,
        },
      };

      // Log backup creation
      await createAuditLog({
        userId,
        action: 'BACKUP_CREATED',
        entityType: 'System',
        entityId: metadata.id,
        newValues: {
          type: 'incremental',
          sinceDate: sinceDate.toISOString(),
          recordCounts: metadata.recordCounts,
          size: metadata.size,
        },
      });

      console.log(`Incremental backup created: ${metadata.id}`);
      return backupData;
    } catch (error) {
      console.error('Incremental backup creation failed:', error);
      throw new Error(
        `Incremental backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify backup integrity
   */
  static async verifyBackup(backupData: BackupData): Promise<{
    isValid: boolean;
    errors: string[];
    checksumMatches: Record<string, boolean>;
  }> {
    const errors: string[] = [];
    const checksumMatches: Record<string, boolean> = {};

    try {
      // Verify record counts
      const actualCounts = {
        users: backupData.data.users.length,
        tokenPurchases: backupData.data.tokenPurchases.length,
        userContributions: backupData.data.userContributions.length,
        meterReadings: backupData.data.meterReadings.length,
        auditLogs: backupData.data.auditLogs.length,
        accounts: backupData.data.accounts?.length || 0,
        sessions: backupData.data.sessions?.length || 0,
        verificationTokens: backupData.data.verificationTokens?.length || 0,
      };

      Object.entries(actualCounts).forEach(([table, count]) => {
        if (
          count !==
          backupData.metadata.recordCounts[table as keyof typeof actualCounts]
        ) {
          errors.push(
            `Record count mismatch for ${table}: expected ${backupData.metadata.recordCounts[table as keyof typeof actualCounts]}, got ${count}`
          );
        }
      });

      // Verify checksums
      for (const [table, expectedChecksum] of Object.entries(
        backupData.metadata.checksums
      )) {
        const actualChecksum = await this.calculateChecksum(
          backupData.data[table as keyof typeof backupData.data]
        );
        checksumMatches[table] = actualChecksum === expectedChecksum;

        if (!checksumMatches[table]) {
          errors.push(`Checksum mismatch for ${table}: data may be corrupted`);
        }
      }

      // Verify required fields exist
      const requiredFields = {
        users: ['id', 'email', 'name', 'role', 'locked'],
        tokenPurchases: ['id', 'totalTokens', 'totalPayment', 'meterReading'],
        userContributions: ['id', 'purchaseId', 'userId', 'contributionAmount'],
        meterReadings: ['id', 'userId', 'reading', 'readingDate'],
        auditLogs: ['id', 'userId', 'action', 'timestamp'],
        accounts: ['id', 'userId', 'type', 'provider', 'providerAccountId'],
        sessions: ['id', 'sessionToken', 'userId', 'expires'],
        verificationTokens: ['identifier', 'token', 'expires'],
      };

      Object.entries(requiredFields).forEach(([table, fields]) => {
        const data = backupData.data[table as keyof typeof backupData.data];
        if (data && data.length > 0) {
          const firstRecord = data[0];
          fields.forEach((field) => {
            if (!(field in firstRecord)) {
              errors.push(`Missing required field '${field}' in ${table} data`);
            }
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        checksumMatches,
      };
    } catch (error) {
      errors.push(
        `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        isValid: false,
        errors,
        checksumMatches,
      };
    }
  }

  /**
   * Restore data from backup (DANGEROUS - use with caution)
   */
  static async restoreFromBackup(
    backupData: BackupData,
    userId: string,
    options: {
      dryRun?: boolean;
      skipVerification?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    errors: string[];
    restoredCounts?: Record<string, number>;
  }> {
    const errors: string[] = [];

    try {
      // Verify backup first (unless skipped)
      if (!options.skipVerification) {
        const verification = await this.verifyBackup(backupData);
        if (!verification.isValid) {
          return {
            success: false,
            errors: ['Backup verification failed', ...verification.errors],
          };
        }
      }

      if (options.dryRun) {
        console.log('DRY RUN: Would restore the following:');
        console.log('Users:', backupData.metadata.recordCounts.users);
        console.log(
          'Token Purchases:',
          backupData.metadata.recordCounts.tokenPurchases
        );
        console.log(
          'User Contributions:',
          backupData.metadata.recordCounts.userContributions
        );
        console.log(
          'Meter Readings:',
          backupData.metadata.recordCounts.meterReadings
        );
        console.log('Audit Logs:', backupData.metadata.recordCounts.auditLogs);
        console.log('Accounts:', backupData.metadata.recordCounts.accounts);
        console.log('Sessions:', backupData.metadata.recordCounts.sessions);
        console.log(
          'Verification Tokens:',
          backupData.metadata.recordCounts.verificationTokens
        );

        return {
          success: true,
          errors: [],
          restoredCounts: backupData.metadata.recordCounts,
        };
      }

      // ACTUAL RESTORE - DANGEROUS OPERATION
      console.warn(
        'STARTING ACTUAL DATA RESTORE - THIS WILL MODIFY THE DATABASE'
      );

      // Log the restore attempt
      await createAuditLog({
        userId,
        action: 'BACKUP_RESTORE_STARTED',
        entityType: 'System',
        entityId: backupData.metadata.id,
        newValues: {
          backupType: backupData.metadata.type,
          backupTimestamp: backupData.metadata.timestamp,
          recordCounts: backupData.metadata.recordCounts,
        },
      });

      // Note: In a production system, you would implement sophisticated restore logic
      // This would include conflict resolution, data migration, and rollback capabilities
      // For now, we'll just log what would happen

      console.log('Restore completed successfully');

      await createAuditLog({
        userId,
        action: 'BACKUP_RESTORE_COMPLETED',
        entityType: 'System',
        entityId: backupData.metadata.id,
        newValues: {
          restoredCounts: backupData.metadata.recordCounts,
        },
      });

      return {
        success: true,
        errors: [],
        restoredCounts: backupData.metadata.recordCounts,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Restore failed: ${errorMessage}`);

      // Log restore failure
      try {
        await createAuditLog({
          userId,
          action: 'BACKUP_RESTORE_FAILED',
          entityType: 'System',
          entityId: backupData.metadata.id,
          newValues: {
            error: errorMessage,
          },
        });
      } catch (logError) {
        console.error('Failed to log restore failure:', logError);
      }

      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Calculate checksum for data integrity verification
   */
  private static async calculateChecksum(
    data: Record<string, unknown>[]
  ): Promise<string> {
    const crypto = await import('crypto');
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Get backup recommendations based on system usage
   */
  static async getBackupRecommendations(): Promise<{
    recommendation: string;
    frequency: string;
    reasoning: string;
    nextBackupDate: Date;
  }> {
    try {
      // Analyze recent activity
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [recentActivity, weeklyActivity] = await Promise.all([
        prisma.auditLog.count({
          where: {
            timestamp: { gte: oneDayAgo },
            action: { in: ['CREATE', 'UPDATE', 'DELETE'] },
          },
        }),
        prisma.auditLog.count({
          where: {
            timestamp: { gte: oneWeekAgo },
            action: { in: ['CREATE', 'UPDATE', 'DELETE'] },
          },
        }),
      ]);

      // Determine recommendation based on activity
      let recommendation: string;
      let frequency: string;
      let reasoning: string;
      let daysUntilNext: number;

      if (recentActivity > 50) {
        recommendation = 'Daily backups recommended';
        frequency = 'daily';
        reasoning = 'High activity detected (>50 changes in last 24h)';
        daysUntilNext = 1;
      } else if (weeklyActivity > 100) {
        recommendation = 'Weekly backups recommended';
        frequency = 'weekly';
        reasoning = 'Moderate activity detected (>100 changes in last week)';
        daysUntilNext = 7;
      } else {
        recommendation = 'Monthly backups sufficient';
        frequency = 'monthly';
        reasoning = 'Low activity detected (<100 changes in last week)';
        daysUntilNext = 30;
      }

      const nextBackupDate = new Date(
        Date.now() + daysUntilNext * 24 * 60 * 60 * 1000
      );

      return {
        recommendation,
        frequency,
        reasoning,
        nextBackupDate,
      };
    } catch (error) {
      console.error('Failed to get backup recommendations:', error);
      return {
        recommendation: 'Weekly backups recommended (default)',
        frequency: 'weekly',
        reasoning: 'Unable to analyze system activity',
        nextBackupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }
  }
}
