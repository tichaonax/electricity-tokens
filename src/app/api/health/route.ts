import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple database connectivity check
    let databaseHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }

    const response = {
      status: databaseHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
      environment: process.env.NODE_ENV,
      database: {
        connected: databaseHealthy,
      },
    };

    // Return 200 even if database is degraded - the app is still running
    // Only return 503 if the app itself is truly unresponsive
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check system failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
