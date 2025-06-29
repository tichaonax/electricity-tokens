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
import { auditUpdate, auditDelete, auditPermissionChange, auditAccountLockChange } from '@/lib/audit';
import { withAdminSecurity, type SecurityContext } from '@/lib/security-middleware';
import { SecurityValidator, SecurityLogger } from '@/lib/security';

async function secureGetHandler(
  request: NextRequest,
  context: SecurityContext,
  params: { id: string }
): Promise<NextResponse> {
  const { id } = params;
  
  try {
    // Validate and sanitize the ID parameter
    const idValidation = SecurityValidator.sanitizeInput(id);
    if (!idValidation || idValidation.length !== id.length) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'INVALID_INPUT',
          { reason: 'Invalid user ID format', originalId: id, sanitizedId: idValidation },
          request,
          'MEDIUM'
        )
      );
      
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Validate session and permissions
    const permissionCheck = await checkPermissions(request, 'admin');
    if (!permissionCheck.authorized) {
      return permissionCheck.response;
    }

    // Validate ID parameter format
    const validation = await validateRequest(request, {
      params: idParamSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation.errors);
    }

    const user = await prisma.user.findUnique({
      where: { id },
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    await SecurityLogger.logSecurityEvent(
      SecurityLogger.createSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        { 
          reason: 'Error in user fetch operation',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: id
        },
        request,
        'MEDIUM'
      )
    );

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

async function securePutHandler(
  request: NextRequest,
  context: SecurityContext,
  params: { id: string }
): Promise<NextResponse> {
  const { id } = params;

  try {
    // Use sanitized body from security middleware if available
    const body = context.sanitizedBody || await request.json();

    // Validate session and permissions
    const permissionCheck = await checkPermissions(request, 'admin');
    if (!permissionCheck.authorized) {
      return permissionCheck.response;
    }

    // Validate request data
    const validation = await validateRequest(request, {
      body: updateUserSchema,
      params: idParamSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation.errors);
    }

    const { name, role, locked, permissions } = body as UpdateData;

    // Additional security validation for role changes
    if (role && !['ADMIN', 'USER'].includes(role)) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'INVALID_INPUT',
          { 
            reason: 'Invalid role value attempted',
            attemptedRole: role,
            userId: id
          },
          request,
          'HIGH'
        )
      );

      return NextResponse.json(
        { error: 'Invalid role value' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-modification of critical properties
    if (existingUser.id === permissionCheck.user!.id) {
      if (role === 'USER' && existingUser.role === 'ADMIN') {
        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'SUSPICIOUS_ACTIVITY',
            { 
              reason: 'Admin attempted to demote themselves',
              userId: id
            },
            request,
            'HIGH'
          )
        );

        return NextResponse.json(
          { error: 'Cannot demote your own admin account' },
          { status: 403 }
        );
      }

      if (locked === true) {
        await SecurityLogger.logSecurityEvent(
          SecurityLogger.createSecurityEvent(
            'SUSPICIOUS_ACTIVITY',
            { 
              reason: 'Admin attempted to lock their own account',
              userId: id
            },
            request,
            'HIGH'
          )
        );

        return NextResponse.json(
          { error: 'Cannot lock your own account' },
          { status: 403 }
        );
      }
    }

    // Additional validation for permissions object
    if (permissions && typeof permissions !== 'object') {
      return NextResponse.json(
        { error: 'Invalid permissions format' },
        { status: 400 }
      );
    }

    // Sanitize the update data
    const updateData: UpdateData = {};
    if (name !== undefined) updateData.name = SecurityValidator.sanitizeInput(name);
    if (role !== undefined) updateData.role = role;
    if (locked !== undefined) updateData.locked = locked;
    if (permissions !== undefined) updateData.permissions = permissions;

    const updatedUser = await prisma.user.update({
      where: { id },
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
    const ipAddress = request.headers.get('x-forwarded-for') || 
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
      await auditAccountLockChange(
        auditContext,
        id,
        Boolean(locked),
        { 
          targetUserName: existingUser.name,
          reason: locked ? 'Account locked by admin' : 'Account unlocked by admin'
        }
      );
    }

    // General audit log for other changes
    if (name !== undefined || role !== undefined) {
      await auditUpdate(
        auditContext,
        'User',
        id,
        existingUser,
        updatedUser,
        { 
          targetUserName: existingUser.name,
          changesType: 'profile_update'
        }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    await SecurityLogger.logSecurityEvent(
      SecurityLogger.createSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        { 
          reason: 'Error in user update operation',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: id
        },
        request,
        'HIGH'
      )
    );

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

async function secureDeleteHandler(
  request: NextRequest,
  context: SecurityContext,
  params: { id: string }
): Promise<NextResponse> {
  const { id } = params;

  try {
    // Validate session and permissions
    const permissionCheck = await checkPermissions(request, 'admin');
    if (!permissionCheck.authorized) {
      return permissionCheck.response;
    }

    // Validate ID parameter
    const validation = await validateRequest(request, {
      params: idParamSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation.errors);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contributions: true,
            createdPurchases: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (existingUser.id === permissionCheck.user!.id) {
      await SecurityLogger.logSecurityEvent(
        SecurityLogger.createSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          { 
            reason: 'Admin attempted to delete their own account',
            userId: id
          },
          request,
          'HIGH'
        )
      );

      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // Check if user has associated data
    if (existingUser._count.contributions > 0 || existingUser._count.createdPurchases > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with associated contributions or purchases' },
        { status: 409 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: id },
    });

    // Extract IP and User Agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
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
        reason: 'Account deleted by admin'
      }
    );

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    
    await SecurityLogger.logSecurityEvent(
      SecurityLogger.createSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        { 
          reason: 'Error in user deletion operation',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: id
        },
        request,
        'HIGH'
      )
    );

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// Apply security middleware to all route handlers
export const GET = withAdminSecurity(async (request: NextRequest, context: SecurityContext) => {
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }
  
  return secureGetHandler(request, context, { id });
});

export const PUT = withAdminSecurity(async (request: NextRequest, context: SecurityContext) => {
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }
  
  return securePutHandler(request, context, { id });
});

export const DELETE = withAdminSecurity(async (request: NextRequest, context: SecurityContext) => {
  const { pathname } = new URL(request.url);
  const id = pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }
  
  return secureDeleteHandler(request, context, { id });
});