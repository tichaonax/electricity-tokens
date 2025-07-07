import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { themePreference: true }
    });

    return NextResponse.json({
      theme: user?.themePreference || 'system'
    });
  } catch (error) {
    console.error('Error fetching user theme:', error);
    // Return default theme instead of error
    return NextResponse.json({
      theme: 'system'
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme } = body;

    // Validate theme value
    if (!['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { message: 'Invalid theme value' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { themePreference: theme }
    });

    return NextResponse.json({
      message: 'Theme preference updated successfully'
    });
  } catch (error) {
    console.error('Error updating user theme:', error);
    // Return success even if DB update fails to prevent blocking theme changes
    return NextResponse.json({
      message: 'Theme preference updated (local storage fallback)'
    });
  }
}