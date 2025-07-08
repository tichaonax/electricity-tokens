import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the latest meter reading from all users
    const latestReading = await prisma.meterReading.findFirst({
      orderBy: {
        readingDate: 'desc'
      },
      select: {
        id: true,
        reading: true,
        readingDate: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!latestReading) {
      return NextResponse.json({
        reading: null,
        message: 'No meter readings available'
      });
    }

    return NextResponse.json({
      reading: latestReading.reading,
      readingDate: latestReading.readingDate,
      userName: latestReading.user.name,
      message: 'Latest global meter reading'
    });
  } catch (error) {
    console.error('Error fetching latest meter reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}