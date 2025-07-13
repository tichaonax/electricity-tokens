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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  ChevronLeft,
  Download,
  TrendingUp,
  Users,
  Database,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalPurchases: number;
  totalTokens: number;
  totalRevenue: number;
  averageUsagePerUser: number;
  emergencyPurchaseRate: number;
  dataGrowthRate: number;
  systemUptime: number;
}

export default function SystemReports() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPurchases: 0,
    totalTokens: 0,
    totalRevenue: 0,
    averageUsagePerUser: 0,
    emergencyPurchaseRate: 0,
    dataGrowthRate: 0,
    systemUptime: 99.9,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');

  const fetchSystemStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate fetching system statistics
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data based on period
      const mockStats: SystemStats = {
        totalUsers:
          reportPeriod === 'year'
            ? 156
            : reportPeriod === 'quarter'
              ? 142
              : reportPeriod === 'month'
                ? 38
                : 12,
        totalPurchases:
          reportPeriod === 'year'
            ? 1247
            : reportPeriod === 'quarter'
              ? 312
              : reportPeriod === 'month'
                ? 89
                : 23,
        totalTokens:
          reportPeriod === 'year'
            ? 89420
            : reportPeriod === 'quarter'
              ? 22350
              : reportPeriod === 'month'
                ? 6780
                : 1890,
        totalRevenue:
          reportPeriod === 'year'
            ? 28490.5
            : reportPeriod === 'quarter'
              ? 7122.75
              : reportPeriod === 'month'
                ? 2156.4
                : 567.8,
        averageUsagePerUser:
          reportPeriod === 'year'
            ? 573
            : reportPeriod === 'quarter'
              ? 157
              : reportPeriod === 'month'
                ? 178
                : 158,
        emergencyPurchaseRate:
          reportPeriod === 'year'
            ? 12.3
            : reportPeriod === 'quarter'
              ? 8.7
              : reportPeriod === 'month'
                ? 15.2
                : 21.7,
        dataGrowthRate:
          reportPeriod === 'year'
            ? 145.2
            : reportPeriod === 'quarter'
              ? 23.8
              : reportPeriod === 'month'
                ? 8.4
                : 2.1,
        systemUptime: 99.9,
      };

      setStats(mockStats);
    } catch {
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  }, [reportPeriod]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSystemStats();
    }
  }, [status, session, reportPeriod, fetchSystemStats]);

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      // Simulate report generation
      const reportData = {
        period: reportPeriod,
        generatedAt: new Date().toISOString(),
        stats,
      };

      // In real implementation, this would call an API to generate the report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export report');
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
      <nav className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                System Reports
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome, {session.user?.name}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                ADMIN
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              System Reports
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive system analytics, performance metrics, and usage
              statistics.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Mock Data Warning */}
          <Alert className="mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Development Notice:</strong> This page currently
              displays mock/simulated data for demonstration purposes. The
              statistics shown (users, purchases, revenue) are not real database
              values and will be replaced with actual data in production.
            </AlertDescription>
          </Alert>

          {/* Report Controls */}
          <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-700 dark:text-indigo-400">
                <Calendar className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Report Period:
                  </label>
                  <select
                    value={reportPeriod}
                    onChange={(e) =>
                      setReportPeriod(
                        e.target.value as 'week' | 'month' | 'quarter' | 'year'
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loading ? '...' : stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Active users in period
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Total Purchases
                </CardTitle>
                <FileText className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loading ? '...' : stats.totalPurchases.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Token purchases made
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {loading
                    ? '...'
                    : `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total payment processed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                  System Uptime
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {loading ? '...' : `${stats.systemUptime}%`}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Availability percentage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-teal-700 dark:text-teal-400">
                  <Database className="h-5 w-5 mr-2 text-teal-500 dark:text-teal-400" />
                  Usage Statistics
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Token consumption and user behavior metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Total Tokens Consumed
                    </span>
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                      {loading ? '...' : stats.totalTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Average Usage per User
                    </span>
                    <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                      {loading ? '...' : `${stats.averageUsagePerUser} tokens`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Emergency Purchase Rate
                    </span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {loading ? '...' : `${stats.emergencyPurchaseRate}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Average Cost per kWh
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {loading
                        ? '...'
                        : `$${(stats.totalRevenue / stats.totalTokens || 0).toFixed(4)}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-violet-700 dark:text-violet-400">
                  <TrendingUp className="h-5 w-5 mr-2 text-violet-500 dark:text-violet-400" />
                  Performance Metrics
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  System performance and growth indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Data Growth Rate
                    </span>
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {loading ? '...' : `+${stats.dataGrowthRate}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Average Purchases per User
                    </span>
                    <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                      {loading
                        ? '...'
                        : (
                            stats.totalPurchases / stats.totalUsers || 0
                          ).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      System Response Time
                    </span>
                    <span className="text-sm font-semibold text-lime-600 dark:text-lime-400">
                      {loading ? '...' : '< 200ms'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Database Size
                    </span>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {loading ? '...' : '2.3 GB'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Summary */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-700 dark:text-slate-400">
                <FileText className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
                Report Summary
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Key insights and recommendations for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Usage Trends
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {stats.averageUsagePerUser > 150
                      ? `High usage detected with an average of ${stats.averageUsagePerUser} tokens per user. Consider promoting energy efficiency.`
                      : `Usage levels are within normal range at ${stats.averageUsagePerUser} tokens per user.`}
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                    Emergency Purchases
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    {stats.emergencyPurchaseRate > 15
                      ? `Emergency purchase rate is ${stats.emergencyPurchaseRate}%, which is above the recommended 15%. Consider improving purchase planning.`
                      : `Emergency purchase rate of ${stats.emergencyPurchaseRate}% is within acceptable limits.`}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                    System Performance
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    System uptime of {stats.systemUptime}% exceeds the target of
                    99.5%. All performance metrics are within normal parameters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
