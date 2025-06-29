'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Loader2, Calendar, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnnualOverviewChartProps {
  startDate?: string;
  endDate?: string;
}

interface MonthlyData {
  month: string;
  spent: number;
  tokens: number;
  contributions: number;
  purchases: number;
}

interface EmergencyAnalysis {
  emergencySpent: number;
  regularSpent: number;
  emergencyPercentage: number;
  emergencyPurchases: number;
  regularPurchases: number;
  emergencyPremium: number;
}

interface AnnualSummary {
  totalSpent: number;
  totalTokensPurchased: number;
  totalTokensConsumed: number;
  totalContributions: number;
  averageCostPerToken: number;
  utilizationRate: number;
  overpayment: number;
  contributorCount: number;
}

interface AnnualOverviewData {
  year: number;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: AnnualSummary;
  emergencyAnalysis: EmergencyAnalysis;
  monthlyBreakdown: MonthlyData[];
}

export function AnnualOverviewChart({ startDate, endDate }: AnnualOverviewChartProps) {
  const [data, setData] = useState<AnnualOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'monthly' | 'emergency' | 'summary'>('monthly');

  useEffect(() => {
    fetchAnnualOverview();
  }, [startDate, endDate]);

  const fetchAnnualOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'annual-overview');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/financial?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch annual overview');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching annual overview:', error);
      setError('Failed to load annual overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading annual overview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchAnnualOverview} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Annual Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No annual data found for the selected period.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const months = data.monthlyBreakdown.map(item => {
    const date = new Date(item.month + '-01');
    return date.toLocaleDateString('en-US', { month: 'short' });
  });

  const monthlySpendingData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Spending ($)',
        data: data.monthlyBreakdown.map(item => item.spent),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Monthly Contributions ($)',
        data: data.monthlyBreakdown.map(item => item.contributions),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const monthlyTokensData = {
    labels: months,
    datasets: [
      {
        label: 'Tokens Purchased',
        data: data.monthlyBreakdown.map(item => item.tokens),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
      },
    ],
  };

  const emergencyBreakdownData = {
    labels: ['Regular Spending', 'Emergency Spending'],
    datasets: [
      {
        data: [data.emergencyAnalysis.regularSpent, data.emergencyAnalysis.emergencySpent],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const summaryMetricsData = {
    labels: ['Utilization Rate', 'Emergency Rate', 'Cost Efficiency'],
    datasets: [
      {
        label: 'Performance Metrics (%)',
        data: [
          data.summary.utilizationRate,
          data.emergencyAnalysis.emergencyPercentage,
          data.summary.overpayment > 0 ? 
            ((data.summary.totalContributions - data.summary.overpayment) / data.summary.totalContributions * 100) : 
            100
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
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
        text: `${data.year} Financial Overview`,
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

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Token Purchases',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tokens',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Emergency vs Regular Spending',
      },
    },
  };

  const metricsOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Key Performance Metrics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
      },
    },
  };

  const renderChartView = () => {
    switch (chartView) {
      case 'monthly':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
              <Line data={monthlySpendingData} options={chartOptions} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
              <Bar data={monthlyTokensData} options={barChartOptions} />
            </div>
          </div>
        );
      case 'emergency':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
              <div className="h-64">
                <Doughnut 
                  data={emergencyBreakdownData} 
                  options={{
                    ...doughnutOptions,
                    maintainAspectRatio: false,
                  }} 
                />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
              <Bar data={summaryMetricsData} options={metricsOptions} />
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <Line data={monthlySpendingData} options={chartOptions} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Annual Financial Overview - {data.year}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Comprehensive yearly financial summary from {new Date(data.period.startDate).toLocaleDateString()} to {new Date(data.period.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartView === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('monthly')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Monthly
          </Button>
          <Button
            variant={chartView === 'emergency' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('emergency')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </Button>
          <Button
            variant={chartView === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('summary')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Summary
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${data.summary.totalSpent.toFixed(2)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Total Spent</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {data.summary.totalTokensPurchased.toLocaleString()}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Tokens Purchased</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {data.summary.utilizationRate.toFixed(1)}%
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Utilization Rate</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ${data.summary.averageCostPerToken.toFixed(4)}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Avg Cost/Token</div>
        </div>
      </div>

      {/* Dynamic Chart View */}
      {renderChartView()}

      {/* Financial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Analysis */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Emergency Purchase Analysis
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Spending:</span>
              <span className="font-medium text-red-600">
                ${data.emergencyAnalysis.emergencySpent.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Rate:</span>
              <span className="font-medium">
                {data.emergencyAnalysis.emergencyPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Purchases:</span>
              <span className="font-medium">
                {data.emergencyAnalysis.emergencyPurchases} of {data.emergencyAnalysis.emergencyPurchases + data.emergencyAnalysis.regularPurchases}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-slate-600 dark:text-slate-400">Premium Paid:</span>
              <span className="font-medium text-red-600">
                ${data.emergencyAnalysis.emergencyPremium.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Efficiency */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Financial Efficiency
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Total Contributions:</span>
              <span className="font-medium text-blue-600">
                ${data.summary.totalContributions.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Active Contributors:</span>
              <span className="font-medium">
                {data.summary.contributorCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Token Utilization:</span>
              <span className={`font-medium ${data.summary.utilizationRate > 85 ? 'text-green-600' : 'text-orange-600'}`}>
                {data.summary.utilizationRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-slate-600 dark:text-slate-400">Net Overpayment:</span>
              <span className={`font-medium ${data.summary.overpayment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.overpayment >= 0 ? '+' : ''}${data.summary.overpayment.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Monthly Financial Breakdown
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contributions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Purchases
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.monthlyBreakdown.map((month, index) => {
                const balance = month.contributions - month.spent;
                const monthDate = new Date(month.month + '-01');
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
                      ${month.spent.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      ${month.contributions.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {month.tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {month.purchases}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}