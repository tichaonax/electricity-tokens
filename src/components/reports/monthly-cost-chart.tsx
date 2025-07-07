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
import { Loader2, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
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

interface MonthlyCostChartProps {
  startDate?: string;
  endDate?: string;
}

interface MonthlyCostData {
  month: string;
  totalSpent: number;
  totalTokensPurchased: number;
  totalTokensConsumed: number;
  totalContributions: number;
  averageCostPerToken: number;
  emergencySpent: number;
  regularSpent: number;
  purchaseCount: number;
  contributorCount: number;
  overpayment: number;
  utilizationRate: number;
  emergencyPercentage: number;
  efficiency: number;
}

export function MonthlyCostChart({ startDate, endDate }: MonthlyCostChartProps) {
  const [data, setData] = useState<MonthlyCostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    fetchMonthlyCosts();
  }, [startDate, endDate]);

  const fetchMonthlyCosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'monthly-costs');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/financial?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly costs');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      // console.error removed
      setError('Failed to load monthly costs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading monthly costs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchMonthlyCosts} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Cost Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No cost data found for the selected time period.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const months = data.map(item => {
    const date = new Date(item.month + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  });

  const spendingChartData = {
    labels: months,
    datasets: [
      {
        label: 'Total Spent ($)',
        data: data.map(item => item.totalSpent),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Total Contributions ($)',
        data: data.map(item => item.totalContributions),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const emergencyBreakdownData = {
    labels: months,
    datasets: [
      {
        label: 'Regular Spending ($)',
        data: data.map(item => item.regularSpent),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Emergency Spending ($)',
        data: data.map(item => item.emergencySpent),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const efficiencyData = {
    labels: months,
    datasets: [
      {
        label: 'Utilization Rate (%)',
        data: data.map(item => item.utilizationRate),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Cost Efficiency (%)',
        data: data.map(item => item.efficiency),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
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
        text: 'Monthly Spending Analysis',
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

  const emergencyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Emergency vs Regular Spending',
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

  const efficiencyOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Utilization & Cost Efficiency',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Utilization Rate (%)',
        },
        max: 100,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cost Efficiency (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Calculate summary statistics
  const totalSpent = data.reduce((sum, item) => sum + item.totalSpent, 0);
  const totalContributions = data.reduce((sum, item) => sum + item.totalContributions, 0);
  const totalEmergencySpent = data.reduce((sum, item) => sum + item.emergencySpent, 0);
  const averageUtilization = data.length > 0 
    ? data.reduce((sum, item) => sum + item.utilizationRate, 0) / data.length 
    : 0;

  const ChartComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Monthly Cost Summaries
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track monthly spending patterns, efficiency metrics, and cost breakdowns
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
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${totalSpent.toFixed(2)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Total Spent</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${totalContributions.toFixed(2)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Contributions</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            ${totalEmergencySpent.toFixed(2)}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Emergency Spending</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {averageUtilization.toFixed(1)}%
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Avg Utilization</div>
        </div>
      </div>

      {/* Main Spending Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
        <ChartComponent data={spendingChartData} options={chartOptions} />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Breakdown Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <Bar data={emergencyBreakdownData} options={emergencyChartOptions} />
        </div>

        {/* Efficiency Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <Line data={efficiencyData} options={efficiencyOptions} />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Monthly Financial Breakdown
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
                  Total Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contributions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Overpayment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Emergency %
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contributors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((item, index) => {
                const monthDate = new Date(item.month + '-01');
                const monthName = monthDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                });
                
                return (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {monthName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      ${item.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      ${item.totalContributions.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={item.overpayment > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.overpayment > 0 ? '+' : ''}${item.overpayment.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {item.utilizationRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={item.emergencyPercentage > 20 ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                        {item.emergencyPercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {item.contributorCount}
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
            const monthName = monthDate.toLocaleDateString('en-US', { 
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
                    <div className="text-slate-600 dark:text-slate-400">Total Spent</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      ${item.totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Contributions</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      ${item.totalContributions.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Overpayment</div>
                    <div className={`font-medium ${item.overpayment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.overpayment > 0 ? '+' : ''}${item.overpayment.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Utilization</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.utilizationRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Emergency %</div>
                    <div className={`font-medium ${item.emergencyPercentage > 20 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.emergencyPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Contributors</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {item.contributorCount}
                    </div>
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