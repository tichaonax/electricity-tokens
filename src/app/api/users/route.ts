import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UserWhereInput } from '@/types/api';
import { userQuerySchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';

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

    // Validate query parameters
    const validation = await validateRequest(request, {
      query: userQuerySchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { query } = validation.data as {
      query?: {
        page?: number;
        limit?: number;
        role?: string;
        locked?: boolean;
        search?: string;
      };
    };
    const { page = 1, limit = 10, role, locked, search } = query || {};

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: UserWhereInput = {};

    if (role) {
      where.role = role as 'ADMIN' | 'USER';
    }

    if (locked !== undefined) {
      where.locked = locked;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          locked: true,
          isActive: true,
          deactivatedAt: true,
          deactivationReason: true,
          deactivatedBy: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              userContributions: true,
              tokenPurchases: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  sendWelcomeEmail: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
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

    // Validate request body
    const validation = await validateRequest(request, {
      body: createUserSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { name, email, password, role, sendWelcomeEmail } = validation.data.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        locked: false,
        permissions: role === 'ADMIN' ? null : {
          canAddPurchases: true,
          canEditPurchases: false,
          canDeletePurchases: false,
          canAddContributions: true,
          canEditContributions: true,
          canViewUsageReports: true,
          canViewFinancialReports: true,
          canViewEfficiencyReports: true,
          canViewPersonalDashboard: true,
          canViewCostAnalysis: true,
          canExportData: false,
          canImportData: false,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locked: true,
        createdAt: true,
      },
    });

    // Log audit event
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: newUser.id,
      newValues: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    // TODO: Send welcome email if requested
    if (sendWelcomeEmail) {
      // Implement email sending logic here
      console.log(`Welcome email should be sent to ${email}`);
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
