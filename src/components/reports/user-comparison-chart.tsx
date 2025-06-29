'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Loader2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UserComparisonChartProps {
  startDate?: string;
  endDate?: string;
}

interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalContributions: number;
  totalTokensConsumed: number;
  totalTrueCost: number;
  contributionCount: number;
  emergencyContributions: number;
  averageMeterReading: number;
  efficiency: number;
  overpayment: number;
  emergencyRate: number;
  avgContributionAmount: number;
  avgTokensPerContribution: number;
}

interface GroupStats {
  averageContributions: number;
  averageTokensConsumed: number;
  averageEfficiency: number;
  averageEmergencyRate: number;
}

interface UserComparisonData {
  users: UserStats[];
  groupStats: GroupStats;
  totalUsers: number;
}

export function UserComparisonChart({ startDate, endDate }: UserComparisonChartProps) {
  const [data, setData] = useState<UserComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'contributions' | 'tokens' | 'efficiency'>('contributions');

  useEffect(() => {
    fetchUserComparison();
  }, [startDate, endDate]);

  const fetchUserComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'user-comparison');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/usage?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user comparison');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching user comparison:', error);
      setError('Failed to load user comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading user comparison...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchUserComparison} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No User Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No user contribution data found for the selected time period.
        </p>
      </div>
    );
  }

  // Prepare chart data based on selected metric
  const userNames = data.users.map(user => user.userName);
  
  const getChartData = () => {
    switch (metric) {
      case 'contributions':
        return {
          labels: userNames,
          datasets: [
            {
              label: 'Individual Contributions ($)',
              data: data.users.map(user => user.totalContributions),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
            },
            {
              label: 'Group Average ($)',
              data: data.users.map(() => data.groupStats.averageContributions),
              backgroundColor: 'rgba(156, 163, 175, 0.5)',
              borderColor: 'rgba(156, 163, 175, 1)',
              borderWidth: 2,
              type: 'line' as const,
            },
          ],
        };
      case 'tokens':
        return {
          labels: userNames,
          datasets: [
            {
              label: 'Individual Tokens Consumed',
              data: data.users.map(user => user.totalTokensConsumed),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
            },
            {
              label: 'Group Average',
              data: data.users.map(() => data.groupStats.averageTokensConsumed),
              backgroundColor: 'rgba(156, 163, 175, 0.5)',
              borderColor: 'rgba(156, 163, 175, 1)',
              borderWidth: 2,
              type: 'line' as const,
            },
          ],
        };
      case 'efficiency':
        return {
          labels: userNames,
          datasets: [
            {
              label: 'Individual Efficiency (%)',
              data: data.users.map(user => user.efficiency),
              backgroundColor: data.users.map(user => 
                user.efficiency > 100 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(168, 85, 247, 0.8)'
              ),
            },
            {
              label: 'Group Average (%)',
              data: data.users.map(() => data.groupStats.averageEfficiency),
              backgroundColor: 'rgba(156, 163, 175, 0.5)',
              borderColor: 'rgba(156, 163, 175, 1)',
              borderWidth: 2,
              type: 'line' as const,
            },
          ],
        };
      default:
        return { labels: [], datasets: [] };
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Individual vs Group ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: metric === 'contributions' ? 'Amount ($)' : 
                metric === 'tokens' ? 'Tokens' : 'Efficiency (%)',
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Individual vs Group Usage Comparison
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Compare individual user performance against group averages
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={metric === 'contributions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('contributions')}
          >
            Contributions
          </Button>
          <Button
            variant={metric === 'tokens' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('tokens')}
          >
            Tokens
          </Button>
          <Button
            variant={metric === 'efficiency' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('efficiency')}
          >
            Efficiency
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {data.totalUsers}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Active Users</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${data.groupStats.averageContributions.toFixed(2)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Avg Contributions</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {data.groupStats.averageTokensConsumed.toFixed(0)}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Avg Tokens Consumed</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {data.groupStats.averageEfficiency.toFixed(1)}%
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Avg Efficiency</div>
        </div>
      </div>

      {/* Main Comparison Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
        <Chart type="bar" data={getChartData()} options={chartOptions} />
      </div>

      {/* User Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Top Performers
          </h4>
          <div className="space-y-3">
            {data.users
              .sort((a, b) => {
                switch (metric) {
                  case 'contributions':
                    return b.totalContributions - a.totalContributions;
                  case 'tokens':
                    return b.totalTokensConsumed - a.totalTokensConsumed;
                  case 'efficiency':
                    return a.efficiency - b.efficiency; // Lower efficiency is better
                  default:
                    return 0;
                }
              })
              .slice(0, 3)
              .map((user, index) => (
                <div key={user.userId} className="flex justify-between items-center">
                  <span className="font-medium">
                    #{index + 1} {user.userName}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {metric === 'contributions' && `$${user.totalContributions.toFixed(2)}`}
                    {metric === 'tokens' && `${user.totalTokensConsumed.toFixed(0)} tokens`}
                    {metric === 'efficiency' && `${user.efficiency.toFixed(1)}%`}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Performance Alerts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
            Performance Insights
          </h4>
          <div className="space-y-3">
            {/* Users above average */}
            {data.users.filter(user => {
              switch (metric) {
                case 'contributions':
                  return user.totalContributions > data.groupStats.averageContributions;
                case 'tokens':
                  return user.totalTokensConsumed > data.groupStats.averageTokensConsumed;
                case 'efficiency':
                  return user.efficiency < data.groupStats.averageEfficiency;
                default:
                  return false;
              }
            }).length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-green-600">
                  {data.users.filter(user => {
                    switch (metric) {
                      case 'contributions':
                        return user.totalContributions > data.groupStats.averageContributions;
                      case 'tokens':
                        return user.totalTokensConsumed > data.groupStats.averageTokensConsumed;
                      case 'efficiency':
                        return user.efficiency < data.groupStats.averageEfficiency;
                      default:
                        return false;
                    }
                  }).length} users
                </span>
                <span className="text-slate-600 dark:text-slate-400"> above average</span>
              </div>
            )}

            {/* High emergency usage */}
            {data.users.filter(user => user.emergencyRate > data.groupStats.averageEmergencyRate).length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-red-600">
                  {data.users.filter(user => user.emergencyRate > data.groupStats.averageEmergencyRate).length} users
                </span>
                <span className="text-slate-600 dark:text-slate-400"> with high emergency usage</span>
              </div>
            )}

            {/* Efficiency issues */}
            {data.users.filter(user => user.efficiency > 120).length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-orange-600">
                  {data.users.filter(user => user.efficiency > 120).length} users
                </span>
                <span className="text-slate-600 dark:text-slate-400"> with efficiency concerns (&gt;120%)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed User Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Detailed User Performance
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contributions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tokens Used
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Emergency Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Overpayment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.users.map((user) => (
                <tr key={user.userId}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {user.userName}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {user.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${user.totalContributions.toFixed(2)}
                    <div className="text-xs text-slate-500">
                      {user.contributionCount} payments
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {user.totalTokensConsumed.toFixed(0)} tokens
                    <div className="text-xs text-slate-500">
                      Avg: {user.avgTokensPerContribution.toFixed(0)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      user.efficiency > 120 
                        ? 'text-red-600' 
                        : user.efficiency > 100 
                        ? 'text-orange-600' 
                        : 'text-green-600'
                    }`}>
                      {user.efficiency.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={user.emergencyRate > 20 ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                      {user.emergencyRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={user.overpayment > 0 ? 'text-green-600' : 'text-red-600'}>
                      ${user.overpayment.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}