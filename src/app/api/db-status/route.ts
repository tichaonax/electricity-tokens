import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Try to connect to the database
    const userCount = await prisma.user.count();
    
    // If we get here, database is working
    return NextResponse.json({ 
      status: 'connected',
      userCount,
      message: 'Database connection successful' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      error: String(error),
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        code: (error as any).code
      } : null
    }, { status: 500 });
  }
}