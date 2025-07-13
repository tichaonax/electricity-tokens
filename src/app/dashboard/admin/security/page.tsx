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
  Eye,
  Clock,
  User,
  Database,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  lockedAccounts: number;
  activeAdmins: number;
  recentSuspiciousActivity: number;
  lastBackup: string;
  totalSecurityEvents: number;
  criticalEvents: number;
  rateLimitViolations: number;
  activeUsers: number;
  recentEvents: SecurityEvent[];
}

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

export default function SecurityAndAudit() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalLogins: 0,
    failedLogins: 0,
    lockedAccounts: 0,
    activeAdmins: 0,
    recentSuspiciousActivity: 0,
    lastBackup: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch audit logs
      const auditResponse = await fetch(
        `/api/audit?page=${currentPage}&limit=10`
      );
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData.logs);
        setTotalPages(auditData.pagination.totalPages);
      }

      // Simulate security metrics (in real implementation, this would be from an API)
      setSecurityMetrics({
        totalLogins: 1247,
        failedLogins: 23,
        lockedAccounts: 2,
        activeAdmins: 3,
        recentSuspiciousActivity: 1,
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch {
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSecurityData();
    }
  }, [status, session, fetchSecurityData]);

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
      case 'LOGOUT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
    }
  };

  const getSecurityStatus = () => {
    if (securityMetrics.recentSuspiciousActivity > 5) return 'critical';
    if (securityMetrics.failedLogins > 50) return 'warning';
    return 'good';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  const securityStatus = getSecurityStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav
        title="Security & Audit"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Security & Audit Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor security metrics, audit trails, and system integrity.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Security Status
                </CardTitle>
                {securityStatus === 'good' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge
                    className={
                      securityStatus === 'good'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700'
                    }
                  >
                    {securityStatus === 'good' ? 'SECURE' : 'ALERT'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Overall system security status
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Failed Logins
                </CardTitle>
                <Shield className="h-4 w-4 text-red-500 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {securityMetrics.failedLogins}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Locked Accounts
                </CardTitle>
                <User className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {securityMetrics.lockedAccounts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Currently locked
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Last Backup
                </CardTitle>
                <Database className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {securityMetrics.lastBackup
                    ? new Date(securityMetrics.lastBackup).toLocaleDateString()
                    : 'Never'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Database backup status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <Shield className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Total Logins (24h)
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {securityMetrics.totalLogins}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Active Admins
                    </span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {securityMetrics.activeAdmins}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Suspicious Activity
                    </span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {securityMetrics.recentSuspiciousActivity}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <CheckCircle className="h-5 w-5 mr-2 text-teal-500 dark:text-teal-400" />
                  System Integrity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Database Status
                    </span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700">
                      Online
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Authentication Service
                    </span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Audit Logging
                    </span>
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700">
                      Enabled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Trail */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                <Eye className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Recent Audit Trail
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Track all user actions and system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No audit logs found.
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {log.userName}
                            </span>
                            <Badge className={getActionBadgeColor(log.action)}>
                              {log.action}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {log.entityType}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium"
                          onClick={() => {
                            // In real implementation, show detailed view
                            alert(
                              `Audit Log Details:\n\nUser: ${log.userName}\nAction: ${log.action}\nEntity: ${log.entityType}\nTime: ${new Date(log.timestamp).toLocaleString()}`
                            );
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Simple Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center space-x-2 mt-6">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-900 dark:text-gray-100"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md text-gray-900 dark:text-gray-100">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-900 dark:text-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
