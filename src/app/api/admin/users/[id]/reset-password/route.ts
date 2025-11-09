import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const userId = params.id;
    const body = await request.json();
    const { generateTemporary, temporaryPassword } = body;

    if (!generateTemporary || !temporaryPassword) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the temporary password
    const hashedTempPassword = await bcrypt.hash(temporaryPassword, 12);

    // Update user with temporary password and reset flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedTempPassword,
        passwordResetRequired: true,
        updatedAt: new Date(),
      },
    });

    // Create audit log entry using the audit utility
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newValues: {
        action: 'temporary_password_generated',
        targetUserId: userId,
        targetUserEmail: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Temporary password set successfully',
    });
  } catch (error) {
    console.error('Error setting temporary password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}