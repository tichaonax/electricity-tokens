import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AuditWhereInput } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can access audit logs
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: AuditWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action && ['CREATE', 'UPDATE', 'DELETE'].includes(action)) {
      where.action = action as 'CREATE' | 'UPDATE' | 'DELETE';
    }

    if (
      entityType &&
      ['User', 'TokenPurchase', 'UserContribution'].includes(entityType)
    ) {
      where.entityType = entityType as
        | 'User'
        | 'TokenPurchase'
        | 'UserContribution';
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format the audit logs for better readability
    const formattedLogs = auditLogs.map((log) => ({
      id: log.id,
      user: log.user,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.timestamp,
      changes: formatChanges(log.action, log.oldValues, log.newValues),
      oldValues: log.oldValues,
      newValues: log.newValues,
    }));

    return NextResponse.json({
      auditLogs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatChanges(action: string, oldValues: unknown, newValues: unknown) {
  if (action === 'CREATE') {
    return {
      summary: 'Record created',
      details: newValues,
    };
  }

  if (action === 'DELETE') {
    return {
      summary: 'Record deleted',
      details: oldValues,
    };
  }

  if (action === 'UPDATE' && oldValues && newValues) {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const changedFields: string[] = [];

    // Type assertion for object comparison
    const oldData = oldValues as Record<string, unknown>;
    const newData = newValues as Record<string, unknown>;

    // Compare old and new values
    for (const key in newData) {
      if (key === 'updatedAt' || key === 'id') continue; // Skip system fields

      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          from: oldData[key],
          to: newData[key],
        };
        changedFields.push(key);
      }
    }

    return {
      summary: `Updated fields: ${changedFields.join(', ')}`,
      details: changes,
    };
  }

  return {
    summary: 'No change details available',
    details: null,
  };
}
