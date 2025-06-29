import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AuditWhereInput } from '@/types/api';
import { auditQuerySchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permission
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true, requireAdmin: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Check if this is an export request
    const { searchParams } = new URL(request.url);
    const isExport = searchParams.get('export') === 'csv';

    // Validate query parameters
    const validation = await validateRequest(request, {
      query: auditQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query?: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        entityType?: string;
        entityId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
      };
    };
    const {
      page = 1,
      limit = isExport ? 10000 : 20, // Higher limit for exports
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      search,
    } = query || {};

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: AuditWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action as 'CREATE' | 'UPDATE' | 'DELETE';
    }

    if (entityType) {
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

    // Add search functionality
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          action: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          entityType: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
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
        skip: isExport ? 0 : skip, // No pagination for exports
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format the audit logs for better readability
    const formattedLogs = auditLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Unknown User',
      userEmail: log.user?.email || 'Unknown Email',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.timestamp,
      changes: formatChanges(log.action, log.oldValues, log.newValues),
      oldValues: log.oldValues,
      newValues: log.newValues,
      metadata: log.metadata,
    }));

    // Handle CSV export
    if (isExport) {
      const csvContent = generateCSV(formattedLogs);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      logs: formattedLogs,
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

function generateCSV(logs: any[]): string {
  if (logs.length === 0) {
    return 'No data available';
  }

  // CSV headers
  const headers = [
    'Timestamp',
    'User Name',
    'User Email',
    'Action',
    'Entity Type',
    'Entity ID',
    'Summary',
    'IP Address',
    'User Agent',
    'Details'
  ];

  // Convert logs to CSV rows
  const rows = logs.map(log => {
    const timestamp = new Date(log.timestamp).toISOString();
    const summary = log.changes?.summary || '';
    const ipAddress = log.metadata?.ipAddress || '';
    const userAgent = log.metadata?.userAgent || '';
    const details = JSON.stringify(log.changes?.details || {});

    return [
      timestamp,
      log.userName,
      log.userEmail,
      log.action,
      log.entityType,
      log.entityId,
      summary,
      ipAddress,
      userAgent,
      details
    ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Escape quotes
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csvContent;
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
