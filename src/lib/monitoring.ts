import * as Sentry from '@sentry/nextjs';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  static endTimer(name: string, metadata?: Record<string, unknown>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Log slow operations
    if (duration > 1000) {
      console.warn(
        `Slow operation detected: ${name} took ${duration}ms`,
        metadata
      );

      // Report to Sentry if enabled
      if (process.env.SENTRY_DSN) {
        Sentry.addBreadcrumb({
          message: `Slow operation: ${name}`,
          level: 'warning',
          data: {
            duration,
            ...metadata,
          },
        });
      }
    }

    return duration;
  }

  static recordDatabaseQuery(
    query: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    // Log slow database queries
    if (duration > 500) {
      console.warn(`Slow database query: ${duration}ms`, {
        query,
        ...metadata,
      });

      if (process.env.SENTRY_DSN) {
        Sentry.addBreadcrumb({
          message: 'Slow database query',
          level: 'warning',
          category: 'database',
          data: {
            query,
            duration,
            ...metadata,
          },
        });
      }
    }
  }
}

// Error reporting utilities
export class ErrorReporter {
  static reportError(
    error: Error,
    context?: Record<string, unknown>,
    user?: { id: string; email?: string }
  ): void {
    console.error('Application error:', error, context);

    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (user) {
          scope.setUser({ id: user.id, email: user.email });
        }

        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
        }

        Sentry.captureException(error);
      });
    }
  }

  static reportApiError(
    error: Error,
    request: { method: string; url: string },
    response?: { status: number }
  ): void {
    const context = {
      api_method: request.method,
      api_url: request.url,
      response_status: response?.status,
    };

    this.reportError(error, context);
  }

  static reportDatabaseError(
    error: Error,
    operation: string,
    table?: string
  ): void {
    const context = {
      database_operation: operation,
      database_table: table,
    };

    this.reportError(error, context);
  }
}

// User analytics (privacy-compliant)
export class UserAnalytics {
  static trackPageView(
    page: string,
    user?: { id: string; role: string }
  ): void {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message: 'Page view',
        category: 'navigation',
        data: {
          page,
          user_role: user?.role,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  static trackUserAction(
    action: string,
    category: string,
    user?: { id: string; role: string },
    metadata?: Record<string, unknown>
  ): void {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message: `User action: ${action}`,
        category,
        data: {
          action,
          user_role: user?.role,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      });
    }
  }

  static trackPerformanceMetric(
    metric: string,
    value: number,
    unit: string
  ): void {
    if (process.env.NODE_ENV === 'production') {
      console.log(`Performance metric: ${metric} = ${value}${unit}`);

      if (process.env.SENTRY_DSN) {
        Sentry.addBreadcrumb({
          message: `Performance: ${metric}`,
          category: 'performance',
          data: {
            metric,
            value,
            unit,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  }
}

// Database monitoring
export class DatabaseMonitor {
  static async checkHealth(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = performance.now();

      // Simple health check query
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;

      const latency = performance.now() - startTime;

      return { healthy: true, latency };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';
      ErrorReporter.reportDatabaseError(
        error instanceof Error ? error : new Error(errorMessage),
        'health_check'
      );

      return { healthy: false, error: errorMessage };
    }
  }

  static async getConnectionStats(): Promise<{
    activeConnections?: number;
    poolSize?: number;
    error?: string;
  }> {
    try {
      const { prisma } = await import('@/lib/prisma');

      // Get database stats (PostgreSQL specific)
      const stats = await prisma.$queryRaw<
        Array<{ active: number; total: number }>
      >`
        SELECT 
          COUNT(CASE WHEN state = 'active' THEN 1 END) as active,
          COUNT(*) as total
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      if (stats.length > 0) {
        return {
          activeConnections: Number(stats[0].active),
          poolSize: Number(stats[0].total),
        };
      }

      return {};
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { error: errorMessage };
    }
  }
}

// System health monitoring
export class SystemMonitor {
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<
      string,
      { status: 'pass' | 'fail'; message?: string; latency?: number }
    >;
  }> {
    const checks: Record<
      string,
      { status: 'pass' | 'fail'; message?: string; latency?: number }
    > = {};

    // Database check
    const dbHealth = await DatabaseMonitor.checkHealth();
    checks.database = {
      status: dbHealth.healthy ? 'pass' : 'fail',
      message: dbHealth.error,
      latency: dbHealth.latency,
    };

    // Environment variables check
    const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    const missingEnvVars = requiredEnvVars.filter((env) => !process.env[env]);
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'pass' : 'fail',
      message:
        missingEnvVars.length > 0
          ? `Missing: ${missingEnvVars.join(', ')}`
          : undefined,
    };

    // Memory check (basic)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      const memoryUsageMB = Math.round(memory.heapUsed / 1024 / 1024);
      checks.memory = {
        status: memoryUsageMB < 500 ? 'pass' : 'fail', // Alert if over 500MB
        message: `${memoryUsageMB}MB used`,
      };
    }

    // Determine overall status
    const hasFailures = Object.values(checks).some(
      (check) => check.status === 'fail'
    );
    const status = hasFailures ? 'unhealthy' : 'healthy';

    return { status, checks };
  }
}
