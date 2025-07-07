'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  oldValues?: any;
  newValues?: any;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchAuditLogs();
    }
  }, [status, session, entityType, entityId]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (entityType) params.append('entityType', entityType);
      if (entityId) params.append('entityId', entityId);
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Audit Logs
            </h1>
            {entityType && entityId && (
              <p className="text-slate-600 dark:text-slate-400">
                Showing logs for {entityType} ID: {entityId}
              </p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No audit logs found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {entityType && entityId 
                ? 'No audit logs found for this specific entity.'
                : 'No audit logs available.'
              }
            </p>
          </div>
        ) : (
          /* Audit Logs List */
          <div className="space-y-6">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-800 shadow rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                      log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {log.action} {log.entityType}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Entity ID: {log.entityId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="flex items-center mt-1">
                      <User className="h-4 w-4 mr-1" />
                      {log.user.name}
                    </div>
                  </div>
                </div>

                {/* Changes */}
                {(log.oldValues || log.newValues) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {log.oldValues && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                          Previous Values
                        </h4>
                        <pre className="text-xs bg-slate-100 dark:bg-slate-700 p-3 rounded overflow-x-auto">
                          {formatValue(log.oldValues)}
                        </pre>
                      </div>
                    )}
                    {log.newValues && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                          New Values
                        </h4>
                        <pre className="text-xs bg-slate-100 dark:bg-slate-700 p-3 rounded overflow-x-auto">
                          {formatValue(log.newValues)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}