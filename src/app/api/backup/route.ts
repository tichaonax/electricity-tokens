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
  role: 'ADMIN' | 'USER';
  locked: boolean;
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
  auditLogs?: Record<string, unknown>[];
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
    console.log('Backup API query params:', Object.fromEntries(request.nextUrl.searchParams.entries()));
    
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
          role: true,
          locked: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      backupData.users = users.map((user) => ({
        ...user,
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
      const purchasesWithoutContributions = tokenPurchases.filter(p => !p.contribution);
      const contributionsWithoutPurchases = await prisma.userContribution.findMany({
        where: {
          purchaseId: {
            notIn: tokenPurchases.map(p => p.id),
          },
        },
      });

      if (purchasesWithoutContributions.length > 0 || contributionsWithoutPurchases.length > 0) {
        return NextResponse.json({
          message: 'Data constraint violation detected',
          details: {
            purchasesWithoutContributions: purchasesWithoutContributions.length,
            orphanedContributions: contributionsWithoutPurchases.length,
          },
          error: 'Cannot backup data with constraint violations. Please ensure each purchase has exactly one contribution.',
        }, { status: 400 });
      }

      backupData.tokenPurchases = tokenPurchases.map((purchase) => ({
        ...purchase,
        contribution: undefined, // Remove contribution from purchase object to avoid duplication
        purchaseDate: purchase.purchaseDate.toISOString(),
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
      }));

      backupData.userContributions = tokenPurchases
        .filter(p => p.contribution)
        .map((purchase) => ({
          ...purchase.contribution!,
          purchase: undefined, // Remove purchase from contribution object to avoid duplication
          createdAt: purchase.contribution!.createdAt.toISOString(),
          updatedAt: purchase.contribution!.updatedAt.toISOString(),
        }));

      backupData.metadata.recordCounts.tokenPurchases = tokenPurchases.length;
      backupData.metadata.recordCounts.userContributions = tokenPurchases.filter(p => p.contribution).length;
    }

    // Backup audit logs (optional)
    if (includeAuditLogs && (type === 'full' || type === 'users' || type === 'purchase-data')) {
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
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
        auditLogs: 0,
      },
      errors: [] as string[],
    };

    // Validate backup data constraints before restore
    if (backupData.tokenPurchases && backupData.userContributions) {
      const purchaseIds = new Set(backupData.tokenPurchases.map(p => p.id));
      const contributionPurchaseIds = new Set(backupData.userContributions.map(c => c.purchaseId));
      
      // Check for purchases without contributions
      const purchasesWithoutContributions = backupData.tokenPurchases.filter(p => !contributionPurchaseIds.has(p.id));
      // Check for contributions without purchases
      const contributionsWithoutPurchases = backupData.userContributions.filter(c => !purchaseIds.has(c.purchaseId));
      
      if (purchasesWithoutContributions.length > 0 || contributionsWithoutPurchases.length > 0) {
        return NextResponse.json({
          message: 'Backup data constraint violation',
          details: {
            purchasesWithoutContributions: purchasesWithoutContributions.length,
            contributionsWithoutPurchases: contributionsWithoutPurchases.length,
          },
          error: 'Cannot restore data with constraint violations. Each purchase must have exactly one contribution.',
        }, { status: 400 });
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
                role: user.role,
                locked: user.locked,
              },
              create: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                locked: user.locked,
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
          backupData.userContributions.map(c => [c.purchaseId, c])
        );

        for (const purchase of backupData.tokenPurchases) {
          try {
            // Find creator by email
            const creator = await tx.user.findUnique({
              where: { email: purchase.creator.email },
            });

            if (!creator) {
              results.errors.push(`Creator not found for purchase ${purchase.id}: ${purchase.creator.email}`);
              continue;
            }

            // Get the corresponding contribution
            const contribution = contributionMap.get(purchase.id);
            if (!contribution) {
              results.errors.push(`No contribution found for purchase ${purchase.id}`);
              continue;
            }

            // Find contribution user by email
            const contributionUser = await tx.user.findUnique({
              where: { email: contribution.user.email },
            });

            if (!contributionUser) {
              results.errors.push(`Contribution user not found for purchase ${purchase.id}: ${contribution.user.email}`);
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
    });

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
