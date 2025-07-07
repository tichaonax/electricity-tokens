import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const queryAuditLogsSchema = z.object({
  page: z.string().nullable().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().nullable().transform((val) => val ? parseInt(val, 10) : 50),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      entityType: searchParams.get('entityType'),
      entityId: searchParams.get('entityId'),
      action: searchParams.get('action'),
      userId: searchParams.get('userId'),
    };

    const validation = queryAuditLogsSchema.safeParse(queryData);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, entityType, entityId, action, userId } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;

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

    return NextResponse.json({
      auditLogs,
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
      { message: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}