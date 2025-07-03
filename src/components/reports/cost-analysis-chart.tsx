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
import { Loader2, DollarSign, AlertTriangle } from 'lucide-react';
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

interface CostAnalysisChartProps {
  startDate?: string;
  endDate?: string;
}

interface CostAnalysis {
  date: string;
  month: string;
  totalTokens: number;
  totalPayment: number;
  costPerToken: number;
  isEmergency: boolean;
  emergencyPremium: number;
  runningAverageCost: number;
  purchaseNumber: number;
}

export function CostAnalysisChart({ startDate, endDate }: CostAnalysisChartProps) {
  const [data, setData] = useState<CostAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);

  useEffect(() => {
    fetchCostAnalysis();
  }, [startDate, endDate]);

  const fetchCostAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'cost-analysis');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/usage?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cost analysis');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      // console.error removed
      setError('Failed to load cost analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading cost analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchCostAnalysis} variant="outline">
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
          No cost data found for the selected time period. Try adjusting your date range.
        </p>
      </div>
    );
  }

  const filteredData = showEmergencyOnly ? data.filter(item => item.isEmergency) : data;

  // Prepare chart data
  const labels = filteredData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Cost per Token ($)',
        data: filteredData.map(item => item.costPerToken),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        pointBackgroundColor: filteredData.map(item => 
          item.isEmergency ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
        ),
        pointBorderColor: filteredData.map(item => 
          item.isEmergency ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
        ),
        pointRadius: 5,
      },
      {
        label: 'Running Average',
        data: filteredData.map(item => item.runningAverageCost),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 2,
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
        text: 'Cost per kWh Analysis Over Time',
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const dataIndex = context.dataIndex;
            const item = filteredData[dataIndex];
            if (item.isEmergency) {
              return `Emergency Purchase (+$${item.emergencyPremium.toFixed(4)} premium)`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cost per Token ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Purchase Date',
        },
      },
    },
  };

  // Calculate statistics
  const regularPurchases = data.filter(item => !item.isEmergency);
  const emergencyPurchases = data.filter(item => item.isEmergency);
  
  const avgRegularCost = regularPurchases.length > 0 
    ? regularPurchases.reduce((sum, item) => sum + item.costPerToken, 0) / regularPurchases.length
    : 0;
  
  const avgEmergencyCost = emergencyPurchases.length > 0
    ? emergencyPurchases.reduce((sum, item) => sum + item.costPerToken, 0) / emergencyPurchases.length
    : 0;

  const totalEmergencyPremium = emergencyPurchases.reduce((sum, item) => sum + item.emergencyPremium * item.totalTokens, 0);
  
  const costTrend = data.length > 1 
    ? data[data.length - 1].costPerToken - data[0].costPerToken
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Cost per kWh Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track cost trends and identify patterns in pricing over time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmergencyOnly(false)}
          >
            All Purchases
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmergencyOnly(true)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Only
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${avgRegularCost.toFixed(4)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Avg Regular Cost</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            ${avgEmergencyCost.toFixed(4)}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Avg Emergency Cost</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ${totalEmergencyPremium.toFixed(2)}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Total Premium Paid</div>
        </div>
        <div className={`p-4 rounded-lg ${
          costTrend >= 0 
            ? 'bg-red-50 dark:bg-red-950' 
            : 'bg-green-50 dark:bg-green-950'
        }`}>
          <div className={`text-2xl font-bold ${
            costTrend >= 0 
              ? 'text-red-900 dark:text-red-100' 
              : 'text-green-900 dark:text-green-100'
          }`}>
            {costTrend >= 0 ? '+' : ''}${costTrend.toFixed(4)}
          </div>
          <div className={`text-sm ${
            costTrend >= 0 
              ? 'text-red-700 dark:text-red-300' 
              : 'text-green-700 dark:text-green-300'
          }`}>
            Cost Trend
          </div>
        </div>
      </div>

      {/* Main Cost Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Cost Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency vs Regular Comparison */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Purchase Type Comparison
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Regular Purchases:</span>
              <span className="font-medium">{regularPurchases.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Purchases:</span>
              <span className="font-medium text-red-600">{emergencyPurchases.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Rate:</span>
              <span className="font-medium">
                {data.length > 0 ? ((emergencyPurchases.length / data.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-slate-600 dark:text-slate-400">Premium per Emergency Token:</span>
              <span className="font-medium text-red-600">
                ${avgEmergencyCost > avgRegularCost ? (avgEmergencyCost - avgRegularCost).toFixed(4) : '0.0000'}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Volatility Analysis */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
            Cost Volatility
          </h4>
          <div className="space-y-4">
            {data.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Lowest Cost:</span>
                  <span className="font-medium text-green-600">
                    ${Math.min(...data.map(item => item.costPerToken)).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Highest Cost:</span>
                  <span className="font-medium text-red-600">
                    ${Math.max(...data.map(item => item.costPerToken)).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Cost Range:</span>
                  <span className="font-medium">
                    ${(Math.max(...data.map(item => item.costPerToken)) - 
                       Math.min(...data.map(item => item.costPerToken))).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-slate-600 dark:text-slate-400">Current Running Avg:</span>
                  <span className="font-medium">
                    ${data[data.length - 1].runningAverageCost.toFixed(4)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Purchase History Details
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cost/Token
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Running Avg
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {item.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${item.totalPayment.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={item.isEmergency ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                      ${item.costPerToken.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.isEmergency 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {item.isEmergency ? 'Emergency' : 'Regular'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${item.runningAverageCost.toFixed(4)}
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