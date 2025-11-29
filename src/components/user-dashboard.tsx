'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/lib/utils';

interface DashboardData {
  personalSummary: {
    totalTokensUsed: number;
    totalAmountPaid: number;
    totalTrueCost: number;
    averageCostPerKwh: number;
    efficiency: number;
    overpayment: number;
    emergencyPremium: number;
    contributionCount: number;
    lastContributionDate: string | null;
  };
  currentMonth: {
    tokensUsed: number;
    amountPaid: number;
    efficiency: number;
    progressVsAverage: number;
    daysIntoMonth: number;
    contributionCount: number;
    emergencyRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    year: number;
    totalTokensUsed: number;
    totalAmountPaid: number;
    totalTrueCost: number;
    efficiency: number;
    contributionCount: number;
    averageCostPerKwh: number;
    emergencyTokens: number;
  }>;
  meterReadingHistory: Array<{
    date: string;
    reading: number;
    tokensConsumed: number;
    purchaseType: 'regular' | 'emergency';
    costPerKwh: number;
  }>;
  costBreakdown: {
    regularCosts: number;
    emergencyCosts: number;
    regularTokens: number;
    emergencyTokens: number;
    regularRate: number;
    emergencyRate: number;
  };
}

interface UserDashboardProps {
  userId?: string;
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { checkPermission } = usePermissions();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);

      const response = await fetch(`/api/dashboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      // console.error removed
      setError(
        error instanceof Error ? error.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600';
    if (efficiency >= 85) return 'text-blue-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 95)
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (efficiency >= 85) return <Target className="h-5 w-5 text-blue-600" />;
    if (efficiency >= 70) return <Clock className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 80) return 'text-green-600 bg-green-100';
    if (progress <= 100) return 'text-blue-600 bg-blue-100';
    if (progress <= 120) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Prepare chart data
  const pieData = [
    {
      name: 'Regular Usage',
      value: data.costBreakdown.regularCosts,
      color: '#10b981',
    },
    {
      name: 'Emergency Usage',
      value: data.costBreakdown.emergencyCosts,
      color: '#ef4444',
    },
  ];

  const trendData = data.monthlyTrends.map((month) => ({
    name: `${month.month} ${month.year}`,
    tokens: month.totalTokensUsed,
    cost: month.totalAmountPaid,
    efficiency: month.efficiency,
    emergencyTokens: month.emergencyTokens,
  }));

  const meterData = data.meterReadingHistory
    .slice()
    .reverse()
    .map((reading) => ({
      name: formatDisplayDate(reading.date),
      reading: reading.reading,
      consumed: reading.tokensConsumed,
      rate: reading.costPerKwh,
      type: reading.purchaseType,
    }));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Personal Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Your electricity usage overview and insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Personal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Usage */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Usage
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {data.personalSummary.totalTokensUsed.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                kWh consumed
              </p>
            </div>
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Total Spent
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                ${data.personalSummary.totalAmountPaid.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                in contributions
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Average Cost */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Avg Cost/kWh
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ${data.personalSummary.averageCostPerKwh.toFixed(3)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                per kilowatt-hour
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        {/* Efficiency */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Efficiency
              </p>
              <p
                className={`text-2xl font-bold ${getEfficiencyColor(data.personalSummary.efficiency)}`}
              >
                {data.personalSummary.efficiency.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                payment accuracy
              </p>
            </div>
            {getEfficiencyIcon(data.personalSummary.efficiency)}
          </div>
        </div>
      </div>

      {/* Electricity Insights */}
      <InsightsCard />

      {/* Current Month Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Current Month Progress
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.currentMonth.tokensUsed.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                kWh Used
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                ${data.currentMonth.amountPaid.toFixed(2)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Amount Paid
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.currentMonth.contributionCount}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Contributions
              </div>
            </div>
          </div>

          {/* Progress vs Average */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Progress vs Average
              </span>
              <span
                className={`font-medium ${getProgressColor(data.currentMonth.progressVsAverage).split(' ')[0]}`}
              >
                {data.currentMonth.progressVsAverage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700">
              <div
                className={`h-3 rounded-full transition-all ${getProgressColor(data.currentMonth.progressVsAverage).split(' ')[1]}`}
                style={{
                  width: `${Math.min(data.currentMonth.progressVsAverage, 100)}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Day {data.currentMonth.daysIntoMonth} of month</span>
              <span>
                {data.currentMonth.progressVsAverage > 100 ? 'Above' : 'Below'}{' '}
                average
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Rate */}
        <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Emergency Usage
          </h3>

          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-red-600">
              {data.currentMonth.emergencyRate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              of contributions this month
            </div>
          </div>

          {data.personalSummary.emergencyPremium > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded dark:bg-red-950 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300">
                <div className="font-medium">Total Emergency Premium:</div>
                <div className="text-lg font-bold">
                  ${data.personalSummary.emergencyPremium.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Usage Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="tokens"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Regular Usage"
              />
              <Area
                type="monotone"
                dataKey="emergencyTokens"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.8}
                name="Emergency Usage"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-green-600" />
            Cost Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600">Regular Rate</div>
              <div className="text-slate-900 dark:text-slate-100">
                ${data.costBreakdown.regularRate.toFixed(4)}/kWh
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">Emergency Rate</div>
              <div className="text-slate-900 dark:text-slate-100">
                ${data.costBreakdown.emergencyRate.toFixed(4)}/kWh
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meter Reading History */}
      <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-600" />
          Meter Reading History
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={meterData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="consumed"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Tokens Consumed"
              dot={{ fill: '#8b5cf6' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Cost per kWh"
              dot={{ fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">
              Total Contributions:
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {data.personalSummary.contributionCount}
            </span>
          </div>
        </div>

        {checkPermission('canViewAccountBalance') && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">
                Account Balance:
              </span>
              <span
                className={`font-medium ${data.personalSummary.overpayment >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {data.personalSummary.overpayment >= 0 ? '+' : ''}$
                {data.personalSummary.overpayment.toFixed(2)}
                {data.personalSummary.overpayment >= 0 ? ' credit' : ' owed'}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">
              Last Contribution:
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {data.personalSummary.lastContributionDate
                ? formatDisplayDate(data.personalSummary.lastContributionDate)
                : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
