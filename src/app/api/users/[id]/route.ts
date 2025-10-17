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
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Users can view their own profile, admins can view any profile
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
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
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userContributions: true,
            tokenPurchases: true,
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
  let updateData: UpdateData = {};
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    const sanitizedData = sanitizeInput(body);
    const { name, email, role, locked, permissions, resetPassword } =
      sanitizedData as {
        name?: string;
        email?: string;
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
    const isOwnProfile = session.user.id === id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      );
    }

    // Build update data (initialized outside try block for error logging)
    // const updateData: UpdateData = {}; // Moved outside try block

    // Name can be updated by user or admin
    if (name !== undefined) {
      const trimmedName = name.trim();
      
      // Validate name is not empty
      if (!trimmedName) {
        return NextResponse.json(
          { message: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      
      updateData.name = trimmedName;
    }

    // Email can only be updated by admin
    if (email !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Only admins can change email addresses' },
          { status: 403 }
        );
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      // Validate email is not empty
      if (!trimmedEmail) {
        return NextResponse.json(
          { message: 'Email address cannot be empty' },
          { status: 400 }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { message: 'Invalid email address format' },
          { status: 400 }
        );
      }

      // Check if email is already in use by another user
      if (trimmedEmail !== existingUser.email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (existingEmailUser) {
          return NextResponse.json(
            { message: 'Email address is already in use by another user' },
            { status: 409 }
          );
        }
      }

      updateData.email = trimmedEmail;
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
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userContributions: true,
            tokenPurchases: true,
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
      userId: session.user.id,
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
        { changedBy: session.user.name }
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
    if (name !== undefined || role !== undefined || email !== undefined) {
      await auditUpdate(auditContext, 'User', id, existingUser, updatedUser, {
        targetUserName: existingUser.name,
        changesType: 'profile_update',
        emailChanged: email !== undefined,
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      updateData,
      userId: id,
    });
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: 'Email address is already in use' },
          { status: 409 }
        );
      }
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
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
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
      include: {
        userContributions: true,
        tokenPurchases: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Prevent deletion if user has contributions or purchases
    if (
      existingUser.userContributions.length > 0 ||
      existingUser.tokenPurchases.length > 0
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
        userId: session.user.id,
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
