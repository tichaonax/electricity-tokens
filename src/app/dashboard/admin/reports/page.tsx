'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ChevronLeft, Download, TrendingUp, Users, Database, DollarSign, Calendar } from 'lucide-react';

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
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

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
  }, [status, session, reportPeriod]);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate fetching system statistics
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on period
      const mockStats: SystemStats = {
        totalUsers: reportPeriod === 'year' ? 156 : reportPeriod === 'quarter' ? 142 : reportPeriod === 'month' ? 38 : 12,
        totalPurchases: reportPeriod === 'year' ? 1247 : reportPeriod === 'quarter' ? 312 : reportPeriod === 'month' ? 89 : 23,
        totalTokens: reportPeriod === 'year' ? 89420 : reportPeriod === 'quarter' ? 22350 : reportPeriod === 'month' ? 6780 : 1890,
        totalRevenue: reportPeriod === 'year' ? 28490.50 : reportPeriod === 'quarter' ? 7122.75 : reportPeriod === 'month' ? 2156.40 : 567.80,
        averageUsagePerUser: reportPeriod === 'year' ? 573 : reportPeriod === 'quarter' ? 157 : reportPeriod === 'month' ? 178 : 158,
        emergencyPurchaseRate: reportPeriod === 'year' ? 12.3 : reportPeriod === 'quarter' ? 8.7 : reportPeriod === 'month' ? 15.2 : 21.7,
        dataGrowthRate: reportPeriod === 'year' ? 145.2 : reportPeriod === 'quarter' ? 23.8 : reportPeriod === 'month' ? 8.4 : 2.1,
        systemUptime: 99.9,
      };
      
      setStats(mockStats);
    } catch (err) {
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

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
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
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
                System Reports
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">System Reports</h2>
            <p className="text-gray-600">
              Comprehensive system analytics, performance metrics, and usage statistics.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Report Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">
                    Report Period:
                  </label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active users in period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.totalPurchases.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Token purchases made
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total payment processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `${stats.systemUptime}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Availability percentage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Usage Statistics
                </CardTitle>
                <CardDescription>
                  Token consumption and user behavior metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Tokens Consumed</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : stats.totalTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Usage per User</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : `${stats.averageUsagePerUser} tokens`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Emergency Purchase Rate</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : `${stats.emergencyPurchaseRate}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Cost per kWh</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : `$${(stats.totalRevenue / stats.totalTokens || 0).toFixed(4)}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  System performance and growth indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Data Growth Rate</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : `+${stats.dataGrowthRate}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Purchases per User</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : (stats.totalPurchases / stats.totalUsers || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">System Response Time</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : '< 200ms'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Size</span>
                    <span className="text-sm text-gray-600">
                      {loading ? '...' : '2.3 GB'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report Summary
              </CardTitle>
              <CardDescription>
                Key insights and recommendations for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Usage Trends</h4>
                  <p className="text-sm text-blue-800">
                    {stats.averageUsagePerUser > 150 
                      ? `High usage detected with an average of ${stats.averageUsagePerUser} tokens per user. Consider promoting energy efficiency.`
                      : `Usage levels are within normal range at ${stats.averageUsagePerUser} tokens per user.`
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-900 mb-2">Emergency Purchases</h4>
                  <p className="text-sm text-yellow-800">
                    {stats.emergencyPurchaseRate > 15
                      ? `Emergency purchase rate is ${stats.emergencyPurchaseRate}%, which is above the recommended 15%. Consider improving purchase planning.`
                      : `Emergency purchase rate of ${stats.emergencyPurchaseRate}% is within acceptable limits.`
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-900 mb-2">System Performance</h4>
                  <p className="text-sm text-green-800">
                    System uptime of {stats.systemUptime}% exceeds the target of 99.5%. All performance metrics are within normal parameters.
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