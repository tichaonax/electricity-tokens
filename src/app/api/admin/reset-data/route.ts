import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmReset, confirmMessage } = body;

    // Require explicit confirmation
    if (!confirmReset || confirmMessage !== 'I understand this will permanently delete all purchase and contribution data') {
      return NextResponse.json(
        { message: 'Confirmation required. Please confirm you understand this action cannot be undone.' },
        { status: 400 }
      );
    }

    console.log(`🚨 Data reset initiated by ${session.user.name} (${session.user.email})`);

    // Start transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get counts before deletion for audit trail
      const beforeCounts = {
        purchases: await tx.tokenPurchase.count(),
        contributions: await tx.userContribution.count(),
        users: await tx.user.count(),
      };

      console.log(`📊 Before reset: ${beforeCounts.purchases} purchases, ${beforeCounts.contributions} contributions, ${beforeCounts.users} users`);

      // Get sample of data being deleted for audit trail
      const samplePurchases = await tx.tokenPurchase.findMany({
        take: 5,
        select: {
          id: true,
          totalTokens: true,
          totalPayment: true,
          purchaseDate: true,
          isEmergency: true,
        },
        orderBy: { purchaseDate: 'desc' }
      });

      const sampleContributions = await tx.userContribution.findMany({
        take: 5,
        select: {
          id: true,
          contributionAmount: true,
          tokensConsumed: true,
          userId: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      // Delete all user contributions first (due to foreign key constraints)
      console.log('🗑️ Deleting all user contributions...');
      const deletedContributions = await tx.userContribution.deleteMany({});
      console.log(`✅ Deleted ${deletedContributions.count} contributions`);

      // Delete all token purchases
      console.log('🗑️ Deleting all token purchases...');
      const deletedPurchases = await tx.tokenPurchase.deleteMany({});
      console.log(`✅ Deleted ${deletedPurchases.count} purchases`);

      // Verify deletion
      const afterCounts = {
        purchases: await tx.tokenPurchase.count(),
        contributions: await tx.userContribution.count(),
        users: await tx.user.count(),
      };

      console.log(`📊 After reset: ${afterCounts.purchases} purchases, ${afterCounts.contributions} contributions, ${afterCounts.users} users`);

      // Create audit log entry for this critical action
      await createAuditLog({
        userId: session.user.id!,
        action: 'SYSTEM_DATA_RESET',
        entityType: 'System',
        entityId: 'data-reset-' + Date.now(),
        oldValues: {
          beforeCounts,
          sampleDeletedPurchases: samplePurchases,
          sampleDeletedContributions: sampleContributions,
          totalItemsDeleted: beforeCounts.purchases + beforeCounts.contributions,
        },
        newValues: {
          afterCounts,
          resetTimestamp: new Date().toISOString(),
          resetBy: {
            userId: session.user.id,
            userName: session.user.name,
            userEmail: session.user.email,
          },
          confirmationMessage: confirmMessage,
          dataPreserved: {
            users: afterCounts.users,
            auditLogs: 'preserved',
            accounts: 'preserved',
            sessions: 'preserved',
          }
        },
      });

      return {
        success: true,
        deletedCounts: {
          purchases: deletedPurchases.count,
          contributions: deletedContributions.count,
        },
        beforeCounts,
        afterCounts,
        preservedData: {
          users: afterCounts.users,
          auditLogs: 'All audit logs preserved',
        }
      };
    });

    console.log('✅ Data reset completed successfully');

    return NextResponse.json({
      message: 'Data reset completed successfully',
      details: result,
      warning: 'All token purchases and contributions have been permanently deleted. Users and audit logs have been preserved.',
    });

  } catch (error) {
    console.error('❌ Data reset failed:', error);

    // Log the failed attempt
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        await createAuditLog({
          userId: session.user.id!,
          action: 'SYSTEM_DATA_RESET_FAILED',
          entityType: 'System',
          entityId: 'data-reset-failed-' + Date.now(),
          oldValues: null,
          newValues: {
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
            attemptedBy: {
              userId: session.user.id,
              userName: session.user.name,
              userEmail: session.user.email,
            }
          },
        });
      }
    } catch (auditError) {
      console.error('Failed to log data reset failure:', auditError);
    }

    return NextResponse.json(
      { 
        message: 'Data reset failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'The data reset operation could not be completed. No data has been deleted.'
      },
      { status: 500 }
    );
  }
}