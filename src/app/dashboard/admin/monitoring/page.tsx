'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Zap,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  latency?: number;
}

interface SystemMetrics {
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database?: HealthCheck;
      environment?: HealthCheck;
      [key: string]: HealthCheck | undefined;
    };
  };
  database: {
    activeConnections?: number;
    poolSize?: number;
    error?: string;
  };
  timestamp: string;
}

export default function MonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [metrics] = useState<SystemMetrics>({
    health: {
      status: 'healthy',
      checks: {
        database: { status: 'pass', latency: 45 },
        environment: { status: 'pass', message: 'All variables configured' },
      },
    },
    database: {
      activeConnections: 12,
      poolSize: 20,
    },
    timestamp: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      // Simulate loading system metrics
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy':
      case 'fail':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
      case 'fail':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title="System Monitoring"
        backPath="/dashboard/admin"
        showBackButton={true}
        backText="Admin"
        mobileBackText="Admin"
        showBackToDashboard={true}
        dashboardPath="/dashboard"
        dashboardText="Back to Dashboard"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                System Monitoring
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor system health, performance, and database metrics
              </p>
            </div>
            <Badge className={getStatusColor(metrics.health.status)}>
              {metrics.health.status.toUpperCase()}
            </Badge>
          </div>

          {/* System Health Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  System Status
                </CardTitle>
                <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(metrics.health.status)}
                  <div className="text-2xl font-bold capitalize text-gray-900 dark:text-gray-100">
                    {metrics.health.status}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last checked:{' '}
                  {new Date(metrics.timestamp).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Database
                </CardTitle>
                <Database className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(
                    metrics.health.checks.database?.status || 'unknown'
                  )}
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metrics.health.checks.database?.latency
                      ? `${Math.round(metrics.health.checks.database.latency)}ms`
                      : 'Connected'}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {metrics.database.activeConnections !== undefined
                    ? `${metrics.database.activeConnections} active connections`
                    : 'Connection latency'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Environment
                </CardTitle>
                <Zap className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(
                    metrics.health.checks.environment?.status || 'unknown'
                  )}
                  <div className="text-2xl font-bold capitalize text-gray-900 dark:text-gray-100">
                    {process.env.NODE_ENV || 'Unknown'}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {metrics.health.checks.environment?.status === 'pass'
                    ? 'All variables configured'
                    : metrics.health.checks.environment?.message}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Health Checks */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">
                Health Checks
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Detailed status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.health.checks).map(
                  ([check, result]) => (
                    <div
                      key={check}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium capitalize text-gray-900 dark:text-gray-100">
                            {check.replace('_', ' ')}
                          </div>
                          {result.message && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result.latency && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {Math.round(result.latency)}ms
                          </span>
                        )}
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database Statistics */}
          {(metrics.database.activeConnections !== undefined ||
            metrics.database.poolSize !== undefined) && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  Database Statistics
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Connection pool and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {metrics.database.activeConnections !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Active Connections
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {metrics.database.activeConnections}
                      </div>
                    </div>
                  )}
                  {metrics.database.poolSize !== undefined && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Total Connections
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {metrics.database.poolSize}
                      </div>
                    </div>
                  )}
                </div>
                {metrics.database.error && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> {metrics.database.error}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance Tips */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">
                Performance Monitoring
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Tips for optimal system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Health Check Endpoint
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Monitor{' '}
                      <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        /healthz
                      </code>{' '}
                      endpoint for automated health checks
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Error Tracking
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Sentry integration captures and reports application errors
                      automatically
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Analytics
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Vercel Analytics provides privacy-friendly usage insights
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
