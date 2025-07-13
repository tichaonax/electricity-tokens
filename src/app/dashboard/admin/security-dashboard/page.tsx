'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  userName?: string;
}

interface RealTimeMetrics {
  activeUsers: number;
  activeSessions: number;
  rateLimitViolations: number;
  suspiciousActivity: number;
  blockedRequests: number;
  securityEvents: SecurityEvent[];
  systemLoad: number;
  responseTime: number;
  uptime: string;
  lastSecurityScan: string;
}

export default function SecurityDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    activeSessions: 0,
    rateLimitViolations: 0,
    suspiciousActivity: 0,
    blockedRequests: 0,
    securityEvents: [],
    systemLoad: 0,
    responseTime: 0,
    uptime: '',
    lastSecurityScan: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchRealtimeMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate real-time security metrics (in real implementation, this would be from an API)
      const mockData: RealTimeMetrics = {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        activeSessions: Math.floor(Math.random() * 80) + 20,
        rateLimitViolations: Math.floor(Math.random() * 5),
        suspiciousActivity: Math.floor(Math.random() * 3),
        blockedRequests: Math.floor(Math.random() * 20) + 5,
        systemLoad: Math.floor(Math.random() * 30) + 20,
        responseTime: Math.floor(Math.random() * 100) + 50,
        uptime: '99.98%',
        lastSecurityScan: new Date(
          Date.now() - Math.random() * 3600000
        ).toISOString(),
        securityEvents: [
          {
            id: '1',
            type: 'Rate Limit Exceeded',
            severity: 'MEDIUM',
            description: 'Multiple rapid requests from IP 192.168.1.100',
            timestamp: new Date(
              Date.now() - Math.random() * 600000
            ).toISOString(),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
          },
          {
            id: '2',
            type: 'Failed Authentication',
            severity: 'HIGH',
            description: 'Multiple failed login attempts detected',
            timestamp: new Date(
              Date.now() - Math.random() * 900000
            ).toISOString(),
            ipAddress: '10.0.0.55',
            userAgent: 'curl/7.68.0',
          },
          {
            id: '3',
            type: 'Suspicious Pattern',
            severity: 'LOW',
            description: 'Unusual access pattern detected',
            timestamp: new Date(
              Date.now() - Math.random() * 1200000
            ).toISOString(),
            ipAddress: '172.16.0.22',
            userAgent: 'Python-requests/2.28.1',
          },
        ],
      };

      setMetrics(mockData);
    } catch {
      setError('Failed to load real-time security metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchRealtimeMetrics();

      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchRealtimeMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, fetchRealtimeMetrics]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
  };

  const getMetricTrend = (value: number, threshold: number) => {
    if (value > threshold) {
      return { icon: TrendingUp, color: 'text-red-500 dark:text-red-400' };
    }
    return { icon: TrendingDown, color: 'text-green-500 dark:text-green-400' };
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title="Security Dashboard"
        backPath="/dashboard/admin"
        showBackButton={true}
        backText="Admin"
        mobileBackText="Admin"
        showBackToDashboard={true}
        dashboardPath="/dashboard"
        dashboardText="Back to Dashboard"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Real-Time Security Dashboard
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Live monitoring of security threats, system performance, and
                  user activity.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Live
                </span>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Real-Time Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Active Users
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics.activeUsers}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Currently online
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Rate Limit Violations
                </CardTitle>
                <Shield className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {metrics.rateLimitViolations}
                  </div>
                  {(() => {
                    const trend = getMetricTrend(
                      metrics.rateLimitViolations,
                      3
                    );
                    const TrendIcon = trend.icon;
                    return <TrendIcon className={`h-4 w-4 ${trend.color}`} />;
                  })()}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last hour
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Blocked Requests
                </CardTitle>
                <Lock className="h-4 w-4 text-red-500 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {metrics.blockedRequests}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Security blocks today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  System Load
                </CardTitle>
                <Zap className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics.systemLoad}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Current load
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Events and Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Live Security Events */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" />
                  Live Security Events
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Real-time security incidents and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.securityEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {event.type}
                          </span>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {event.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{event.ipAddress}</span>
                          <span>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {metrics.securityEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p>No security events detected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <Activity className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                  System Performance
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Real-time system health metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Response Time
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {metrics.responseTime}ms
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Uptime
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {metrics.uptime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Active Sessions
                    </span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {metrics.activeSessions}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Last Security Scan
                    </span>
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                      {new Date(metrics.lastSecurityScan).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                <Zap className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Security Actions
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Quick security management actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/dashboard/admin/security')}
                  className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Shield className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mb-2" />
                  <div className="font-medium text-indigo-700 dark:text-indigo-300">
                    View Audit Logs
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    Detailed security audit trail
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/admin/users')}
                  className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Lock className="h-6 w-6 text-amber-500 dark:text-amber-400 mb-2" />
                  <div className="font-medium text-amber-700 dark:text-amber-300">
                    Manage Users
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    Lock/unlock user accounts
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/admin/monitoring')}
                  className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Activity className="h-6 w-6 text-emerald-500 dark:text-emerald-400 mb-2" />
                  <div className="font-medium text-emerald-700 dark:text-emerald-300">
                    System Health
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">
                    Monitor system performance
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
