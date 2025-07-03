import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SystemMonitor, DatabaseMonitor } from '@/lib/monitoring';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'System Monitoring - Admin Dashboard',
  description: 'Monitor system health and performance metrics',
};

async function getSystemMetrics() {
  const healthStatus = await SystemMonitor.getHealthStatus();
  const dbStats = await DatabaseMonitor.getConnectionStats();

  return {
    health: healthStatus,
    database: dbStats,
    timestamp: new Date().toISOString(),
  };
}

export default async function MonitoringPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const metrics = await getSystemMetrics();

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Monitoring
          </h1>
          <p className="text-muted-foreground">
            Monitor system health, performance, and database metrics
          </p>
        </div>
        <Badge className={getStatusColor(metrics.health.status)}>
          {metrics.health.status.toUpperCase()}
        </Badge>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(metrics.health.status)}
              <div className="text-2xl font-bold capitalize">
                {metrics.health.status}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(metrics.timestamp).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(
                metrics.health.checks.database?.status || 'unknown'
              )}
              <div className="text-2xl font-bold">
                {metrics.health.checks.database?.latency
                  ? `${Math.round(metrics.health.checks.database.latency)}ms`
                  : 'Connected'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.database.activeConnections !== undefined
                ? `${metrics.database.activeConnections} active connections`
                : 'Connection latency'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(
                metrics.health.checks.environment?.status || 'unknown'
              )}
              <div className="text-2xl font-bold capitalize">
                {process.env.NODE_ENV || 'Unknown'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.health.checks.environment?.status === 'pass'
                ? 'All variables configured'
                : metrics.health.checks.environment?.message}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Health Checks</CardTitle>
          <CardDescription>
            Detailed status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.health.checks).map(([check, result]) => (
              <div
                key={check}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium capitalize">
                      {check.replace('_', ' ')}
                    </div>
                    {result.message && (
                      <div className="text-sm text-muted-foreground">
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {result.latency && (
                    <span className="text-sm text-muted-foreground">
                      {Math.round(result.latency)}ms
                    </span>
                  )}
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics */}
      {(metrics.database.activeConnections !== undefined ||
        metrics.database.poolSize !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>
              Connection pool and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.database.activeConnections !== undefined && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Active Connections</div>
                  <div className="text-2xl font-bold">
                    {metrics.database.activeConnections}
                  </div>
                </div>
              )}
              {metrics.database.poolSize !== undefined && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Total Connections</div>
                  <div className="text-2xl font-bold">
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
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
          <CardDescription>Tips for optimal system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Health Check Endpoint</div>
                <div className="text-sm text-muted-foreground">
                  Monitor <code>/healthz</code> endpoint for automated health
                  checks
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Error Tracking</div>
                <div className="text-sm text-muted-foreground">
                  Sentry integration captures and reports application errors
                  automatically
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Analytics</div>
                <div className="text-sm text-muted-foreground">
                  Vercel Analytics provides privacy-friendly usage insights
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
