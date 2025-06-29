import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UpdateData } from '@/types/api';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Users can view their own profile, admins can view any profile
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: You can only view your own profile' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locked: true,
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

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, role, locked } = await request.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Permission checks
    const isOwnProfile = session.user.id === params.id;
    const isAdmin = session.user.role === 'ADMIN';

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
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { message: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
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

      if (!['ADMIN', 'USER'].includes(role)) {
        return NextResponse.json(
          { message: 'Invalid role. Must be ADMIN or USER' },
          { status: 400 }
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

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locked: true,
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

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: params.id,
        oldValues: existingUser,
        newValues: updatedUser,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        contributions: true,
        createdPurchases: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (session.user.id === params.id) {
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
      where: { id: params.id },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'User',
        entityId: params.id,
        oldValues: existingUser,
      },
    });

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
