'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UsageTrendsChartProps {
  startDate?: string;
  endDate?: string;
}

interface MonthlyTrend {
  month: string;
  totalTokensPurchased: number;
  totalTokensConsumed: number;
  totalPayment: number;
  contributionCount: number;
  emergencyPurchases: number;
  regularPurchases: number;
  utilizationRate: string;
  averageCostPerToken: string;
  emergencyRate: string;
}

export function UsageTrendsChart({ startDate, endDate }: UsageTrendsChartProps) {
  const [data, setData] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    fetchUsageTrends();
  }, [startDate, endDate]);

  const fetchUsageTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'monthly-trends');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/usage?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage trends');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      // console.error removed
      setError('Failed to load usage trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading usage trends...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchUsageTrends} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Usage Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No usage data found for the selected time period. Try adjusting your date range.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const months = data.map(item => {
    const date = new Date(item.month + '-01');
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Tokens Purchased',
        data: data.map(item => item.totalTokensPurchased),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Tokens Consumed',
        data: data.map(item => item.totalTokensConsumed),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const utilizationData = {
    labels: months,
    datasets: [
      {
        label: 'Utilization Rate (%)',
        data: data.map(item => parseFloat(item.utilizationRate)),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const emergencyData = {
    labels: months,
    datasets: [
      {
        label: 'Regular Purchases',
        data: data.map(item => item.regularPurchases),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Emergency Purchases',
        data: data.map(item => item.emergencyPurchases),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Usage Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const utilizationOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Token Utilization Rate (%)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const emergencyOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Purchase Type Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Calculate summary statistics
  const totalTokensPurchased = data.reduce((sum, item) => sum + item.totalTokensPurchased, 0);
  const totalTokensConsumed = data.reduce((sum, item) => sum + item.totalTokensConsumed, 0);
  const totalPayment = data.reduce((sum, item) => sum + item.totalPayment, 0);
  const overallUtilization = totalTokensPurchased > 0 ? (totalTokensConsumed / totalTokensPurchased * 100) : 0;
  const averageCost = totalTokensPurchased > 0 ? totalPayment / totalTokensPurchased : 0;

  const ChartComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Monthly Usage Trends
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track token purchases, consumption, and utilization patterns over time
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType('line')}
            className="flex-1 sm:flex-none"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Line Chart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType('bar')}
            className="flex-1 sm:flex-none"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Bar Chart
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {totalTokensPurchased.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Tokens Purchased</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {totalTokensConsumed.toLocaleString()}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Total Tokens Consumed</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {overallUtilization.toFixed(1)}%
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Overall Utilization</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ${averageCost.toFixed(4)}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Avg Cost per Token</div>
        </div>
      </div>

      {/* Main Usage Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
        <ChartComponent data={chartData} options={chartOptions} />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Rate Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <Line data={utilizationData} options={utilizationOptions} />
        </div>

        {/* Emergency vs Regular Purchases */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <Bar data={emergencyData} options={emergencyOptions} />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Monthly Breakdown
          </h4>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Purchased
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Consumed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Emergency Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((item, index) => {
                const monthDate = new Date(item.month + '-01');
                const monthName = monthDate.toLocaleDateString('en-GB', { 
                  year: 'numeric', 
                  month: 'long' 
                });
                
                return (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {monthName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {item.totalTokensPurchased.toLocaleString()} tokens
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {item.totalTokensConsumed.toLocaleString()} tokens
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {item.utilizationRate}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      ${item.averageCostPerToken}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {item.emergencyRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((item, index) => {
            const monthDate = new Date(item.month + '-01');
            const monthName = monthDate.toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long' 
            });
            
            return (
              <div key={index} className="p-4">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  {monthName}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Purchased</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.totalTokensPurchased.toLocaleString()} tokens
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Consumed</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.totalTokensConsumed.toLocaleString()} tokens
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Utilization</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.utilizationRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Avg Cost</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      ${item.averageCostPerToken}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Emergency Rate</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {item.emergencyRate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}