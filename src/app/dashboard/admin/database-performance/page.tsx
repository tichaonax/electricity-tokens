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
import { Button } from '@/components/ui/button';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IndexStatus {
  name: string;
  exists: boolean;
  description: string;
  tableName: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

interface DatabaseStats {
  totalQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  indexHitRatio: number;
  lastOptimized: string | null;
}

export default function DatabasePerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [indexes, setIndexes] = useState<IndexStatus[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      checkIndexStatus();
    }
  }, [status, session]);

  const checkIndexStatus = async () => {
    try {
      setIsChecking(true);
      setMessage(null);

      const response = await fetch('/api/admin/database-performance');
      if (!response.ok) {
        throw new Error('Failed to check database performance');
      }

      const data = await response.json();
      setIndexes(data.indexes);
      setStats(data.stats);
    } catch (error) {
      console.error('Error checking database performance:', error);
      setMessage({
        type: 'error',
        text: 'Failed to check database performance. Please try again.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const runOptimization = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      '⚠️ Database Optimization\n\n' +
        'This operation will create database indexes which may temporarily affect performance during execution.\n\n' +
        'It is recommended to run this during low-traffic periods or outside business hours.\n\n' +
        'Are you sure you want to continue?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsOptimizing(true);
      setMessage(null);

      const response = await fetch('/api/admin/database-performance/optimize', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to run database optimization');
      }

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `Database optimization completed successfully! ${data.indexesCreated} indexes created.`,
      });

      // Refresh the status
      await checkIndexStatus();
    } catch (error) {
      console.error('Error running database optimization:', error);
      setMessage({
        type: 'error',
        text: 'Failed to run database optimization. Please try again.',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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
      <ResponsiveNav
        title="Database Performance"
        backPath="/dashboard/admin"
        showBackButton={true}
        backText="Back to Admin Panel"
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-6 w-6 text-amber-500 dark:text-amber-400" />
              <h1 className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                Database Performance Optimization
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor and optimize your database performance by creating indexes
              and running performance checks.
            </p>
          </div>

          {message && (
            <Alert
              className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'}`}
            >
              <AlertDescription
                className={
                  message.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Database Statistics */}
            {stats && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <TrendingUp className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    Performance Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Query Time
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {stats.avgQueryTime.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Index Hit Ratio
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {stats.indexHitRatio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Slow Queries
                    </span>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {stats.slowQueries}
                    </span>
                  </div>
                  {stats.lastOptimized && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Last Optimized
                      </span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {new Date(stats.lastOptimized).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Zap className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={checkIndexStatus}
                  disabled={isChecking}
                  className="w-full cursor-pointer"
                  variant="outline"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </>
                  )}
                </Button>
                <Button
                  onClick={runOptimization}
                  disabled={isOptimizing}
                  className="w-full border border-gray-300 dark:border-gray-600 cursor-pointer"
                  variant="secondary"
                >
                  {isOptimizing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Optimization
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Index Status */}
          <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Database className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                Database Indexes Status
              </CardTitle>
              <CardDescription>
                Performance indexes that can improve query speed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indexes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Click &quot;Check Status&quot; to view database index
                  information
                </div>
              ) : (
                <div className="space-y-3">
                  {indexes.map((index, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {index.exists ? (
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {index.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {index.description}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Table: {index.tableName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getImpactBadge(index.estimatedImpact)}`}
                        >
                          {index.estimatedImpact} impact
                        </span>
                        <span
                          className={`text-sm font-medium ${index.exists ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}
                        >
                          {index.exists ? 'EXISTS' : 'MISSING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert className="mt-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Database optimization should be run
              during low-traffic periods. Creating indexes can temporarily
              affect performance during the operation.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}
