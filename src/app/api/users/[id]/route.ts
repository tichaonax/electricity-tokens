import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UpdateData } from '@/types/api';
import { updateUserSchema, idParamSchema } from '@/lib/validations';
import {
  validateRequest,
  createValidationErrorResponse,
  sanitizeInput,
  checkPermissions,
} from '@/lib/validation-middleware';
import {
  auditUpdate,
  auditDelete,
  auditPermissionChange,
  auditAccountLockChange,
} from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate route parameters
    const validation = await validateRequest(
      request,
      {
        params: idParamSchema,
      },
      { id }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    // Users can view their own profile, admins can view any profile
    if (
      permissionCheck.user!.id !== id &&
      permissionCheck.user!.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only view your own profile' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locked: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contributions: true,
            createdPurchases: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Validate request body and parameters
    const validation = await validateRequest(
      request,
      {
        body: updateUserSchema,
        params: idParamSchema,
      },
      { id }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: {
        name?: string;
        role?: string;
        locked?: boolean;
        permissions?: Record<string, boolean>;
        resetPassword?: boolean;
      };
    };
    const sanitizedData = sanitizeInput(body);
    const { name, role, locked, permissions, resetPassword } =
      sanitizedData as {
        name?: string;
        role?: string;
        locked?: boolean;
        permissions?: Record<string, boolean>;
        resetPassword?: boolean;
      };

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Permission checks
    const isOwnProfile = permissionCheck.user!.id === id;
    const isAdmin = permissionCheck.user!.role === 'ADMIN';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: UpdateData = {};

    // Name can be updated by user or admin
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Role can only be updated by admin
    if (role !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Only admins can change user roles' },
          { status: 403 }
        );
      }

      // Prevent admin from removing their own admin role if they're the only admin
      if (isOwnProfile && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN' },
        });

        if (adminCount <= 1) {
          return NextResponse.json(
            { message: 'Cannot remove admin role - you are the only admin' },
            { status: 400 }
          );
        }
      }

      updateData.role = role;
    }

    // Locked status can only be updated by admin
    if (locked !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Only admins can lock/unlock users' },
          { status: 403 }
        );
      }

      // Prevent admin from locking themselves
      if (isOwnProfile && locked === true) {
        return NextResponse.json(
          { message: 'Cannot lock your own account' },
          { status: 400 }
        );
      }

      updateData.locked = Boolean(locked);
    }

    // Permissions can only be updated by admin
    if (permissions !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Only admins can change user permissions' },
          { status: 403 }
        );
      }

      // Validate permissions object structure
      if (typeof permissions === 'object' && permissions !== null) {
        updateData.permissions = permissions;
      }
    }

    // Password reset can only be triggered by admin
    if (resetPassword !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Only admins can force password resets' },
          { status: 403 }
        );
      }

      if (resetPassword === true) {
        updateData.passwordResetRequired = true;
        updateData.passwordResetAt = new Date();
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locked: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contributions: true,
            createdPurchases: true,
          },
        },
      },
    });

    // Extract IP and User Agent for audit logging
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const auditContext = {
      userId: permissionCheck.user!.id,
      ipAddress,
      userAgent,
    };

    // Create specific audit logs for different types of changes
    if (permissions !== undefined) {
      await auditPermissionChange(
        auditContext,
        id,
        { permissions: existingUser.permissions },
        { permissions: updatedUser.permissions },
        { changedBy: permissionCheck.user!.name }
      );
    }

    if (locked !== undefined) {
      await auditAccountLockChange(auditContext, id, Boolean(locked), {
        targetUserName: existingUser.name,
        reason: locked
          ? 'Account locked by admin'
          : 'Account unlocked by admin',
      });
    }

    // General audit log for other changes
    if (name !== undefined || role !== undefined) {
      await auditUpdate(auditContext, 'User', id, existingUser, updatedUser, {
        targetUserName: existingUser.name,
        changesType: 'profile_update',
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Validate route parameters
    const validation = await validateRequest(
      request,
      {
        params: idParamSchema,
      },
      { id }
    );

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
      include: {
        contributions: true,
        createdPurchases: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (permissionCheck.user!.id === id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deletion if user has contributions or purchases
    if (
      existingUser.contributions.length > 0 ||
      existingUser.createdPurchases.length > 0
    ) {
      return NextResponse.json(
        {
          message:
            'Cannot delete user with existing contributions or purchases',
        },
        { status: 400 }
      );
    }

    // Check if this is the last admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id: id },
    });

    // Extract IP and User Agent for audit logging
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log entry using centralized utility
    await auditDelete(
      {
        userId: permissionCheck.user!.id,
        ipAddress,
        userAgent,
      },
      'User',
      id,
      existingUser,
      {
        deletedUserName: existingUser.name,
        deletedUserEmail: existingUser.email,
        reason: 'Account deleted by admin',
      }
    );

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
