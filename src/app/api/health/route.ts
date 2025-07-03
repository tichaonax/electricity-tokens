import { NextResponse } from 'next/server';
import { SystemMonitor, DatabaseMonitor } from '@/lib/monitoring';

export async function GET() {
  try {
    const healthStatus = await SystemMonitor.getHealthStatus();
    const connectionStats = await DatabaseMonitor.getConnectionStats();

    const response = {
      ...healthStatus,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
      uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
      database: {
        ...healthStatus.checks.database,
        ...connectionStats,
      },
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
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
