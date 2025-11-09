import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Track server start time for accurate uptime calculation
const serverStartTime = Date.now();

/**
 * Format uptime in seconds to human-readable format
 * @param seconds - Uptime in seconds
 * @returns Formatted string like "2d 5h 23m" or "5h 23m" or "23m"
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : 'Just started';
}

export async function GET(request: Request) {
  // Check if this is from the health monitor service
  const userAgent = request.headers.get('user-agent') || '';
  const isHealthMonitorService = userAgent.includes('ElectricityTracker-HealthMonitor');

  try {
    // Simple database connectivity check
    let databaseHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch (dbError) {
      // Only log database errors if not from health monitor (reduce log spam)
      if (!isHealthMonitorService) {
        console.error('Database health check failed:', dbError);
      }
    }

    const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : 0;

    const response = {
      status: databaseHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
      uptimeFormatted: formatUptime(uptimeSeconds),
      startTime: new Date(serverStartTime).toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: databaseHealthy,
      },
    };

    // Return 200 even if database is degraded - the app is still running
    // Only return 503 if the app itself is truly unresponsive
    // Add caching headers to reduce server load (30 second cache)
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
        'CDN-Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error) {
    // Only log errors if not from health monitor (reduce log spam)
    if (!isHealthMonitorService) {
      console.error('Health check failed:', error);
    }

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
