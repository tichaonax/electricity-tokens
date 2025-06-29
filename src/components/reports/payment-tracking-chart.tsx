'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Loader2, PieChart, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PaymentTrackingChartProps {
  startDate?: string;
  endDate?: string;
}

interface MonthlyBreakdown {
  month: string;
  contributions: number;
  tokensConsumed: number;
  count: number;
  emergencyAmount: number;
  regularAmount: number;
}

interface PaymentTrackingData {
  userId: string;
  userName: string;
  userEmail: string;
  totalContributions: number;
  totalTokensConsumed: number;
  contributionCount: number;
  averageContribution: number;
  firstContribution: string;
  lastContribution: string;
  emergencyContributions: number;
  regularContributions: number;
  emergencyPercentage: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export function PaymentTrackingChart({ startDate, endDate }: PaymentTrackingChartProps) {
  const [data, setData] = useState<PaymentTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('all');

  useEffect(() => {
    fetchPaymentTracking();
  }, [startDate, endDate]);

  const fetchPaymentTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'payment-tracking');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/financial?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment tracking');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching payment tracking:', error);
      setError('Failed to load payment tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading payment tracking...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchPaymentTracking} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Payment Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No payment data found for the selected time period.
        </p>
      </div>
    );
  }

  // Prepare chart data for user comparison
  const userNames = data.map(user => user.userName);
  
  const contributionChartData = {
    labels: userNames,
    datasets: [
      {
        label: 'Total Contributions ($)',
        data: data.map(user => user.totalContributions),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const emergencyChartData = {
    labels: userNames,
    datasets: [
      {
        label: 'Regular Contributions ($)',
        data: data.map(user => user.regularContributions),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Emergency Contributions ($)',
        data: data.map(user => user.emergencyContributions),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  // Monthly trend data for selected user or all users
  const getMonthlyTrendData = () => {
    if (selectedUser === 'all') {
      // Aggregate all users' monthly data
      const allMonths = new Set<string>();
      data.forEach(user => {
        user.monthlyBreakdown.forEach(month => allMonths.add(month.month));
      });
      
      const sortedMonths = Array.from(allMonths).sort();
      
      return {
        labels: sortedMonths.map(month => {
          const date = new Date(month + '-01');
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }),
        datasets: [
          {
            label: 'Total Monthly Contributions ($)',
            data: sortedMonths.map(month => {
              return data.reduce((sum, user) => {
                const monthData = user.monthlyBreakdown.find(m => m.month === month);
                return sum + (monthData?.contributions || 0);
              }, 0);
            }),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.1,
          },
        ],
      };
    } else {
      // Individual user data
      const selectedUserData = data.find(user => user.userId === selectedUser);
      if (!selectedUserData) return { labels: [], datasets: [] };

      const months = selectedUserData.monthlyBreakdown.map(month => {
        const date = new Date(month.month + '-01');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      });

      return {
        labels: months,
        datasets: [
          {
            label: 'Monthly Contributions ($)',
            data: selectedUserData.monthlyBreakdown.map(month => month.contributions),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1,
          },
          {
            label: 'Tokens Consumed',
            data: selectedUserData.monthlyBreakdown.map(month => month.tokensConsumed),
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            tension: 0.1,
            yAxisID: 'y1',
          },
        ],
      };
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
        text: selectedUser === 'all' ? 'All Users Payment Trends' : `${data.find(u => u.userId === selectedUser)?.userName} Payment History`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)',
        },
      },
      ...(selectedUser !== 'all' && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Tokens Consumed',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      }),
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Payment Contributions by User',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)',
        },
      },
    },
  };

  // Calculate summary statistics
  const totalAllContributions = data.reduce((sum, user) => sum + user.totalContributions, 0);
  const totalEmergencyContributions = data.reduce((sum, user) => sum + user.emergencyContributions, 0);
  const averageContribution = data.length > 0 
    ? data.reduce((sum, user) => sum + user.averageContribution, 0) / data.length 
    : 0;
  const mostActiveUser = data.reduce((max, user) => 
    user.contributionCount > max.contributionCount ? user : max, data[0] || { contributionCount: 0, userName: 'N/A' });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Payment Contribution Tracking
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monitor individual user payment patterns and contribution history
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="all">All Users</option>
            {data.map(user => (
              <option key={user.userId} value={user.userId}>
                {user.userName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${totalAllContributions.toFixed(2)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Total Contributions</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            ${totalEmergencyContributions.toFixed(2)}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Emergency Contributions</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${averageContribution.toFixed(2)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Avg Contribution</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {mostActiveUser.userName}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Most Active User</div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
        <Line data={getMonthlyTrendData()} options={chartOptions} />
      </div>

      {/* User Contribution Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Contributions Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Total Contributions by User
          </h4>
          <div className="h-64">
            <Line 
              data={contributionChartData} 
              options={{
                ...barChartOptions,
                maintainAspectRatio: false,
                plugins: {
                  ...barChartOptions.plugins,
                  title: { display: false },
                },
              }} 
            />
          </div>
        </div>

        {/* Emergency vs Regular Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Emergency vs Regular Contributions
          </h4>
          <div className="h-64">
            <Line 
              data={emergencyChartData} 
              options={{
                ...barChartOptions,
                maintainAspectRatio: false,
                plugins: {
                  ...barChartOptions.plugins,
                  title: { display: false },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* User Details Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            User Payment Summary
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
                  Total Contributions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg Contribution
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payment Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Emergency %
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Period
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((user) => (
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
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${user.averageContribution.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {user.contributionCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={user.emergencyPercentage > 30 ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                      {user.emergencyPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.firstContribution).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                      {new Date(user.lastContribution).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
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