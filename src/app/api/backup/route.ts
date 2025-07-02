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
  type: z.enum(['full', 'users', 'purchases', 'contributions']).default('full'),
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
        type: 'full' | 'users' | 'purchases' | 'contributions';
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

    // Backup token purchases
    if (type === 'full' || type === 'purchases') {
      const tokenPurchases = await prisma.tokenPurchase.findMany({
        include: {
          creator: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
      backupData.tokenPurchases = tokenPurchases.map((purchase) => ({
        ...purchase,
        purchaseDate: purchase.purchaseDate.toISOString(),
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
      }));
      backupData.metadata.recordCounts.tokenPurchases = tokenPurchases.length;
    }

    // Backup user contributions
    if (type === 'full' || type === 'contributions') {
      const userContributions = await prisma.userContribution.findMany({
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
          purchase: {
            select: {
              purchaseDate: true,
              totalTokens: true,
              totalPayment: true,
              isEmergency: true,
            },
          },
        },
      });
      backupData.userContributions = userContributions.map((contribution) => ({
        ...contribution,
        createdAt: contribution.createdAt.toISOString(),
        updatedAt: contribution.updatedAt.toISOString(),
      }));
      backupData.metadata.recordCounts.userContributions =
        userContributions.length;
    }

    // Backup audit logs (optional)
    if (includeAuditLogs && (type === 'full' || type === 'users' || type === 'purchases' || type === 'contributions')) {
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

    // Use transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Restore users
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

      // Restore token purchases
      if (backupData.tokenPurchases) {
        for (const purchase of backupData.tokenPurchases) {
          try {
            // Find creator by email
            const creator = await tx.user.findUnique({
              where: { email: purchase.creator.email },
            });

            if (creator) {
              await tx.tokenPurchase.upsert({
                where: { id: purchase.id },
                update: {
                  totalTokens: purchase.totalTokens,
                  totalPayment: purchase.totalPayment,
                  purchaseDate: new Date(purchase.purchaseDate),
                  isEmergency: purchase.isEmergency,
                },
                create: {
                  id: purchase.id,
                  totalTokens: purchase.totalTokens,
                  totalPayment: purchase.totalPayment,
                  meterReading: purchase.meterReading || 0, // Add meterReading field
                  purchaseDate: new Date(purchase.purchaseDate),
                  isEmergency: purchase.isEmergency,
                  createdBy: creator.id,
                  createdAt: new Date(purchase.createdAt),
                  updatedAt: new Date(purchase.updatedAt),
                },
              });
              results.restored.tokenPurchases++;
            }
          } catch (error) {
            results.errors.push(
              `Failed to restore purchase ${purchase.id}: ${error}`
            );
          }
        }
      }

      // Restore user contributions
      if (backupData.userContributions) {
        for (const contribution of backupData.userContributions) {
          try {
            // Find user by email
            const user = await tx.user.findUnique({
              where: { email: contribution.user.email },
            });

            if (user) {
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
                  userId: user.id,
                  contributionAmount: contribution.contributionAmount,
                  meterReading: contribution.meterReading,
                  tokensConsumed: contribution.tokensConsumed,
                  createdAt: new Date(contribution.createdAt),
                  updatedAt: new Date(contribution.updatedAt),
                },
              });
              results.restored.userContributions++;
            }
          } catch (error) {
            results.errors.push(
              `Failed to restore contribution ${contribution.id}: ${error}`
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
