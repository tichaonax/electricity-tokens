'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ChevronLeft, Eye, Clock, User, Database, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  oldValues?: any;
  newValues?: any;
}

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  lockedAccounts: number;
  activeAdmins: number;
  recentSuspiciousActivity: number;
  lastBackup: string;
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
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchSecurityData();
    }
  }, [status, session, currentPage]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch audit logs
      const auditResponse = await fetch(`/api/audit?page=${currentPage}&limit=10`);
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
      
    } catch (err) {
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'LOGIN':
        return 'default';
      case 'LOGOUT':
        return 'secondary';
      default:
        return 'secondary';
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

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  const securityStatus = getSecurityStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Security & Audit
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session.user?.name}
              </span>
              <span className="text-sm text-gray-500 bg-red-100 px-2 py-1 rounded">
                ADMIN
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Security & Audit Dashboard</h2>
            <p className="text-gray-600">
              Monitor security metrics, audit trails, and system integrity.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                {securityStatus === 'good' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant={securityStatus === 'good' ? 'default' : 'destructive'}>
                    {securityStatus === 'good' ? 'SECURE' : 'ALERT'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall system security status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.failedLogins}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.lockedAccounts}</div>
                <p className="text-xs text-muted-foreground">
                  Currently locked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {securityMetrics.lastBackup 
                    ? new Date(securityMetrics.lastBackup).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Database backup status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Logins (24h)</span>
                    <span className="text-sm text-gray-600">{securityMetrics.totalLogins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Admins</span>
                    <span className="text-sm text-gray-600">{securityMetrics.activeAdmins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Suspicious Activity</span>
                    <span className="text-sm text-gray-600">{securityMetrics.recentSuspiciousActivity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  System Integrity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Status</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Authentication Service</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Audit Logging</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Recent Audit Trail
              </CardTitle>
              <CardDescription>
                Track all user actions and system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found.
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {log.userName}
                            </span>
                            <Badge variant={getActionBadgeColor(log.action)}>
                              {log.action}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {log.entityType}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          onClick={() => {
                            // In real implementation, show detailed view
                            alert(`Audit Log Details:\n\nUser: ${log.userName}\nAction: ${log.action}\nEntity: ${log.entityType}\nTime: ${new Date(log.timestamp).toLocaleString()}`);
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
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm bg-indigo-50 border border-indigo-200 rounded-md">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
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