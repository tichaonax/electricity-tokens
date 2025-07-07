import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';

const backupQuerySchema = z.object({
  type: z.enum(['full', 'users', 'purchase-data']).default('full'),
  includeAuditLogs: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
});

interface BackupUser {
  id: string;
  email: string;
  name: string;
  password?: string | null;
  role: 'ADMIN' | 'USER';
  locked: boolean;
  passwordResetRequired: boolean;
  permissions?: Record<string, unknown> | null;
  themePreference?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackupPurchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  meterReading: number;
  purchaseDate: string;
  isEmergency: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    email: string;
    name: string;
  };
}

interface BackupContribution {
  id: string;
  purchaseId: string;
  userId: string;
  contributionAmount: number;
  meterReading: number;
  tokensConsumed: number;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    name: string;
  };
}

interface BackupMeterReading {
  id: string;
  userId: string;
  reading: number;
  readingDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackupAccount {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

interface BackupSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
}

interface BackupVerificationToken {
  identifier: string;
  token: string;
  expires: string;
}

interface BackupData {
  metadata: {
    timestamp: string;
    version: string;
    type: string;
    recordCounts: Record<string, number>;
  };
  users?: BackupUser[];
  tokenPurchases?: BackupPurchase[];
  userContributions?: BackupContribution[];
  meterReadings?: BackupMeterReading[];
  auditLogs?: Record<string, unknown>[];
  accounts?: BackupAccount[];
  sessions?: BackupSession[];
  verificationTokens?: BackupVerificationToken[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true, requireAdmin: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 403 }
      );
    }

    // Validate query parameters
    console.log(
      'Backup API query params:',
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const validation = await validateRequest(request, {
      query: backupQuerySchema,
    });

    if (!validation.success) {
      console.log('Backup validation failed:', validation.error);
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query: {
        type: 'full' | 'users' | 'purchase-data';
        includeAuditLogs: boolean;
      };
    };

    const { type, includeAuditLogs } = query;

    const backupData: BackupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type,
        recordCounts: {},
      },
    };

    // Backup users
    if (type === 'full' || type === 'users') {
      const users = await prisma.user.findMany({
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
      });
      backupData.users = users.map((user) => ({
        ...user,
        permissions: user.permissions || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }));
      backupData.metadata.recordCounts.users = users.length;
    }

    // Backup token purchases and their contributions (combined operation)
    if (type === 'full' || type === 'purchase-data') {
      // Get all purchases with their contributions to maintain one-to-one relationship
      const tokenPurchases = await prisma.tokenPurchase.findMany({
        include: {
          creator: {
            select: {
              email: true,
              name: true,
            },
          },
          contribution: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Verify constraint compliance before backup
      const purchasesWithoutContributions = tokenPurchases.filter(
        (p) => !p.contribution
      );
      const contributionsWithoutPurchases =
        await prisma.userContribution.findMany({
          where: {
            purchaseId: {
              notIn: tokenPurchases.map((p) => p.id),
            },
          },
        });

      if (
        purchasesWithoutContributions.length > 0 ||
        contributionsWithoutPurchases.length > 0
      ) {
        return NextResponse.json(
          {
            message: 'Data constraint violation detected',
            details: {
              purchasesWithoutContributions:
                purchasesWithoutContributions.length,
              orphanedContributions: contributionsWithoutPurchases.length,
            },
            error:
              'Cannot backup data with constraint violations. Please ensure each purchase has exactly one contribution.',
          },
          { status: 400 }
        );
      }

      backupData.tokenPurchases = tokenPurchases.map((purchase) => ({
        ...purchase,
        contribution: undefined, // Remove contribution from purchase object to avoid duplication
        purchaseDate: purchase.purchaseDate.toISOString(),
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
      }));

      backupData.userContributions = tokenPurchases
        .filter((p) => p.contribution)
        .map((purchase) => ({
          ...purchase.contribution!,
          purchase: undefined, // Remove purchase from contribution object to avoid duplication
          createdAt: purchase.contribution!.createdAt.toISOString(),
          updatedAt: purchase.contribution!.updatedAt.toISOString(),
        }));

      backupData.metadata.recordCounts.tokenPurchases = tokenPurchases.length;
      backupData.metadata.recordCounts.userContributions =
        tokenPurchases.filter((p) => p.contribution).length;
    }

    // Backup meter readings
    if (type === 'full' || type === 'purchase-data') {
      const meterReadings = await prisma.meterReading.findMany({
        orderBy: {
          readingDate: 'asc',
        },
      });

      backupData.meterReadings = meterReadings.map((reading) => ({
        id: reading.id,
        userId: reading.userId,
        reading: reading.reading,
        readingDate: reading.readingDate.toISOString(),
        notes: reading.notes || undefined,
        createdAt: reading.createdAt.toISOString(),
        updatedAt: reading.updatedAt.toISOString(),
      }));

      backupData.metadata.recordCounts.meterReadings = meterReadings.length;
    }

    // Backup accounts (full backup only for security)
    if (type === 'full') {
      const accounts = await prisma.account.findMany();
      backupData.accounts = accounts.map((account) => ({
        id: account.id,
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token || undefined,
        access_token: account.access_token || undefined,
        expires_at: account.expires_at || undefined,
        token_type: account.token_type || undefined,
        scope: account.scope || undefined,
        id_token: account.id_token || undefined,
        session_state: account.session_state || undefined,
      }));
      backupData.metadata.recordCounts.accounts = accounts.length;
    }

    // Backup sessions (full backup only for security)
    if (type === 'full') {
      const sessions = await prisma.session.findMany();
      backupData.sessions = sessions.map((session) => ({
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires.toISOString(),
      }));
      backupData.metadata.recordCounts.sessions = sessions.length;
    }

    // Backup verification tokens (full backup only for security)
    if (type === 'full') {
      const verificationTokens = await prisma.verificationToken.findMany();
      backupData.verificationTokens = verificationTokens.map((token) => ({
        identifier: token.identifier,
        token: token.token,
        expires: token.expires.toISOString(),
      }));
      backupData.metadata.recordCounts.verificationTokens =
        verificationTokens.length;
    }

    // Backup audit logs (optional)
    if (
      includeAuditLogs &&
      (type === 'full' || type === 'users' || type === 'purchase-data')
    ) {
      const auditLogs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 10000, // Limit to last 10,000 audit entries
      });
      backupData.auditLogs = auditLogs;
      backupData.metadata.recordCounts.auditLogs = auditLogs.length;
    }

    const filename = `backup_${type}_${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Restore from backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true, requireAdmin: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const backupData = body as BackupData;

    // Validate backup data structure
    if (!backupData.metadata || !backupData.metadata.timestamp) {
      return NextResponse.json(
        { message: 'Invalid backup file format' },
        { status: 400 }
      );
    }

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

    // Validate backup data constraints before restore
    if (backupData.tokenPurchases && backupData.userContributions) {
      const purchaseIds = new Set(backupData.tokenPurchases.map((p) => p.id));
      const contributionPurchaseIds = new Set(
        backupData.userContributions.map((c) => c.purchaseId)
      );

      // Check for purchases without contributions
      const purchasesWithoutContributions = backupData.tokenPurchases.filter(
        (p) => !contributionPurchaseIds.has(p.id)
      );
      // Check for contributions without purchases
      const contributionsWithoutPurchases = backupData.userContributions.filter(
        (c) => !purchaseIds.has(c.purchaseId)
      );

      if (
        purchasesWithoutContributions.length > 0 ||
        contributionsWithoutPurchases.length > 0
      ) {
        return NextResponse.json(
          {
            message: 'Backup data constraint violation',
            details: {
              purchasesWithoutContributions:
                purchasesWithoutContributions.length,
              contributionsWithoutPurchases:
                contributionsWithoutPurchases.length,
            },
            error:
              'Cannot restore data with constraint violations. Each purchase must have exactly one contribution.',
          },
          { status: 400 }
        );
      }
    }

    // Use transaction for data consistency with constraint validation
    await prisma.$transaction(async (tx) => {
      // Restore users first (required for foreign key relationships)
      if (backupData.users) {
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
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
              },
            });
            results.restored.users++;
          } catch (error) {
            results.errors.push(
              `Failed to restore user ${user.email}: ${error}`
            );
          }
        }
      }

      // Restore purchases and contributions together to maintain constraints
      if (backupData.tokenPurchases && backupData.userContributions) {
        // Create a map of contributions by purchase ID for efficiency
        const contributionMap = new Map(
          backupData.userContributions.map((c) => [c.purchaseId, c])
        );

        for (const purchase of backupData.tokenPurchases) {
          try {
            // Find creator by email
            const creator = await tx.user.findUnique({
              where: { email: purchase.creator.email },
            });

            if (!creator) {
              results.errors.push(
                `Creator not found for purchase ${purchase.id}: ${purchase.creator.email}`
              );
              continue;
            }

            // Get the corresponding contribution
            const contribution = contributionMap.get(purchase.id);
            if (!contribution) {
              results.errors.push(
                `No contribution found for purchase ${purchase.id}`
              );
              continue;
            }

            // Find contribution user by email
            const contributionUser = await tx.user.findUnique({
              where: { email: contribution.user.email },
            });

            if (!contributionUser) {
              results.errors.push(
                `Contribution user not found for purchase ${purchase.id}: ${contribution.user.email}`
              );
              continue;
            }

            // Restore purchase and contribution atomically
            await tx.tokenPurchase.upsert({
              where: { id: purchase.id },
              update: {
                totalTokens: purchase.totalTokens,
                totalPayment: purchase.totalPayment,
                meterReading: purchase.meterReading || 0,
                purchaseDate: new Date(purchase.purchaseDate),
                isEmergency: purchase.isEmergency,
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
            results.errors.push(
              `Failed to restore purchase-contribution pair ${purchase.id}: ${error}`
            );
          }
        }
      }

      // Restore meter readings
      if (backupData.meterReadings) {
        for (const reading of backupData.meterReadings) {
          try {
            await tx.meterReading.upsert({
              where: { id: reading.id },
              update: {
                reading: reading.reading,
                readingDate: new Date(reading.readingDate),
                notes: reading.notes,
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
            results.errors.push(
              `Failed to restore meter reading ${reading.id}: ${error}`
            );
          }
        }
      }

      // Restore accounts
      if (backupData.accounts) {
        for (const account of backupData.accounts) {
          try {
            await tx.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                type: account.type,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
              create: {
                id: account.id,
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
            results.restored.accounts++;
          } catch (error) {
            results.errors.push(
              `Failed to restore account ${account.id}: ${error}`
            );
          }
        }
      }

      // Restore sessions
      if (backupData.sessions) {
        for (const session of backupData.sessions) {
          try {
            await tx.session.upsert({
              where: { sessionToken: session.sessionToken },
              update: {
                userId: session.userId,
                expires: new Date(session.expires),
              },
              create: {
                id: session.id,
                sessionToken: session.sessionToken,
                userId: session.userId,
                expires: new Date(session.expires),
              },
            });
            results.restored.sessions++;
          } catch (error) {
            results.errors.push(
              `Failed to restore session ${session.id}: ${error}`
            );
          }
        }
      }

      // Restore verification tokens
      if (backupData.verificationTokens) {
        for (const token of backupData.verificationTokens) {
          try {
            await tx.verificationToken.upsert({
              where: {
                identifier_token: {
                  identifier: token.identifier,
                  token: token.token,
                },
              },
              update: {
                expires: new Date(token.expires),
              },
              create: {
                identifier: token.identifier,
                token: token.token,
                expires: new Date(token.expires),
              },
            });
            results.restored.verificationTokens++;
          } catch (error) {
            results.errors.push(
              `Failed to restore verification token ${token.identifier}: ${error}`
            );
          }
        }
      }
    });

    // Automatically run balance fix after successful restore
    try {
      const { fixAllAccountBalances } = await import('@/lib/balance-fix');
      console.log('🔧 Running automatic balance fix after restore...');
      await fixAllAccountBalances();
      console.log('✅ Balance fix completed automatically');
    } catch (balanceFixError) {
      console.warn('⚠️ Balance fix failed after restore:', balanceFixError);
      results.errors.push(
        `Balance fix failed: ${balanceFixError instanceof Error ? balanceFixError.message : String(balanceFixError)}`
      );
    }

    return NextResponse.json({
      message: 'Backup restored successfully',
      results,
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { message: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
