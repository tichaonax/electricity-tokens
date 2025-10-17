import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public health check endpoint - NO AUTHENTICATION REQUIRED
 *
 * This endpoint is specifically designed for automated monitoring by the
 * Windows service and does not require user authentication.
 *
 * Returns:
 * - status: 'healthy' when database is connected
 * - status: 'degraded' when database is disconnected but app is running
 *
 * The service monitor accepts both 'healthy' and 'degraded' as passing states.
 */
export async function GET() {
  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ElectricityTracker',
      database: 'connected',
    });
  } catch (error) {
    // App is running but database has issues - this is "degraded" not "unhealthy"
    // Return 200 so the service monitor knows the app is still responding
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        service: 'ElectricityTracker',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    ); // Still return 200, not 503
  }
}
